const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const xss = require('xss');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { MongoMemoryServer } = require('mongodb-memory-server');

dotenv.config();

const app = express();

// Security middleware
app.use(helmet());
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json({ limit: '10kb' }));

// Basic API rate limiter
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/history', apiLimiter);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: FRONTEND_URL } });

const PORT = process.env.PORT || 3000;

const Message = require('./models/Message');

let dbConnected = false;
let _mongoMemoryServer = null;

async function ensureDatabase() {
  if (process.env.MONGO_URI) {
    try {
      await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
      dbConnected = true;
      console.log('Connected to MongoDB');
    } catch (err) {
      console.error('MongoDB connection error:', err.message);
    }
    return;
  }

  // No MONGO_URI — start an ephemeral in-memory MongoDB for development so messages
  // persist while the server is running. This avoids requiring Atlas credentials
  // for local development and demos.
  try {
    console.log('MONGO_URI not set — starting ephemeral in-memory MongoDB for development');
    _mongoMemoryServer = await MongoMemoryServer.create();
    const uri = _mongoMemoryServer.getUri();
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    dbConnected = true;
    console.log('Connected to in-memory MongoDB');
  } catch (err) {
    console.error('Failed to start in-memory MongoDB:', err && err.message ? err.message : err);
  }
}

// Start DB connection attempt (don't block socket server startup) -- handlers will
// gracefully fall back to in-memory JS store until mongoose is connected.
ensureDatabase().catch(err => console.error('ensureDatabase error', err));

// Simple in-memory store for rooms/users when DB not used
const rooms = {}; // { roomName: { users: [{id, username}] } }

// Per-socket message rate limiting (sliding window simple counter)
const MSG_WINDOW_SEC = Number(process.env.MSG_RATE_WINDOW_SEC) || 5;
const MSG_MAX = Number(process.env.MSG_RATE_MAX) || 8;
const socketMsgMap = new Map(); // socketId -> { count, windowStart }

app.get('/history/:room', async (req, res) => {
  const room = req.params.room;
  if (dbConnected) {
    try {
      const msgs = await Message.find({ room }).sort({ createdAt: 1 }).limit(100).lean();
      return res.json({ messages: msgs });
    } catch (err) {
      return res.status(500).json({ error: 'DB error' });
    }
  }
  const data = rooms[room] || { messages: [] };
  res.json({ messages: data.messages || [] });
});

// Serve frontend static files if built
app.use(express.static(path.join(__dirname, '..', 'frontend')));

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);

  socket.on('join', ({ username, room }) => {
    if (!username || !room) return;
    // basic validation / limits
    username = String(username).trim().slice(0, 50);
    room = String(room).trim().slice(0, 100);

    socket.join(room);
    rooms[room] = rooms[room] || { users: [], messages: [] };
    rooms[room].users.push({ id: socket.id, username });

    // send room data
    io.to(room).emit('roomData', { room, users: rooms[room].users.map(u => u.username) });

    // welcome messages
    socket.emit('message', { username: 'System', text: `Welcome ${username}`, createdAt: new Date() });
    socket.to(room).emit('message', { username: 'System', text: `${username} has joined`, createdAt: new Date() });
  });

  socket.on('sendMessage', async ({ room, username, text }, callback) => {
    try {
      // validate
      if (!text || !room || !username) {
        if (callback) callback('Invalid data');
        return;
      }
      room = String(room).trim().slice(0, 100);
      username = String(username).trim().slice(0, 50);
      text = String(text).trim();
      if (text.length === 0 || text.length > 2000) {
        if (callback) callback('Message length invalid');
        return;
      }

      // per-socket rate limit
      const now = Date.now();
      const entry = socketMsgMap.get(socket.id) || { count: 0, windowStart: now };
      if (now - entry.windowStart > MSG_WINDOW_SEC * 1000) {
        entry.count = 0;
        entry.windowStart = now;
      }
      entry.count += 1;
      socketMsgMap.set(socket.id, entry);
      if (entry.count > MSG_MAX) {
        if (callback) callback('Rate limit exceeded');
        return;
      }

      // sanitize text to prevent stored XSS
      const cleanText = xss(text);
      const messageData = { room, username, text: cleanText, createdAt: new Date() };

      // Save to DB if connected, otherwise keep in-memory
      if (dbConnected) {
        try {
          const msg = new Message(messageData);
          await msg.save();
        } catch (err) {
          console.error('Failed saving message to DB', err.message);
        }
      } else {
        rooms[room] = rooms[room] || { users: [], messages: [] };
        rooms[room].messages = rooms[room].messages || [];
        rooms[room].messages.push(messageData);
      }

      io.to(room).emit('message', messageData);
      if (callback) callback();
    } catch (err) {
      console.error('sendMessage error', err);
      if (callback) callback('Server error');
    }
  });

  socket.on('disconnect', () => {
    // remove from rooms
    for (const room in rooms) {
      const idx = rooms[room].users.findIndex(u => u.id === socket.id);
      if (idx !== -1) {
        const username = rooms[room].users[idx].username;
        rooms[room].users.splice(idx, 1);
        io.to(room).emit('message', { username: 'System', text: `${username} left`, createdAt: new Date() });
        io.to(room).emit('roomData', { room, users: rooms[room].users.map(u => u.username) });
      }
    }
    console.log('socket disconnected', socket.id);
  });

  // typing indicator: broadcast to others in the room
  socket.on('typing', ({ room, username }) => {
    if (!room || !username) return;
    socket.to(room).emit('typing', { username });
  });

  socket.on('stopTyping', ({ room, username }) => {
    if (!room || !username) return;
    socket.to(room).emit('stopTyping', { username });
  });
});

server.listen(PORT, () => console.log('Server listening on', PORT));

// Graceful shutdown for in-memory server
async function shutdown() {
  try {
    await mongoose.disconnect();
    if (_mongoMemoryServer) {
      await _mongoMemoryServer.stop();
    }
    console.log('Shutdown complete');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown', err);
    process.exit(1);
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

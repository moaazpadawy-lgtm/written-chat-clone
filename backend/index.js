import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

let rooms = {}; // { roomName: { users: [] } }

io.on("connection", (socket) => {
  console.log("🟢 New connection:", socket.id);

  socket.on("join", ({ username, room }) => {
    socket.join(room);
    if (!rooms[room]) rooms[room] = { users: [] };
    rooms[room].users.push(username);

    io.to(room).emit("roomData", {
      room,
      users: rooms[room].users,
    });

    socket.emit("message", {
      username: "System",
      text: `مرحبًا ${username}! 👋`,
      createdAt: new Date(),
    });
  });

  socket.on("sendMessage", ({ room, username, text }) => {
    io.to(room).emit("message", { username, text, createdAt: new Date() });
  });

  socket.on("disconnect", () => {
    console.log("🔴 Disconnected:", socket.id);
  });
});

const PORT = 5000;
server.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));

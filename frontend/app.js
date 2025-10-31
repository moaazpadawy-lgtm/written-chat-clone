const socket = io();

// elements
const joinScreen = document.getElementById('join-screen');
const chatScreen = document.getElementById('chat-screen');
const joinBtn = document.getElementById('join-btn');
const usernameInput = document.getElementById('username');
const roomInput = document.getElementById('room');
const roomNameEl = document.getElementById('room-name');
const usersEl = document.getElementById('users');
const messagesEl = document.getElementById('messages');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');

let currentRoom = null;
let currentUser = null;

function addMessage({ username, text, createdAt }) {
  const div = document.createElement('div');
  div.className = 'msg';
  const time = new Date(createdAt).toLocaleTimeString();
  div.innerHTML = `<div class="meta"><strong>${username}</strong> <span>${time}</span></div><div class="text">${escapeHtml(text)}</div>`;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

joinBtn.addEventListener('click', () => {
  const username = usernameInput.value.trim();
  const room = roomInput.value.trim();
  if (!username || !room) return alert('Enter name and room');
  currentRoom = room;
  currentUser = username;
  socket.emit('join', { username, room });
  joinScreen.classList.add('hidden');
  chatScreen.classList.remove('hidden');
  roomNameEl.textContent = room;

  // load history
  fetch(`/history/${encodeURIComponent(room)}`).then(r => r.json()).then(data => {
    messagesEl.innerHTML = '';
    data.messages.forEach(addMessage);
  }).catch(() => {});
});

socket.on('message', (msg) => {
  addMessage(msg);
});

socket.on('roomData', ({ room, users }) => {
  usersEl.innerHTML = '';
  users.forEach(u => {
    const li = document.createElement('li');
    li.textContent = u;
    usersEl.appendChild(li);
  });
});

messageForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;
  socket.emit('sendMessage', { room: currentRoom, username: currentUser, text }, (err) => {
    if (err) console.error(err);
    else messageInput.value = '';
  });
});
import React from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Join from "./components/Join"
import Chat from "./components/Chat"
import Signup from "./components/Signup"

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Join />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/signup" element={<Signup />} /> {/* ✅ صفحة إنشاء الحساب */}
      </Routes>
    </Router>
  )
}

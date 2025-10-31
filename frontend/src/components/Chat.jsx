import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import io from "socket.io-client";

const socket = io("http://localhost:5000");

export default function Chat() {
  const { state } = useLocation();
  const { username, room } = state || {};
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    if (!username || !room) return;

    socket.emit("join", { username, room });

    socket.on("message", (msg) => setMessages((prev) => [...prev, msg]));
    return () => socket.off("message");
  }, [username, room]);

  function sendMessage(e) {
    e.preventDefault();
    if (!text.trim()) return;
    socket.emit("sendMessage", { room, username, text });
    setText("");
  }

  return (
    <div className="chat-screen">
      <h2>غرفة: {room}</h2>
      <div className="messages">
        {messages.map((m, i) => (
          <div key={i} className="msg">
            <strong>{m.username}:</strong> {m.text}
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="اكتب رسالة..." />
        <button>إرسال</button>
      </form>
    </div>
  );
}

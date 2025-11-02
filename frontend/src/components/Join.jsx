import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo-transparent.png";
import bgVideo from "../assets/1031.mp4";

export default function Join() {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [currentScreen, setCurrentScreen] = useState("options");
  const navigate = useNavigate();

  function handleJoin(e) {
    e.preventDefault();
    if (!username.trim() || !room.trim()) return alert("ادخل الاسم واسم الغرفة");
    navigate("/chat", { state: { username, room } });
  }

  const RenderOptionsScreen = () => (
    <div className="join-form auth-options-card">
      <div className="auth-buttons-row">
        <button className="join-button secondary-btn" onClick={() => setCurrentScreen("join")}>
          تسجيل الدخول
        </button>
        <button className="join-button primary-btn" onClick={() => navigate("/signup")}>
          إنشاء حساب جديد
        </button>
      </div>
    </div>
  );

  const RenderJoinScreen = () => (
    <form onSubmit={handleJoin} className="join-form auth-form">
      <p>أدخل اسمك والغرفة للمتابعة كزائر</p>
      <input placeholder="اسمك (مؤقت)" value={username} onChange={(e) => setUsername(e.target.value)} />
      <input placeholder="اسم الغرفة" value={room} onChange={(e) => setRoom(e.target.value)} />
      <button type="submit" className="join-button primary-btn full-width-btn">
        ابدأ الدردشة
      </button>
      <a href="#" onClick={() => setCurrentScreen("options")} className="back-link">
        العودة
      </a>
    </form>
  );

  return (
    <div className="join-screen">
      <video autoPlay loop muted className="background-video">
        <source src={bgVideo} type="video/mp4" />
      </video>

      <div className="logo-container">
        <img src={logo} alt="LAMMETNA" className="logo" />
      </div>

      <div className="auth-card-wrapper">
        {currentScreen === "options" ? <RenderOptionsScreen /> : <RenderJoinScreen />}
      </div>
    </div>
  );
}

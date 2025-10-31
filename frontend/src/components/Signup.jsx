import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: "", email: "", password: "" });

  function handleSubmit(e) {
    e.preventDefault();
    alert("تم إنشاء الحساب بنجاح 🎉");
    navigate("/");
  }

  return (
    <div className="signup-screen">
      <h2>إنشاء حساب جديد</h2>
      <form onSubmit={handleSubmit}>
        <input placeholder="الاسم" value={user.name} onChange={(e) => setUser({ ...user, name: e.target.value })} />
        <input placeholder="الإيميل" value={user.email} onChange={(e) => setUser({ ...user, email: e.target.value })} />
        <input type="password" placeholder="كلمة المرور" value={user.password} onChange={(e) => setUser({ ...user, password: e.target.value })} />
        <button type="submit">تسجيل</button>
      </form>
      <a href="#" onClick={() => navigate("/")}>
        العودة
      </a>
    </div>
  );
}

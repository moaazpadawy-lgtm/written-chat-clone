import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Join from "./components/Join";
import Chat from "./components/Chat";
import Signup from "./components/Signup";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Join />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </Router>
  );
}

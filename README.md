# LAMMETNA (MVP)

Minimal real-time chat MVP (LAMMETNA) using Express + Socket.io and a static frontend.

How to run locally (Windows PowerShell):

1. Install Node.js (LTS) if you don't have it.
2. Open PowerShell and run:

```powershell
cd C:\Users\DELL\Desktop\written-chat-clone\backend
npm install
npm run dev
```

3. Open your browser at http://localhost:3000 and you should see the LAMMETNA join screen.

Notes:
- This is an MVP that stores data in memory. For production replace with MongoDB (see earlier plan).
- The frontend is served from the backend static folder for simplicity.

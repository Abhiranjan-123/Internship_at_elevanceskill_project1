# Global Workspace - Real-Time Communication Platform

A clean, high-performance, real-time multi-lingual workspace engine featuring secure authentication, live comment streams, community-driven moderation, and secure data storage.

## 🚀 Tech Stack

- **Frontend:** React.js, Vite, CSS Modules
- **Backend:** Node.js, Express.js
- **Database & Auth:** Supabase (PostgreSQL)
- **Deployment:** Vercel (Frontend) & Render (Backend)

## ✨ Key Features

- **Identity Authorization:** Secure signup and signin workflow powered by Supabase Auth with custom backend proxies.
- **Real-Time Stream Sync:** Efficient 5-second polling synchronization engine to fetch live workspace insights dynamically.
- **Interactive Vote Engine:** High-speed atomic counters for comment verification using optimized database RPC functions.
- **Community Moderation:** Smart content validation filtering malicious formatting syntax and automated content purging on multiple dislikes.
- **On-Demand Translation Engine:** Contextual mockup mapping framework supporting English (EN), Español (ES), and 日本語 (JA).
- **Theme Adaptability:** Persistent Day/Night layout customization using native `localStorage` attributes.

## 📂 Project Structure

```text
├── backend/
│   ├── server.js          # Express application pipeline & API routing
│   ├── .gitignore         # Ignores node_modules, dist, and .env keys
│   └── package.json
└── frontend/
    ├── src/
    │   ├── CommentSection.jsx       # Stream layout, states & dispatch actions
    │   ├── CommentSection.module.css # Scoped visual styling tokens
    │   └── main.jsx
    └── package.json

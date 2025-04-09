# 📺 VidTube Backend — Node.js + MongoDB + Cloudinary

A fully functional backend for a video-sharing platform like YouTube. Built with **Node.js**, **Express**, and **MongoDB**, and integrated with **Cloudinary** for media storage.

## 🚀 Features

- 🔐 **Authentication** — JWT with refresh tokens (secure, httpOnly cookies)
- 🧾 **User Management** — Registration, login, logout, profile update
- 🖼️ **Image Uploads** — Avatar & cover images (via Cloudinary)
- 🎥 **Video Management** — Upload, metadata (title, duration, views)
- 📃 **Playlists** — Create and manage collections of videos
- 📜 **Watch History** — Track what each user watches
- 💬 **Comments & Likes** — For videos, tweets, and comments
- 🐦 **Tweet Posts** — User micro-post functionality
- 👥 **Subscriptions** — Follow and subscribe to other users
- ☁️ **Cloudinary Integration** — Automatic cleanup of local files
- 🧪 **Robust Error Handling** — Custom `ApiError`, `ApiResponse`, and `asyncHandler`
- 📁 **Multer for File Uploads** — Local storage for temporary files

## 🧱 Tech Stack

- Node.js
- Express.js
- MongoDB + Mongoose
- Cloudinary
- Multer
- JWT (Access & Refresh Tokens)
- Cookie Parser
- dotenv

## 🛠️ Folder Structure

├── controllers/ ├── models/ ├── routes/ ├── middlewares/ ├── utils/ ├── public/temp/ # multer temp storage ├── .env ├── App.js ├── index.js

makefile
Copy
Edit

## ⚙️ Environment Setup

Add a `.env` file:

```env
PORT=8000
MONGODB_URI=your-mongodb-uri
ACCESS_TOKEN_SECRET=...
REFRESH_TOKEN_SECRET=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
📦 Getting Started
bash
Copy
Edit
npm install
npm run dev
Runs on http://localhost:8000 by default.

🧠 Author
Built with ❤️ by Saksham Gupta

📄 License
MIT License

yaml
Copy
Edit

---

Let me know if you'd like me to generate a `README.md` file directly or help with deploying this project t

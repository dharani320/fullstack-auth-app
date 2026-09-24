# Full Stack Authentication App

A full-stack authentication application built with React, Node.js, Express, and PostgreSQL.

## 🚀 Features

- User registration
- Secure password hashing with bcrypt
- User login
- PostgreSQL database integration
- Dashboard after login
- Logout functionality
- Duplicate email protection
- Responsive neon/glassmorphism UI
- Environment variables for database credentials

## 🛠️ Tech Stack

### Frontend
- React
- JavaScript
- HTML
- CSS

### Backend
- Node.js
- Express.js
- PostgreSQL
- bcrypt
- dotenv
- CORS

## 🔐 Security

Passwords are hashed using bcrypt before being stored in the database.

Database credentials are stored in environment variables and are excluded from Git using `.gitignore`.

## 📁 Project Structure

```text
fullstack/
├── backend/
│   └── server.js
├── frontend/
│   ├── src/
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
├── .gitignore
├── package.json
└── package-lock.json
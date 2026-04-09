# 🛍️ ShopAI - E-commerce with AI Chatbot

[![Docker](https://img.shields.io/badge/Docker-Containerized-blue)](https://www.docker.com/)
[![Flask](https://img.shields.io/badge/Flask-Backend-green)](https://flask.palletsprojects.com/)
[![MySQL](https://img.shields.io/badge/MySQL-Database-orange)](https://www.mysql.com/)

**3-tier e-commerce platform with AI chatbot powered by TinyLlama.** Fully containerized with Docker.

## 🏗️ Architecture

Browser → Nginx:8080 → Flask:5000 → MySQL:3306
↓
Ollama/TinyLlama (AI)



## ✨ Features

- ✅ User registration & JWT authentication
- ✅ Product browsing & shopping cart
- ✅ Order placement
- ✅ AI chatbot (local, no API costs)

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | HTML/CSS/JS + TailwindCSS |
| Backend | Python + Flask |
| Database | MySQL 8.0 |
| AI | Ollama + TinyLlama |
| Proxy | Nginx |
| Container | Docker + Docker Compose |

## 🚀 Quick Start

```bash
# Clone & start
git clone https://github.com/yourusername/ecommerce-ai-chatbot.git
cd ecommerce-ai-chatbot
docker-compose up -d

# Open browser
http://localhost:8080

```

📦 Prerequisites
Docker & Docker Compose

4GB RAM minimum


📁 Project Structure

ecommerce-ai-chatbot/
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── init.sql
├── frontend/
│   ├── index.html
│   ├── script.js
│   └── style.css
├── docker-compose.yml
├── nginx.conf
└── README.md


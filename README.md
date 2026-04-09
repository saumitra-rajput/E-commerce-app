# 🛍️ ShopHub - E-commerce Platform

A complete 3-tier e-commerce platform with authentication, cart, and orders. Fully containerized with Docker.

## 🚀 Quick Start

```

# Clone and start
git clone https://github.com/yourusername/ecommerce-app.git
cd ecommerce-app
docker-compose up -d

# Open browser
http://localhost:8080

```

✨ Features
User auth (JWT)

Products with images

Shopping cart

Orders history


🛠️ Tech Stack
Frontend: HTML/CSS/JS + TailwindCSS

Backend: Python + Flask

Database: MySQL

Proxy: Nginx

Container: Docker


📁 Structure
text
backend/     # Flask API
frontend/    # Static files
docker-compose.yml
nginx.conf


🔧 Commands
bash
docker-compose up -d      # Start
docker-compose down       # Stop
docker-compose logs -f    # Logs
docker-compose restart backend


📚 API
Endpoint	Method	Description
/api/register	POST	Create account
/api/login	POST	Login
/api/products	GET	List products
/api/orders	POST/GET	Orders (auth)


🧪 Test
bash
curl http://localhost:8080/api/health
curl http://localhost:8080/api/products


🔐 .env file
env
MYSQL_ROOT_PASSWORD=root123
JWT_SECRET_KEY=your-secret-key
FRONTEND_PORT=8080


🌐 Access
Frontend: http://localhost:8080

API: http://localhost:5000/api

Built with ❤️


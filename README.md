# 🛍️ ShopHub - E-commerce Platform

A complete **3-tier e-commerce platform** with authentication, cart, and orders — fully containerized with Docker and secured with a **DevSecOps CI/CD pipeline**.

---

## 🚀 Quick Start

```bash
# Clone and start
git clone https://github.com/yourusername/ecommerce-app.git
cd ecommerce-app
docker-compose up -d

# Open browser
http://localhost:8080
```

---

## ✨ Features

- User authentication with JWT
- Product listing with images
- Shopping cart
- Order history
- Fully automated DevSecOps pipeline

---

## 🛠️ Tech Stack

| Layer      | Technology                  |
|------------|-----------------------------|
| Frontend   | HTML / CSS / JS + TailwindCSS |
| Backend    | Python + Flask              |
| Database   | MySQL 8.0                   |
| Proxy      | Nginx                       |
| Container  | Docker + Docker Compose     |
| CI/CD      | GitHub Actions              |

---

## 📁 Project Structure

```
├── .github/
│   └── workflows/
│       ├── devsecops.yml         # Main pipeline (orchestrator)
│       ├── code-quality.yml      # Lint + SAST
│       ├── secret-scan.yml       # GitLeaks secret scan
│       ├── dependencies-scan.yml # pip-audit scan
│       ├── docker-scan.yml       # Hadolint Dockerfile scan
│       ├── build-push.yml        # Build & push Docker image
│       ├── image-scan.yml        # Trivy image scan
│       └── deploy.yml            # Deploy to EC2
├── backend/
│   ├── app.py                    # Flask API
│   ├── init.sql                  # DB seed data
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── script.js
│   └── style.css
├── docker-compose.yml
└── nginx.conf
```

---

## 🔐 CI/CD Pipeline — DevSecOps

The pipeline is triggered on every push to `main` and runs security checks **before** building or deploying anything.

```
Push to main
     │
     ├── code-quality       (Flake8 + Bandit)
     ├── secret-scan        (GitLeaks)
     ├── dependencies-scan  (pip-audit)
     ├── docker-scan        (Hadolint)
     │
     └── build-push         (only if all above pass)
          │
          └── image-scan    (Trivy)
               │
               └── deploy-to-prod  (SSH → EC2)
```

### Pipeline Jobs

#### 1. `code-quality` — Lint & SAST
- **Flake8** for Python linting (PEP8 compliance)
- **Bandit** for Static Application Security Testing (SAST)
- Uses **matrix strategy** to run across multiple Python versions

#### 2. `secret-scan` — Secret Detection
- **GitLeaks** scans the entire git history for accidentally committed secrets, API keys, or credentials

#### 3. `dependencies-scan` — Dependency Audit
- **pip-audit** scans `requirements.txt` for known CVEs in Python packages

#### 4. `docker-scan` — Dockerfile Validation
- **Hadolint** lints the `Dockerfile` for best practices and security issues

#### 5. `build-push` — Build & Push Image
- Logs into **Docker Hub**
- Builds the Docker image
- Tags and pushes with the Git commit SHA:
  ```
  <DOCKERHUB_USER>/e-commerce:<github.sha>
  ```

#### 6. `image-scan` — Container Image Scan
- Logs into Docker Hub
- Runs **Trivy** to scan the pushed image for OS and library vulnerabilities:
  ```
  <DOCKERHUB_USER>/e-commerce:<github.sha>
  ```

#### 7. `deploy` — Deploy to Production (EC2)
- SSHs into the EC2 instance
- Creates `~/production/` folder if it doesn't exist
- Installs **Docker** and **Docker Compose** if not present
- Adds the local user to the `docker` group
- Copies all required files (`docker-compose.yml`, `nginx.conf`, `backend/`) to `/production/`
- Pulls the new Docker image using the exact `github.sha` tag
- Tears down old containers with `docker compose down -v`
- Recreates everything fresh with `--force-recreate --pull always`

---

## 🔧 Docker Commands

```bash
docker compose up -d              # Start all services
docker compose down               # Stop all services
docker compose down -v            # Stop and remove volumes
docker compose logs -f            # Stream logs
docker compose restart web-backend  # Restart backend only
```

---

## 📚 API Reference

| Endpoint        | Method     | Auth Required | Description       |
|-----------------|------------|---------------|-------------------|
| `/api/health`   | GET        | No            | Health check      |
| `/api/register` | POST       | No            | Create account    |
| `/api/login`    | POST       | No            | Login (get JWT)   |
| `/api/products` | GET        | No            | List all products |
| `/api/orders`   | POST / GET | Yes (JWT)     | Place / get orders|

---

## 🧪 Test the API

```bash
# Health check
curl http://localhost:8080/api/health

# Get products
curl http://localhost:8080/api/products

# Register a user
curl -X POST http://localhost:8080/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","password":"pass123"}'
```

---

## 🔐 Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```env
MYSQL_ROOT_PASSWORD=root123
MYSQL_USER=appuser
MYSQL_PASSWORD=apppass
MYSQL_DB=ecommerce
JWT_SECRET=your-secret-key-at-least-32-bytes-long
FRONTEND_PORT=8080
```

### GitHub Secrets Required

| Secret / Variable       | Used In              |
|-------------------------|----------------------|
| `DOCKERHUB_USER`        | build-push, image-scan |
| `DOCKERHUB_SECRET`      | build-push, image-scan |
| `EC2_HOST`              | deploy               |
| `EC2_USER`              | deploy               |
| `EC2_SSH_KEY`           | deploy               |

---

## 🌐 Access

| Service  | URL                          |
|----------|------------------------------|
| Frontend | http://localhost:8080        |
| API      | http://localhost:8080/api    |
| Backend  | http://localhost:5000 (internal) |

---

## 📜 License

MIT License — see [LICENSE](./LICENSE) for details.

Built with ❤️ and secured with 🔒
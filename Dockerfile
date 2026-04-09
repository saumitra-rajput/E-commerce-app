# Stage 1: build frontend
FROM node:18 AS frontend-build
WORKDIR /app/frontend
COPY frontend/ .
RUN npm install && npm run build  # or skip if plain HTML/JS

# Stage 2: build backend
FROM python:3.11-slim
WORKDIR /app
COPY backend/ .
COPY --from=frontend-build /app/frontend/dist ./static  # static files for Flask
RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 8080
CMD ["python", "app.py"]

FROM python:3.11-slim

# hadolint ignore=DL3008,DL3015
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

COPY .env .                   

CMD ["python", "app.py"]
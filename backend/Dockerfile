FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Explicitly set environment variables
ENV PORT=5001
ENV ENVIRONMENT=production

# Expose correct port
EXPOSE 5001

# Make start.sh executable and use it to start the application
RUN chmod +x start.sh
CMD ["./start.sh"] 
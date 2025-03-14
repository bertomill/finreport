#!/bin/bash
# Direct startup script for Railway deployment

echo "===== Starting application on port 5001 ====="
echo "Current directory: $(pwd)"
echo "Files in directory: $(ls -la)"
echo "===== Starting Gunicorn ====="

# Give Railway time to establish its health check
sleep 5

# Start the application
exec gunicorn app:app --bind=0.0.0.0:5001 --workers=2 --worker-class=uvicorn.workers.UvicornWorker --log-level=debug 
import os

# Get port from environment variable or default to 10000 for Render
port = int(os.getenv("PORT", 10000))
bind = f"0.0.0.0:{port}"
workers = 2
timeout = 120
worker_class = "uvicorn.workers.UvicornWorker"
# For logging
accesslog = "-"
errorlog = "-"
loglevel = "info"
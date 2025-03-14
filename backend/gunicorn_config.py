import os

# Force port 5001 for Railway deployment
port = 5001
bind = f"0.0.0.0:{port}"
workers = 2
timeout = 120
worker_class = "uvicorn.workers.UvicornWorker"
# For better debugging
accesslog = "-"
errorlog = "-"
loglevel = "debug"
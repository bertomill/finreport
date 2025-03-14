import os

bind = f"0.0.0.0:{os.getenv('PORT', '5001')}"
workers = 2
timeout = 120
worker_class = "uvicorn.workers.UvicornWorker"
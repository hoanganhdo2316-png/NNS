#!/bin/bash
cd /root/NNS/backend
source venv/bin/activate
exec /usr/local/bin/uvicorn main:app --host 0.0.0.0 --port 8000

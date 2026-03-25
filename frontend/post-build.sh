#!/bin/bash
cd /root/NNS/frontend
npm run build
ln -sf index.html dist/admin-index.html
ln -sf index.html dist/agent-index.html
echo "✅ Build + symlinks done"

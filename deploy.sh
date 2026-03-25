#!/bin/bash
cd /root/NNS/frontend
npm run build

# Tạo agent-index.html
cp dist/index.html dist/agent-index.html
sed -i 's|href="/manifest.json"|href="/agent-manifest.json"|g' dist/agent-index.html
sed -i 's|content="#2e7d32" />|content="#0d47a1" />|g' dist/agent-index.html
sed -i 's|content="NNS"|content="NNS Đại lý"|g' dist/agent-index.html
sed -i 's|href="/icon-192.png"|href="/icon-agent-192.png"|g' dist/agent-index.html

# Tạo admin-index.html
cp dist/index.html dist/admin-index.html
sed -i 's|href="/manifest.json"|href="/admin-manifest.json"|g' dist/admin-index.html
sed -i 's|content="#2e7d32" />|content="#e65100" />|g' dist/admin-index.html
sed -i 's|content="NNS"|content="NNS Admin"|g' dist/admin-index.html
sed -i 's|href="/icon-192.png"|href="/icon-admin-192.png"|g' dist/admin-index.html

echo "Deploy done!"

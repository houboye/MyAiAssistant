#!/bin/bash

# AI Assistant - 一键启动脚本
# ============================

echo "🚀 正在启动 AI 智能助手..."

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# 启动 AI Server (Python FastAPI)
echo -e "${BLUE}[1/3]${NC} 启动 AI Server (端口: 5000)..."
cd "$SCRIPT_DIR/aiServer"
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt -q
python main.py &
AI_PID=$!

# 启动 Backend (Node.js Express)
echo -e "${BLUE}[2/3]${NC} 启动 Backend Server (端口: 4000)..."
cd "$SCRIPT_DIR/backend"
npm install --silent
npm run dev &
BACKEND_PID=$!

# 启动 Frontend (Vite)
echo -e "${BLUE}[3/3]${NC} 启动 Frontend (端口: 3000)..."
cd "$SCRIPT_DIR/frontend"
npm install --silent
npm run dev &
FRONTEND_PID=$!

# 等待所有服务启动
sleep 3

echo ""
echo -e "${GREEN}✨ 所有服务已启动!${NC}"
echo ""
echo "📱 前端地址: http://localhost:3000"
echo "🔧 后端地址: http://localhost:4000"
echo "🤖 AI服务地址: http://localhost:5000"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 捕获退出信号
trap "kill $AI_PID $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM

# 等待
wait


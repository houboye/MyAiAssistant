# 🤖 AI 智能助手

一个集成了 AI 问答和搜索引擎对比功能的智能助手应用。

## ✨ 功能特性

- **AI 问答**: 支持多种 AI 提供商 (OpenAI, DeepSeek, Claude, Grok, 智谱)
- **智能搜索**: 自动提取关键词，支持 Google/Bing/百度等搜索引擎
- **内容对比**: AI 回答与搜索结果的相同点/不同点分析
- **会话管理**: 支持历史会话存储和管理
- **主题切换**: 支持深色/浅色主题

## 🛠 技术栈

- **Frontend**: React + TypeScript + Vite + Zustand
- **Backend**: Node.js + Express
- **AI Server**: Python + FastAPI + OpenAI SDK

## 🚀 快速开始

### 方式一：一键启动

```bash
chmod +x start.sh
./start.sh
```

### 方式二：分别启动

**1. 启动 AI Server**
```bash
cd aiServer
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

**2. 启动 Backend**
```bash
cd backend
npm install
npm run dev
```

**3. 启动 Frontend**
```bash
cd frontend
npm install
npm run dev
```

## 🖥 服务端口说明

| 服务 | 端口 | 说明 |
|------|------|------|
| Frontend | 3000 | React 前端界面 |
| Backend | 4000 | Node.js 后端 API |
| AI Server | 5001 | Python FastAPI AI 服务 |

## 📱 访问应用

启动后访问: http://localhost:3000

## ⚙️ 配置说明

### AI 服务配置

在应用界面右上角点击设置图标，配置你的 AI 服务：

1. 选择 AI 提供商 (OpenAI/DeepSeek/Claude/Grok)
2. 选择模型
3. 输入对应的 API Key

> 💡 不配置 API Key 也可以使用，系统会提供模拟的 AI 回答

### 搜索引擎配置

在搜索面板右上角的下拉菜单中选择搜索引擎：
- Google
- Bing  
- 百度

## 📁 项目结构

```
myAssistant/
├── frontend/          # 前端项目
│   ├── src/
│   │   ├── components/  # React 组件
│   │   ├── store/       # Zustand 状态管理
│   │   ├── services/    # API 服务
│   │   ├── types/       # TypeScript 类型
│   │   └── styles/      # CSS 样式
│   └── package.json
├── backend/           # 后端项目
│   ├── src/
│   │   ├── routes/     # 路由处理
│   │   └── index.js    # 入口文件
│   └── package.json
├── aiServer/          # AI 服务
│   ├── main.py        # FastAPI 应用
│   └── requirements.txt
├── PRD.md             # 产品需求文档
├── UI.jpeg            # UI 设计稿
└── start.sh           # 一键启动脚本
```

## 🎯 使用说明

1. **开始对话**: 在底部输入框输入问题，点击发送按钮
2. **查看 AI 回答**: AI 的回答会显示在左侧面板
3. **自动搜索**: 系统会自动提取关键词并搜索
4. **编辑关键词**: 点击关键词可以编辑，点击 ✕ 删除
5. **查看对比**: 搜索完成后会显示与 AI 回答的相同点和不同点
6. **新建对话**: 点击左侧 "新对话" 按钮开始新的会话
7. **切换主题**: 点击左下角的主题切换按钮

## 📝 License

MIT License


from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict
import os
import httpx
import json
import traceback
from openai import OpenAI

app = FastAPI(title="AI Assistant Server", version="1.0.0")

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 请求模型
class AIConfig(BaseModel):
    provider: str = "openai"
    model: str = "gpt-3.5-turbo"
    apiKey: str = ""

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    sessionId: str
    message: str
    config: AIConfig
    history: List[ChatMessage] = []

class ChatResponse(BaseModel):
    reply: str
    keywords: List[str]
    error: Optional[str] = None
    errorType: Optional[str] = None

class HealthRequest(BaseModel):
    provider: str
    apiKey: str

class ExtractKeywordsRequest(BaseModel):
    messages: List[ChatMessage]
    config: AIConfig

class ExtractKeywordsResponse(BaseModel):
    keywords: List[str]
    searchQuery: str

# AI提供商配置
AI_PROVIDERS = {
    "openai": {
        "base_url": "https://api.openai.com/v1",
        "models": ["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo"],
        "name": "OpenAI"
    },
    "deepseek": {
        "base_url": "https://api.deepseek.com",
        "models": ["deepseek-chat", "deepseek-coder"],
        "name": "DeepSeek"
    },
    "claude": {
        "base_url": "https://api.anthropic.com/v1",
        "models": ["claude-3-opus", "claude-3-sonnet", "claude-3-haiku"],
        "name": "Claude"
    },
    "grok": {
        "base_url": "https://api.x.ai/v1",
        "models": ["grok-1"],
        "name": "Grok"
    },
    "zhipu": {
        "base_url": "https://open.bigmodel.cn/api/paas/v4",
        "models": ["glm-4-plus", "glm-4", "glm-4-flash", "glm-4-air"],
        "name": "智谱AI"
    }
}

# 会话历史存储
session_histories: Dict[str, List[dict]] = {}

def get_ai_client(config: AIConfig):
    """获取AI客户端"""
    provider_config = AI_PROVIDERS.get(config.provider)
    if not provider_config:
        raise ValueError(f"不支持的AI提供商: {config.provider}")
    
    return OpenAI(
        api_key=config.apiKey,
        base_url=provider_config["base_url"]
    )

def extract_keywords_from_text(text: str, stop_words: set) -> List[str]:
    """从单个文本中提取关键词"""
    import re
    words = re.findall(r'[\u4e00-\u9fa5]+|[a-zA-Z]+', text.lower())
    keywords = [w for w in words if w not in stop_words and len(w) > 1]
    return keywords

def extract_keywords_from_context(current_message: str, history: List[dict]) -> List[str]:
    """从整个对话上下文中提取关键词"""
    stop_words = {'的', '是', '在', '了', '和', '与', '或', '这', '那', '有', '我', '你', '他', '她', '它',
                  '吗', '呢', '啊', '哦', '嗯', '呀', '吧', '么', '把', '被', '给', '让', '向', '对',
                  '如何', '怎么', '怎样', '什么', '为什么', '哪个', '哪些', '多少', '几', '一个',
                  '可以', '能', '会', '要', '想', '请', '帮', '告诉', '知道', '需要', '使用',
                  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
                  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall',
                  'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through',
                  'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'it', 'and', 'how',
                  'can', 'please', 'help', 'want', 'need', 'use', 'know', 'tell'}
    
    # 收集所有文本，优先考虑用户消息
    all_keywords = []
    keyword_scores = {}
    
    # 当前消息权重最高
    current_keywords = extract_keywords_from_text(current_message, stop_words)
    for kw in current_keywords:
        keyword_scores[kw] = keyword_scores.get(kw, 0) + 3
    
    # 历史消息中用户的问题权重较高
    for i, msg in enumerate(reversed(history[-10:])):  # 最近10条
        weight = 2 if msg.get('role') == 'user' else 1
        # 越近的消息权重越高
        recency_weight = 1 + (0.1 * (10 - i))
        
        msg_keywords = extract_keywords_from_text(msg.get('content', ''), stop_words)
        for kw in msg_keywords:
            keyword_scores[kw] = keyword_scores.get(kw, 0) + (weight * recency_weight)
    
    # 按分数排序，取前5个
    sorted_keywords = sorted(keyword_scores.items(), key=lambda x: x[1], reverse=True)
    return [kw for kw, score in sorted_keywords[:5]]

@app.get("/")
async def root():
    return {"message": "AI Assistant Server is running"}

@app.post("/ai/health")
async def check_health(request: HealthRequest):
    """检查AI服务连接状态"""
    if not request.apiKey:
        return {"connected": False, "error": "API Key 未配置"}
    
    try:
        provider_config = AI_PROVIDERS.get(request.provider)
        if not provider_config:
            return {"connected": False, "error": f"不支持的AI提供商: {request.provider}"}
        
        # 验证API key格式
        if request.provider == "openai" and not request.apiKey.startswith("sk-"):
            return {"connected": False, "error": "OpenAI API Key 格式无效（应以 sk- 开头）"}
        
        if request.provider == "zhipu" and len(request.apiKey) < 10:
            return {"connected": False, "error": "智谱AI API Key 格式无效"}
        
        return {"connected": True}
    except Exception as e:
        return {"connected": False, "error": str(e)}

@app.post("/ai/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """处理聊天请求"""
    
    provider_config = AI_PROVIDERS.get(request.config.provider)
    provider_name = provider_config["name"] if provider_config else request.config.provider
    
    # 获取或创建会话历史
    if request.sessionId not in session_histories:
        session_histories[request.sessionId] = []
    
    history = session_histories[request.sessionId]
    keywords = extract_keywords_from_context(request.message, history)
    
    # 如果没有API key，返回错误提示
    if not request.config.apiKey:
        error_msg = f"""⚠️ **API Key 未配置**

请先配置 {provider_name} 的 API Key 才能使用AI功能。

### 配置步骤：
1. 点击右上角的 **⚙️ 设置** 按钮
2. 选择AI服务提供商（当前：{provider_name}）
3. 输入对应的 API Key
4. 点击保存

### 获取 API Key：
"""
        if request.config.provider == "openai":
            error_msg += "- OpenAI: https://platform.openai.com/api-keys"
        elif request.config.provider == "deepseek":
            error_msg += "- DeepSeek: https://platform.deepseek.com/api-keys"
        elif request.config.provider == "zhipu":
            error_msg += "- 智谱AI: https://open.bigmodel.cn/usercenter/apikeys"
        elif request.config.provider == "claude":
            error_msg += "- Claude: https://console.anthropic.com/settings/keys"
        elif request.config.provider == "grok":
            error_msg += "- Grok: https://console.x.ai/"
        
        return ChatResponse(
            reply=error_msg,
            keywords=keywords,
            error="API_KEY_MISSING",
            errorType="config"
        )
    
    try:
        client = get_ai_client(request.config)
        
        # 构建消息列表（包含历史）
        messages = [
            {"role": "system", "content": "你是一个专业、友好的AI助手。请用中文回答问题，回答要准确、详细、条理清晰。针对用户的具体问题提供有针对性的解答。"}
        ]
        
        # 添加历史消息
        for msg in history[-10:]:
            messages.append(msg)
        
        # 添加当前消息
        messages.append({"role": "user", "content": request.message})
        
        print(f"🤖 Calling {provider_name} API with model: {request.config.model}")
        
        # 调用AI API
        response = client.chat.completions.create(
            model=request.config.model,
            messages=messages,
            temperature=0.7,
            max_tokens=2000
        )
        
        reply = response.choices[0].message.content
        
        # 保存到历史
        history.append({"role": "user", "content": request.message})
        history.append({"role": "assistant", "content": reply})
        
        # 限制历史长度
        if len(history) > 20:
            session_histories[request.sessionId] = history[-20:]
        
        print(f"✅ {provider_name} API call successful")
        
        return ChatResponse(
            reply=reply,
            keywords=keywords
        )
        
    except Exception as e:
        error_str = str(e)
        error_detail = traceback.format_exc()
        print(f"❌ AI API Error: {error_str}")
        print(f"   Detail: {error_detail}")
        
        # 解析错误类型并提供有针对性的错误信息
        error_msg = f"""❌ **{provider_name} API 调用失败**

### 错误信息：
```
{error_str}
```

### 可能的原因：
"""
        
        error_type = "api_error"
        
        if "401" in error_str or "Unauthorized" in error_str or "Invalid API" in error_str.lower():
            error_msg += """
1. **API Key 无效** - 请检查您的 API Key 是否正确
2. **API Key 已过期** - 请到服务提供商平台重新生成
3. **API Key 权限不足** - 请确认 API Key 有调用该模型的权限
"""
            error_type = "auth_error"
            
        elif "429" in error_str or "rate limit" in error_str.lower() or "quota" in error_str.lower():
            error_msg += """
1. **请求频率过高** - 请稍后再试
2. **配额已用尽** - 请检查您的账户余额或升级套餐
3. **并发请求过多** - 请减少同时发送的请求数量
"""
            error_type = "rate_limit"
            
        elif "timeout" in error_str.lower() or "timed out" in error_str.lower():
            error_msg += """
1. **网络超时** - 请检查网络连接
2. **服务响应慢** - API服务可能暂时繁忙
3. **请求内容过长** - 尝试缩短输入内容
"""
            error_type = "timeout"
            
        elif "connection" in error_str.lower() or "network" in error_str.lower():
            error_msg += """
1. **网络连接失败** - 请检查网络是否正常
2. **服务不可用** - API服务可能暂时维护中
3. **防火墙限制** - 请检查是否需要代理或VPN
"""
            error_type = "network_error"
            
        elif "model" in error_str.lower() and ("not found" in error_str.lower() or "does not exist" in error_str.lower()):
            error_msg += f"""
1. **模型不存在** - 当前选择的模型 `{request.config.model}` 可能不可用
2. **模型名称错误** - 请检查模型名称是否正确
3. **权限不足** - 您的账户可能没有该模型的访问权限
"""
            error_type = "model_error"
            
        else:
            error_msg += """
1. **服务异常** - API服务可能遇到了临时问题
2. **请求格式错误** - 请检查输入是否包含特殊字符
3. **未知错误** - 请查看详细错误信息或联系技术支持
"""
        
        error_msg += f"""
### 调试信息：
- 提供商: {provider_name}
- 模型: {request.config.model}
- API Base: {provider_config["base_url"] if provider_config else "N/A"}
"""
        
        return ChatResponse(
            reply=error_msg,
            keywords=keywords,
            error=error_str[:200],
            errorType=error_type
        )

@app.post("/ai/extract-keywords", response_model=ExtractKeywordsResponse)
async def extract_keywords_endpoint(request: ExtractKeywordsRequest):
    """使用AI从整个会话上下文中智能提取关键词"""
    
    if not request.messages or len(request.messages) == 0:
        return ExtractKeywordsResponse(keywords=[], searchQuery="")
    
    # 收集整个对话内容
    conversation_text = ""
    for msg in request.messages:
        role_label = "用户" if msg.role == "user" else "AI助手"
        conversation_text += f"{role_label}: {msg.content}\n\n"
    
    # 如果有API key，使用AI来智能提取关键词
    if request.config.apiKey:
        try:
            client = get_ai_client(request.config)
            
            extract_prompt = f"""分析以下对话内容，提取用户最想了解的核心主题和关键词。

对话内容：
{conversation_text}

要求：
1. 从整个对话上下文中理解用户的真正意图
2. 提取3-5个最核心的关键词或短语
3. 关键词应该能够用于搜索引擎查找相关信息
4. 优先提取技术术语、专有名词、核心概念
5. 生成一个适合搜索引擎的搜索查询语句

请按以下JSON格式返回（只返回JSON，不要其他内容）：
{{
  "keywords": ["关键词1", "关键词2", "关键词3"],
  "searchQuery": "搜索查询语句"
}}"""

            response = client.chat.completions.create(
                model=request.config.model,
                messages=[
                    {"role": "system", "content": "你是一个专业的关键词提取助手。请分析对话内容并提取核心关键词。只返回JSON格式的结果。"},
                    {"role": "user", "content": extract_prompt}
                ],
                temperature=0.3,
                max_tokens=500
            )
            
            result_text = response.choices[0].message.content.strip()
            
            # 尝试解析JSON
            try:
                # 移除可能的markdown代码块标记
                if result_text.startswith("```"):
                    result_text = result_text.split("```")[1]
                    if result_text.startswith("json"):
                        result_text = result_text[4:]
                result_text = result_text.strip()
                
                result = json.loads(result_text)
                keywords = result.get("keywords", [])[:5]
                search_query = result.get("searchQuery", " ".join(keywords))
                
                return ExtractKeywordsResponse(
                    keywords=keywords,
                    searchQuery=search_query
                )
            except json.JSONDecodeError:
                # JSON解析失败，使用本地提取
                pass
                
        except Exception as e:
            print(f"AI keyword extraction failed: {e}")
            # AI调用失败，使用本地提取
    
    # 使用本地算法提取关键词（作为备选方案）
    all_text = " ".join([msg.content for msg in request.messages])
    keywords = extract_keywords_from_context(all_text, [{"role": m.role, "content": m.content} for m in request.messages])
    search_query = " ".join(keywords)
    
    return ExtractKeywordsResponse(
        keywords=keywords,
        searchQuery=search_query
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)

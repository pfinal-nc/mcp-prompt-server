#!/usr/bin/env python3
import websocket
import json
import time
import threading
import sys
import os
import argparse
from urllib.parse import quote
import re

# 全局变量存储结果
result_text = ""
error_text = ""
connection_closed = threading.Event()

# 缓存已获取的 prompt 信息
prompt_cache = {}
cache_timestamp = 0
CACHE_DURATION = 300  # 缓存5分钟

# Prompt 中文名称映射
PROMPT_NAMES = {
    "api_documentation": "API文档生成",
    "build_mcp_server": "创建MCP服务器",
    "build_name": "生成名称",
    "code_refactoring": "代码重构",
    "code_review": "代码审查",
    "gen_3d_celebrity_cards": "3D名人卡片生成",
    "gen_3d_edu_webpage_html": "3D教育网页生成",
    "gen_3d_webpage_html": "3D网页生成",
    "gen_avatar_series": "头像系列生成",
    "gen_bento_grid_html": "Bento网格布局生成",
    "gen_business_card_photo": "名片照片生成",
    "gen_html_web_page": "HTML网页生成",
    "gen_knowledge_card_html": "知识卡片生成",
    "gen_knowledge_sharing_tweets": "知识分享推文生成",
    "gen_magazine_card_html": "杂志卡片生成",
    "gen_nuxt_static_website": "Nuxt静态网站生成",
    "gen_mimeng_headline_title": "咪蒙标题生成",
    "gen_podcast_script": "播客脚本生成",
    "gen_prd_prototype_html": "PRD原型生成",
    "gen_programmer_jokes": "程序员段子生成",
    "gen_summarize": "内容总结",
    "gen_title": "标题生成",
    "mimeng_headline_master": "咪蒙标题大师",
    "mimeng_headline_master_v2": "咪蒙标题大师V2",
    "project_architecture": "项目架构设计",
    "prompt_template_generator": "Prompt模板生成器",
    "test_case_generator": "测试用例生成",
    "wechat_cover_image": "微信封面图生成",
    "wechat_headline_generator": "微信标题生成器",
    "writing_assistant": "写作助手"
}

def read_prompt_description(prompt_name):
    """从YAML文件中读取prompt的描述信息"""
    try:
        yaml_path = os.path.join(os.path.dirname(__file__), 'src', 'prompts', f'{prompt_name}.yaml')
        if os.path.exists(yaml_path):
            with open(yaml_path, 'r', encoding='utf-8') as f:
                content = f.read()
                # 使用正则表达式匹配 description 字段
                match = re.search(r'description:\s*(.+)', content, re.MULTILINE)
                if match:
                    description = match.group(1).strip()
                    # 移除可能的引号
                    description = description.strip('"\'')
                    return description
                else:
                    return PROMPT_NAMES.get(prompt_name, prompt_name)
        else:
            return PROMPT_NAMES.get(prompt_name, prompt_name)
    except Exception as e:
        print(f"读取 {prompt_name} 描述时出错: {e}", file=sys.stderr)
        return PROMPT_NAMES.get(prompt_name, prompt_name)

def on_message(ws, message):
    global result_text, error_text
    # 尝试解析JSON响应
    try:
        response = json.loads(message)
        
        # 检查是否有结果内容
        if 'result' in response and 'content' in response['result']:
            for item in response['result']['content']:
                if item['type'] == 'text':
                    result_text = item['text']
        elif 'error' in response:
            error_text = response['error']['message']
    except Exception as e:
        error_text = f"解析响应时出错: {e}"
    
    # 标记连接已关闭，可以继续处理
    connection_closed.set()
    ws.close()

def on_error(ws, error):
    global error_text
    error_text = f"发生错误: {error}"
    connection_closed.set()
    ws.close()

def on_close(ws, close_status_code, close_msg):
    connection_closed.set()

def on_open(ws, prompt_name, args):
    def run():
        # 构建请求
        request = {
            "jsonrpc": "2.0",
            "name": prompt_name,
            "arguments": args,
            "id": str(int(time.time() * 1000))
        }
        
        ws.send(json.dumps(request))
    
    # 在新线程中运行，避免阻塞
    threading.Thread(target=run).start()

def get_prompt_info_from_server():
    """从服务器获取所有 prompt 的详细信息"""
    global result_text, error_text, prompt_cache, cache_timestamp
    connection_closed.clear()
    result_text = ""
    error_text = ""
    
    # 禁用详细日志
    websocket.enableTrace(False)
    
    ws_url = "ws://localhost:5050/ws"
    ws = websocket.WebSocketApp(ws_url,
                              on_open=lambda ws: on_open(ws, "get_prompt_names", {}),
                              on_message=on_message,
                              on_error=on_error,
                              on_close=on_close)
    
    # 启动WebSocket连接
    wst = threading.Thread(target=ws.run_forever)
    wst.daemon = True
    wst.start()
    
    # 等待连接关闭或超时
    connection_closed.wait(timeout=5)
    
    if error_text:
        return None
    
    if not result_text:
        return None
    
    # 解析prompts列表
    prompts = [p for p in result_text.split('\n') if p and not p.startswith('可用的prompts')]
    
    # 为每个 prompt 获取详细信息
    prompt_info = {}
    for prompt_name in prompts:
        description = read_prompt_description(prompt_name)
        prompt_info[prompt_name] = {
            "name": prompt_name,
            "description": description,
            "params": []
        }
    
    return prompt_info

def get_cached_prompts():
    """获取缓存的 prompt 信息，如果缓存过期则重新获取"""
    global prompt_cache, cache_timestamp
    
    current_time = time.time()
    if current_time - cache_timestamp > CACHE_DURATION or not prompt_cache:
        prompt_cache = get_prompt_info_from_server() or {}
        cache_timestamp = current_time
    
    return prompt_cache

def get_available_prompts(query=""):
    """获取所有可用的prompts，用于Alfred工作流展示"""
    prompts = get_cached_prompts()
    
    if not prompts:
        return {"items": [{"title": "连接错误", "subtitle": "无法连接到 MCP 服务器"}]}
    
    # 过滤prompts（如果有查询）
    if query:
        filtered_prompts = {}
        for k, v in prompts.items():
            # 搜索英文名称和中文描述
            if (query.lower() in k.lower() or 
                query.lower() in v.get("description", "").lower()):
                filtered_prompts[k] = v
    else:
        filtered_prompts = prompts
    
    # 构建Alfred输出
    items = []
    for prompt_name, prompt_info in filtered_prompts.items():
        chinese_name = prompt_info.get("description", prompt_name)
        items.append({
            "title": chinese_name,
            "subtitle": f"英文名称: {prompt_name}",
            "arg": prompt_name,
            "variables": {
                "prompt": prompt_name
            }
        })
    
    return {"items": items}

def get_prompt_args(prompt_name):
    """获取指定prompt的参数配置，用于Alfred工作流界面展示"""
    prompts = get_cached_prompts()
    
    # 检查prompt是否存在
    if prompt_name not in prompts:
        return {"items": [{"title": "未知的Prompt", "subtitle": f"找不到 {prompt_name} 的配置"}]}
    
    # 获取参数配置
    prompt_info = prompts[prompt_name]
    params = prompt_info.get("params", [])
    
    if not params:
        # 如果没有参数，直接返回执行选项
        return {
            "items": [{
                "title": f"执行 {prompt_info.get('description', prompt_name)}",
                "subtitle": "没有需要配置的参数",
                "arg": json.dumps({}),
                "variables": {
                    "args": json.dumps({}),
                    "alfredworkflow": "execute_prompt"
                }
            }]
        }
    
    # 构建参数输入界面
    items = []
    for param in params:
        items.append({
            "title": param["name"],
            "subtitle": f"{param['description']} ({param.get('default', '无默认值')})",
            "arg": param["name"],
            "variables": {
                "current_param": param["name"],
                "prompt": prompt_name,
                "alfredworkflow": "input_param"
            }
        })
    
    # 添加执行选项
    args = {}
    for param in params:
        if "default" in param:
            args[param["name"]] = param["default"]
    
    items.append({
        "title": "使用默认值执行",
        "subtitle": f"使用默认参数执行 {prompt_info.get('description', prompt_name)}",
        "arg": json.dumps(args),
        "variables": {
            "args": json.dumps(args),
            "alfredworkflow": "execute_prompt"
        }
    })
    
    return {"items": items}

def execute_prompt(prompt_name, args_json):
    """执行指定的prompt并返回结果，用于Alfred工作流处理"""
    global result_text, error_text
    connection_closed.clear()
    result_text = ""
    error_text = ""
    
    try:
        args = json.loads(args_json)
    except json.JSONDecodeError:
        return "参数格式错误：不是有效的JSON"
    
    # 禁用详细日志
    websocket.enableTrace(False)
    
    ws_url = "ws://localhost:5050/ws"
    ws = websocket.WebSocketApp(ws_url,
                              on_open=lambda ws: on_open(ws, prompt_name, args),
                              on_message=on_message,
                              on_error=on_error,
                              on_close=on_close)
    
    # 启动WebSocket连接
    wst = threading.Thread(target=ws.run_forever)
    wst.daemon = True
    wst.start()
    
    # 等待连接关闭或超时
    connection_closed.wait(timeout=10)
    
    if error_text:
        return error_text
    
    return result_text

def main():
    parser = argparse.ArgumentParser(description='Alfred Workflow for MCP Prompt Server')
    parser.add_argument('--list', action='store_true', help='List all available prompts')
    parser.add_argument('--prompt-args', type=str, help='Get arguments for a prompt')
    parser.add_argument('--execute', action='store_true', help='Execute a prompt')
    parser.add_argument('--prompt', type=str, help='Prompt name to execute')
    parser.add_argument('--args', type=str, help='JSON string of arguments for the prompt')
    parser.add_argument('--query', type=str, help='Query string for Alfred')
    
    args = parser.parse_args()
    
    # 如果是列出所有prompts
    if args.list:
        result = get_available_prompts(args.query or "")
        print(json.dumps(result))
        return
    
    # 如果是执行特定prompt
    if args.prompt:
        # 使用提供的参数或空参数
        args_to_use = args.args if args.args else json.dumps({})
        result = execute_prompt(args.prompt, args_to_use)
        
        # 返回结果
        if result:
            print(result)
        else:
            print("服务器未返回任何结果")
        return result
    
    # 如果是查询
    if args.query is not None:
        result = get_available_prompts(args.query)
        print(json.dumps(result))
        return
    
    # 默认行为：列出所有prompts
    result = get_available_prompts("")
    print(json.dumps(result))

if __name__ == "__main__":
    main()

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yaml';
import { z } from 'zod';
import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 预设prompts的目录路径
const PROMPTS_DIR = path.join(__dirname, 'prompts');

// 存储所有加载的prompts
let loadedPrompts = [];

/**
 * 从prompts目录加载所有预设的prompt
 */
async function loadPrompts() {
  try {
    // 确保prompts目录存在
    await fs.ensureDir(PROMPTS_DIR);
    
    // 读取prompts目录中的所有文件
    const files = await fs.readdir(PROMPTS_DIR);
    
    // 过滤出YAML和JSON文件
    const promptFiles = files.filter(file => 
      file.endsWith('.yaml') || file.endsWith('.yml') || file.endsWith('.json')
    );
    
    // 加载每个prompt文件
    const prompts = [];
    for (const file of promptFiles) {
      const filePath = path.join(PROMPTS_DIR, file);
      const content = await fs.readFile(filePath, 'utf8');
      
      let prompt;
      if (file.endsWith('.json')) {
        prompt = JSON.parse(content);
      } else {
        // 假设其他文件是YAML格式
        prompt = YAML.parse(content);
      }
      
      // 确保prompt有name字段
      if (!prompt.name) {
        console.warn(`Warning: Prompt in ${file} is missing a name field. Skipping.`);
        continue;
      }
      
      prompts.push(prompt);
    }
    
    loadedPrompts = prompts;
    console.log(`Loaded ${prompts.length} prompts from ${PROMPTS_DIR}`);
    return prompts;
  } catch (error) {
    console.error('Error loading prompts:', error);
    return [];
  }
}


// 创建WebSocket到Stdio的适配器
class WsToStdioAdapter {
  constructor(server) {
    console.log('WsToStdioAdapter: Initializing...'); 
    this.server = server;
    this.transport = new StdioServerTransport();
    this.pending = new Map();
    this.onmessage = null;
    this.onclose = null;
    this.onerror = null;
  }

  // 实现必要的传输接口方法
  async start() {
    console.log('WsToStdioAdapter: Starting transport');
    // 这个方法是必需的，但可以是空实现
  }

  async send(message) {
    console.log('WsToStdioAdapter: Sending message:', message);
    // 将消息发送到客户端
    return message;
  }

  async close() {
    console.log('WsToStdioAdapter: Closing transport');
    // 关闭传输
    if (this.onclose) {
      this.onclose();
    }
  }

  async handleMessage(message) {
    try {
      console.log('WsToStdioAdapter: Handling incoming WebSocket message:', message);
      let msgObj = typeof message === 'string' ? JSON.parse(message) : message;
      console.log('WsToStdioAdapter: Parsed message object:', msgObj);
      
      // 如果有onmessage处理函数，调用它
      if (this.onmessage) {
        this.onmessage(msgObj);
      }
      
      // 处理消息并返回响应
      // 这里应该调用实际的MCP处理逻辑
      return {
        jsonrpc: '2.0',
        result: {
          content: [
            {
              type: 'text',
              text: `处理了请求: ${msgObj.name}`
            }
          ]
        },
        id: msgObj.id
      };
    } catch (error) {
      console.error('WsToStdioAdapter: Error handling message:', error);
      if (this.onerror) {
        this.onerror(error);
      }
      return {
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: error.message
        },
        id: message.id
      };
    }
  }
}

/**
 * 启动MCP服务器
 */
async function startServer() {
  // 加载所有预设的prompts
  await loadPrompts();
  
  // 创建MCP服务器
  const server = new McpServer({
    name: "mcp-prompt-server",
    version: "1.0.0"
  });
  
  // 为每个预设的prompt创建一个工具
  loadedPrompts.forEach(prompt => {
    // 构建工具的输入schema
    const schemaObj = {};
    
    if (prompt.arguments && Array.isArray(prompt.arguments)) {
      prompt.arguments.forEach(arg => {
        // 默认所有参数都是字符串类型
        schemaObj[arg.name] = z.string().describe(arg.description || `参数: ${arg.name}`);
      });
    }
    
    // 注册工具
    server.tool(
      prompt.name,
      schemaObj,
      async (args) => {
        // 处理prompt内容
        let promptText = '';
        
        if (prompt.messages && Array.isArray(prompt.messages)) {
          // 只处理用户消息
          const userMessages = prompt.messages.filter(msg => msg.role === 'user');
          
          for (const message of userMessages) {
            if (message.content && typeof message.content.text === 'string') {
              let text = message.content.text;
              
              // 替换所有 {{arg}} 格式的参数
              for (const [key, value] of Object.entries(args)) {
                text = text.replace(new RegExp(`{{${key}}}`, 'g'), value);
              }
              
              promptText += text + '\n\n';
            }
          }
        }
        
        // 返回处理后的prompt内容
        return {
          content: [
            {
              type: "text",
              text: promptText.trim()
            }
          ]
        };
      },
      {
        description: prompt.description || `Prompt: ${prompt.name}`
      }
    );
  });
  
  // 添加管理工具 - 重新加载prompts
  server.tool(
    "reload_prompts",
    {},
    async () => {
      await loadPrompts();
      return {
        content: [
          {
            type: "text",
            text: `成功重新加载了 ${loadedPrompts.length} 个prompts。`
          }
        ]
      };
    },
    {
      description: "重新加载所有预设的prompts"
    }
  );
  
  // 添加管理工具 - 获取prompt名称列表
  server.tool(
    "get_prompt_names",
    {},
    async () => {
      const promptNames = loadedPrompts.map(p => p.name);
      return {
        content: [
          {
            type: "text",
            text: `可用的prompts (${promptNames.length}):\n${promptNames.join('\n')}`
          }
        ]
      };
    },
    {
      description: "获取所有可用的prompt名称"
    }
  );
  
  // 创建stdio传输层
  // stdio 模式
  if (process.env.MCP_MODE === 'stdio' || !process.env.MCP_MODE) {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log('MCP Prompt Server running in stdio mode...');
  }
  // WebSocket 模式
  if (process.env.MCP_MODE === 'ws' || process.env.MCP_MODE === 'both') {
    console.log('Starting WebSocket server mode...');
    const app = express();
    const httpServer = http.createServer(app);
    const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
    
    wss.on('connection', (socket) => {
      console.log('New WebSocket connection established');
      
      // 处理接收到的消息
      socket.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          // console.log('Received WebSocket message:', message);
          
          // 直接处理请求并发送响应
          if (message.name === 'get_prompt_names') {
            const promptNames = loadedPrompts.map(p => p.name);
            const response = {
              jsonrpc: '2.0',
              result: {
                content: [
                  {
                    type: 'text',
                    text: `可用的prompts (${promptNames.length}):\n${promptNames.join('\n')}`
                  }
                ]
              },
              id: message.id
            };
            // console.log('Sending response:', response);
            socket.send(JSON.stringify(response));
          } else {
            // 查找对应的prompt
            const promptName = message.name;
            const prompt = loadedPrompts.find(p => p.name === promptName);
            
            if (!prompt) {
              // 如果找不到对应的prompt，返回错误
              const errorResponse = {
                jsonrpc: '2.0',
                error: {
                  code: -32601,
                  message: `未找到名为 "${promptName}" 的prompt`
                },
                id: message.id
              };
              socket.send(JSON.stringify(errorResponse));
              return;
            }
            
            try {
              // 处理prompt内容
              let promptText = '';
              
              if (prompt.messages && Array.isArray(prompt.messages)) {
                // 只处理用户消息
                const userMessages = prompt.messages.filter(msg => msg.role === 'user');
                
                for (const userMsg of userMessages) {
                  if (userMsg.content && typeof userMsg.content.text === 'string') {
                    let text = userMsg.content.text;
                    
                    // 替换所有 {{arg}} 格式的参数
                    for (const [key, value] of Object.entries(message.arguments || {})) {
                      text = text.replace(new RegExp(`{{${key}}}`, 'g'), value);
                    }
                    
                    promptText += text + '\n\n';
                  }
                }
              }
              
              // 返回处理后的prompt内容
              const response = {
                jsonrpc: '2.0',
                result: {
                  content: [
                    {
                      type: "text",
                      text: promptText.trim()
                    }
                  ]
                },
                id: message.id
              };
              // console.log('Sending prompt response:', response);
              socket.send(JSON.stringify(response));
            } catch (error) {
              console.error('Error processing prompt:', error);
              const errorResponse = {
                jsonrpc: '2.0',
                error: {
                  code: -32000,
                  message: `处理prompt时出错: ${error.message}`
                },
                id: message.id
              };
              socket.send(JSON.stringify(errorResponse));
            }
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
          socket.send(JSON.stringify({
            jsonrpc: '2.0',
            error: {
              code: -32700,
              message: 'Parse error: ' + error.message
            }
          }));
        }
      });

      socket.on('error', (error) => {
        console.error('WebSocket error:', error);
      });

      socket.on('close', () => {
        console.log('WebSocket connection closed');
      });
    });

    httpServer.listen(5050, () => {
      console.log('MCP Prompt Server running in WebSocket mode on port 5050...');
    });
  }
}

// 启动服务器
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});



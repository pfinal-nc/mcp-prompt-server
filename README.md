# MCP Prompt Server

[English Version](README_EN.md)

这是一个基于Model Context Protocol (MCP)的服务器，用于根据用户任务需求提供预设的prompt模板，帮助Cline/Cursor/Windsurf...更高效地执行各种任务。服务器将预设的prompt作为工具(tools)返回，以便在Cursor和Windsurf等编辑器中更好地使用。

## 功能特点

- 提供预设的prompt模板，可用于代码审查、API文档生成、代码重构等任务
- 将所有prompt模板作为MCP工具(tools)提供，而非MCP prompts格式
- 支持动态参数替换，使prompt模板更加灵活
- 允许开发者自由添加和修改prompt模板
- 提供工具API，可重新加载prompt和查询可用prompt
- 专为Cursor和Windsurf等编辑器优化，提供更好的集成体验

## 目录结构

```
mcp-prompt-server/
├── 📁 config/                    # 配置文件目录
│   └── paths.js                  # 路径配置文件
├── 📁 data/                      # 数据文件目录
│   └── prompts.csv               # CSV格式的prompts数据
├── 📁 docs/                      # 文档目录
├── 📁 examples/                  # 示例文件目录
├── 📁 scripts/                   # 脚本目录（预留）
├── 📁 src/                       # 源代码目录
│   ├── index.js                  # 主服务器文件
│   ├── csv-manager.js            # CSV管理工具
│   └── prompts/                  # YAML格式的prompts（原始文件）
├── 📁 tools/                     # 工具目录
│   ├── add-prompt.js             # 交互式添加prompt工具
│   └── test-csv.js               # CSV功能测试脚本
├── package.json                  # 项目配置和依赖
└── README.md                     # 项目说明文档
```

详细的项目结构说明请参考 [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md)

## 安装和使用

1. 安装依赖：

```bash
cd prompt-server
npm install
```

2. 启动服务器：

```bash
npm start
```

服务器将在标准输入/输出上运行，可以被Cursor、Windsurf或其他MCP客户端连接。

## 添加新的Prompt模板

### 方法一：使用CSV文件（推荐）

现在您可以通过编辑 `data/prompts.csv` 文件来添加新的prompt模板，这是最简单的方法：

1. 打开 `data/prompts.csv` 文件
2. 在文件末尾添加新行
3. 按照格式填写各个字段

详细说明请参考 [docs/CSV_MANAGEMENT.md](docs/CSV_MANAGEMENT.md)

### 方法二：使用交互式工具

```bash
npm run add-prompt
```

### 方法三：使用YAML文件（原有方式）

您可以通过在`src/prompts`目录中添加新的YAML或JSON文件来创建新的prompt模板。每个模板文件应包含以下内容：

```yaml
name: prompt_name                # 唯一标识符，用于调用此prompt
description: prompt description  # 对prompt功能的描述
arguments:                       # 参数列表（可选）
  - name: arg_name               # 参数名称
    description: arg description # 参数描述
    required: true/false         # 是否必需
messages:                        # prompt消息列表
  - role: user/assistant         # 消息角色
    content:
      type: text                 # 内容类型
      text: |                    # 文本内容，可包含参数占位符 {{arg_name}}
        Your prompt text here...
```

添加新文件后，服务器会在下次启动时自动加载，或者您可以使用`reload_prompts`工具重新加载所有prompt。

## 使用示例

### 在Cursor或Windsurf中调用代码审查工具

```json
{
  "name": "code_review",
  "arguments": {
    "language": "javascript",
    "code": "function add(a, b) { return a + b; }"
  }
}
```

### 在Cursor或Windsurf中调用API文档生成工具

```json
{
  "name": "api_documentation",
  "arguments": {
    "language": "python",
    "code": "def process_data(data, options=None):\n    # 处理数据\n    return result",
    "format": "markdown"
  }
}
```

## 工具API

服务器提供以下管理工具：

- `reload_prompts`: 重新加载所有预设的prompts
- `get_prompt_names`: 获取所有可用的prompt名称

此外，所有在`src/prompts`目录中定义的prompt模板都会作为工具提供给客户端。

## 与编辑器集成

### Cursor

在Cursor中，您需要编辑MCP配置文件：

1. 找到或创建Cursor的MCP配置文件（通常位于`~/.cursor/`目录）
2. 添加以下内容：

```json
{
  "servers": [
    {
      "name": "Prompt Server",
      "command": ["node", "/path/to/prompt-server/src/index.js"],
      "transport": "stdio",
      "initialization_options": {}
    }
  ]
}
```

请确保将`/path/to/prompt-server`替换为您实际的项目路径。

3. 保存配置并重启编辑器
4. 现在您应该能够在工具面板中看到所有可用的prompt工具

### Windsurf

在Windsurf中，通过以下方式访问MCP配置：

1. 导航至 Windsurf - 设置 > 高级设置，或
2. 使用命令面板 > 打开Windsurf设置页面
3. 滚动到Cascade部分，您会看到添加新服务器的选项
4. 点击"添加服务器"按钮，然后选择"添加自定义服务器+"
5. 或者，您可以直接编辑`~/.codeium/windsurf/mcp_config.json`文件，添加以下内容：

```json
{
  "mcpServers": {
    "prompt-server": {
      "command": "node",
      "args": [
        "/path/to/prompt-server/src/index.js"
      ],
      "transport": "stdio"
    }
  }
}
```

请确保将`/path/to/prompt-server`替换为您实际的项目路径。

6. 添加服务器后，点击刷新按钮
7. 现在您应该能够在工具面板中看到所有可用的prompt工具

## 扩展建议

1. 添加更多专业领域的prompt模板
2. 实现prompt版本控制
3. 添加prompt分类和标签
4. 实现prompt使用统计和分析
5. 添加用户反馈机制

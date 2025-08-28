# CSV Prompt 管理系统

## 概述

这个系统允许您通过 CSV 文件来管理所有的 prompt 模板，使得添加和编辑 prompts 变得更加简单和高效。

## CSV 文件格式

CSV 文件包含以下列：

| 列名 | 描述 | 示例 |
|------|------|------|
| `name` | prompt 的唯一标识符 | `writing_assistant` |
| `description` | prompt 的功能描述 | `当用户想要编辑文章时，可以使用这个提示词...` |
| `arguments` | JSON 格式的参数数组 | `[{"name":"draft","description":"草稿内容","required":true}]` |
| `prompt_content` | 完整的 prompt 内容 | `# 写作编辑助手\n\n你是一位专业的写作编辑助手...` |
| `category` | prompt 分类 | `content_creation` |
| `tags` | 标签，用逗号分隔 | `写作,编辑,多平台` |

## 使用方法

### 1. 生成初始 CSV 文件

如果您已经有 YAML 格式的 prompts，可以运行以下命令生成 CSV 文件：

```bash
node src/csv-manager.js
```

这会将 `src/prompts/` 目录中的所有 YAML 文件转换为 CSV 格式。

### 2. 添加新的 Prompt

#### 方法一：直接在 CSV 文件中添加

1. 打开 `src/prompts.csv` 文件
2. 在文件末尾添加新行
3. 按照格式填写各个字段

示例：
```csv
my_new_prompt,这是一个新的prompt,"[{""name"":""input"",""description"":""输入内容"",""required"":true}]","# 新Prompt\n\n请处理以下内容：\n{{input}}",development,"新功能,测试"
```

#### 方法二：使用编程方式添加

```javascript
import { addPromptToCSV } from './src/csv-manager.js';

const newPrompt = {
  name: 'my_new_prompt',
  description: '这是一个新的prompt',
  arguments: '[{"name":"input","description":"输入内容","required":true}]',
  prompt_content: '# 新Prompt\n\n请处理以下内容：\n{{input}}',
  category: 'development',
  tags: '新功能,测试'
};

await addPromptToCSV(newPrompt);
```

### 3. 参数格式说明

`arguments` 字段使用 JSON 数组格式，每个参数包含：

```json
[
  {
    "name": "参数名",
    "description": "参数描述",
    "required": true/false
  }
]
```

### 4. Prompt 内容中的参数引用

在 `prompt_content` 中，您可以使用以下方式引用参数：

- `{{参数名}}` - 直接替换参数值
- `{{#if 参数名}}...{{/if}}` - 条件判断（如果参数存在则显示内容）

### 5. 分类和标签

- `category`: 用于对 prompts 进行分类，如 `development`、`content_creation`、`entertainment` 等
- `tags`: 用逗号分隔的标签，便于搜索和过滤

## 管理工具

服务器提供了以下管理工具：

### 1. 重新加载 Prompts
```json
{
  "name": "reload_prompts"
}
```

### 2. 从 CSV 加载 Prompts
```json
{
  "name": "load_prompts_from_csv"
}
```

### 3. 从 YAML 加载 Prompts
```json
{
  "name": "load_prompts_from_yaml"
}
```

### 4. 获取所有 Prompt 名称
```json
{
  "name": "get_prompt_names"
}
```

### 5. 按分类获取 Prompts
```json
{
  "name": "get_prompts_by_category",
  "arguments": {
    "category": "development"
  }
}
```

### 6. 搜索 Prompts
```json
{
  "name": "search_prompts",
  "arguments": {
    "keyword": "写作"
  }
}
```

## 工作流程

1. **启动时**: 服务器优先尝试从 `src/prompts.csv` 加载 prompts
2. **CSV 不存在**: 如果 CSV 文件不存在，自动回退到 YAML 文件加载
3. **添加新 Prompt**: 在 CSV 文件中添加新行，然后重新加载
4. **编辑现有 Prompt**: 直接修改 CSV 文件中的对应行
5. **删除 Prompt**: 从 CSV 文件中删除对应行

## 优势

1. **易于管理**: 在 Excel 或 Google Sheets 中直接编辑
2. **批量操作**: 可以一次性添加多个 prompts
3. **版本控制友好**: CSV 文件便于 Git 管理
4. **向后兼容**: 如果 CSV 文件不存在，会自动回退到 YAML 文件
5. **分类管理**: 支持按分类和标签组织 prompts
6. **搜索功能**: 支持按关键词搜索 prompts

## 注意事项

1. CSV 文件中的 JSON 字符串需要使用双引号转义
2. 确保 `name` 字段的唯一性
3. `prompt_content` 中的换行符会被保留
4. 修改 CSV 文件后需要重新加载 prompts 才能生效

## 示例文件

参考 `example-new-prompt.csv` 文件了解如何添加新的 prompt。

# 项目结构说明

## 📁 目录结构

```
mcp-prompt-server/
├── 📁 backup/                      # 备份目录
│   └── prompts_backup/             # YAML文件的备份（已迁移到CSV）
├── 📁 config/                      # 配置文件目录
│   └── paths.js                    # 路径配置文件
├── 📁 data/                        # 数据文件目录
│   └── prompts.csv                 # CSV格式的prompts数据（主要数据源）
├── 📁 docs/                        # 文档目录
│   ├── CSV_MANAGEMENT.md           # CSV管理系统使用说明
│   ├── CSV_IMPLEMENTATION_SUMMARY.md  # CSV实现总结
│   └── PROJECT_STRUCTURE.md        # 本文档
├── 📁 examples/                    # 示例文件目录
│   └── example-new-prompt.csv      # 新prompt示例
├── 📁 scripts/                     # 脚本目录（预留）
├── 📁 src/                         # 源代码目录
│   ├── index.js                    # 主服务器文件
│   └── csv-manager.js              # CSV管理工具
├── 📁 tools/                       # 工具目录
│   ├── add-prompt.js               # 交互式添加prompt工具
│   └── test-csv.js                 # CSV功能测试脚本
├── 📁 node_modules/                # Node.js依赖包
├── .gitignore                      # Git忽略文件
├── LICENSE                         # 许可证文件
├── mcp_config_example.json         # MCP配置示例
├── package.json                    # 项目配置和依赖
├── package-lock.json               # 依赖锁定文件
├── pnpm-lock.yaml                  # pnpm锁定文件
├── README.md                       # 项目说明（中文）
└── README_EN.md                    # 项目说明（英文）
```

## 🎯 目录说明

### `backup/` - 备份文件
- **prompts_backup/**: 原始 YAML 文件的备份，用于历史参考

### `config/` - 配置文件
- **paths.js**: 统一管理项目中的所有文件路径，避免硬编码

### `data/` - 数据文件
- **prompts.csv**: 主要的prompts数据文件，支持CSV格式管理（包含29个prompts）

### `docs/` - 文档
- 包含所有项目相关的文档和说明
- 使用Markdown格式，便于阅读和维护

### `examples/` - 示例文件
- 提供各种使用示例和模板
- 帮助用户快速上手

### `scripts/` - 脚本目录
- 预留目录，用于存放各种自动化脚本
- 如部署脚本、构建脚本等

### `src/` - 源代码
- **index.js**: 主服务器文件，包含MCP服务器逻辑
- **csv-manager.js**: CSV文件管理工具
- ~~**prompts/**: 原始YAML格式的prompts文件~~ (已迁移到CSV)

### `tools/` - 工具
- **add-prompt.js**: 交互式添加新prompt的工具
- **test-csv.js**: 测试CSV功能的脚本

## 🔧 文件说明

### 核心文件
- **src/index.js**: MCP服务器主文件，支持CSV数据源
- **src/csv-manager.js**: CSV文件管理工具，提供生成、读取、添加功能
- **config/paths.js**: 路径配置文件，统一管理所有文件路径

### 配置文件
- **package.json**: 项目配置，包含脚本命令和依赖
- **mcp_config_example.json**: MCP客户端配置示例

### 数据文件
- **data/prompts.csv**: CSV格式的prompts数据，支持Excel编辑（29个prompts）
- ~~**src/prompts/*.yaml**: 原始YAML格式文件~~ (已迁移到CSV)

## 🚀 使用流程

### 1. 开发环境
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 2. 生产环境
```bash
# 启动服务器
npm start
```

### 3. 管理Prompts
```bash
# 生成CSV文件（如果需要重新生成）
npm run generate-csv

# 添加新prompt
npm run add-prompt

# 测试CSV功能
npm run test-csv
```

## 📝 开发规范

### 1. 文件命名
- 使用小写字母和下划线
- 文件名要清晰表达功能
- 避免使用中文文件名

### 2. 目录组织
- 按功能分类组织文件
- 相关文件放在同一目录
- 保持目录结构清晰

### 3. 代码规范
- 使用ES6模块语法
- 统一使用配置文件管理路径
- 添加适当的注释和文档

### 4. 文档维护
- 及时更新相关文档
- 使用Markdown格式
- 提供使用示例

## 🔄 版本控制

### Git忽略文件
- `node_modules/`: Node.js依赖包
- `.DS_Store`: macOS系统文件
- `*.log`: 日志文件
- 临时文件和缓存文件

### 提交规范
- 使用清晰的提交信息
- 按功能模块提交
- 及时提交和推送

## 🎯 扩展建议

1. **添加测试**: 在`scripts/`目录添加自动化测试
2. **CI/CD**: 添加持续集成和部署脚本
3. **监控**: 添加日志和监控功能
4. **API文档**: 生成API文档
5. **国际化**: 支持多语言

## 📊 数据迁移状态

✅ **已完成**：
- 所有29个YAML prompts已成功迁移到CSV格式
- 服务器支持从CSV文件加载prompts
- 原始YAML文件已备份到`backup/prompts_backup/`
- 服务器正常运行，所有功能正常

✅ **优势**：
- 数据管理更加简单，支持Excel编辑
- 版本控制更友好
- 批量操作更方便
- 向后兼容性保持

这个结构让项目更加规范、易于维护和扩展！

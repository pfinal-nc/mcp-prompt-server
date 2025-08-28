import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 项目根目录
export const ROOT_DIR = path.join(__dirname, '..');

// 源代码目录
export const SRC_DIR = path.join(ROOT_DIR, 'src');

// 数据目录
export const DATA_DIR = path.join(ROOT_DIR, 'data');

// 工具目录
export const TOOLS_DIR = path.join(ROOT_DIR, 'tools');

// 文档目录
export const DOCS_DIR = path.join(ROOT_DIR, 'docs');

// 示例目录
export const EXAMPLES_DIR = path.join(ROOT_DIR, 'examples');

// 具体文件路径
export const PROMPTS_DIR = path.join(SRC_DIR, 'prompts');
export const CSV_FILE = path.join(DATA_DIR, 'prompts.csv');
export const CONFIG_FILE = path.join(ROOT_DIR, 'mcp_config_example.json');

// 导出所有路径
export const PATHS = {
  ROOT_DIR,
  SRC_DIR,
  DATA_DIR,
  TOOLS_DIR,
  DOCS_DIR,
  EXAMPLES_DIR,
  PROMPTS_DIR,
  CSV_FILE,
  CONFIG_FILE
};

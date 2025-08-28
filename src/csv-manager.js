import fs from 'fs-extra';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import path from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CSV_FILE = path.join(__dirname, '..', 'data', 'prompts.csv');
const PROMPTS_DIR = path.join(__dirname, 'prompts');

/**
 * 从YAML文件生成CSV文件
 */
async function generateCSVFromYAML() {
  try {
    const promptsDir = path.join(__dirname, 'prompts');
    const files = await fs.readdir(promptsDir);
    const yamlFiles = files.filter(file => 
      file.endsWith('.yaml') || file.endsWith('.yml')
    );
    
    const csvData = [];
    
    for (const file of yamlFiles) {
      const filePath = path.join(promptsDir, file);
      const content = await fs.readFile(filePath, 'utf8');
      const prompt = YAML.parse(content);
      
      // 转换arguments为JSON字符串
      const argumentsJson = prompt.arguments ? JSON.stringify(prompt.arguments) : '[]';
      
      // 提取prompt内容
      let promptContent = '';
      if (prompt.messages && prompt.messages.length > 0) {
        const userMessage = prompt.messages.find(msg => msg.role === 'user');
        if (userMessage && userMessage.content && userMessage.content.text) {
          promptContent = userMessage.content.text;
        }
      }
      
      csvData.push({
        name: prompt.name,
        description: prompt.description || '',
        arguments: argumentsJson,
        prompt_content: promptContent,
        category: prompt.category || 'general',
        tags: prompt.tags ? prompt.tags.join(',') : ''
      });
    }
    
    // 写入CSV文件
    const csvContent = stringify(csvData, {
      header: true,
      columns: ['name', 'description', 'arguments', 'prompt_content', 'category', 'tags']
    });
    
    await fs.writeFile(CSV_FILE, csvContent, 'utf8');
    console.log(`成功生成CSV文件，包含 ${csvData.length} 个prompts`);
    
  } catch (error) {
    console.error('生成CSV文件时出错:', error);
  }
}

/**
 * 添加新的prompt到CSV文件
 */
async function addPromptToCSV(promptData) {
  try {
    let csvData = [];
    
    // 如果CSV文件存在，先读取现有数据
    if (await fs.pathExists(CSV_FILE)) {
      const csvContent = await fs.readFile(CSV_FILE, 'utf8');
      csvData = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
    }
    
    // 检查是否已存在同名prompt
    const existingIndex = csvData.findIndex(row => row.name === promptData.name);
    if (existingIndex !== -1) {
      // 更新现有prompt
      csvData[existingIndex] = promptData;
      console.log(`更新了prompt: ${promptData.name}`);
    } else {
      // 添加新prompt
      csvData.push(promptData);
      console.log(`添加了新prompt: ${promptData.name}`);
    }
    
    // 写入CSV文件
    const csvContent = stringify(csvData, {
      header: true,
      columns: ['name', 'description', 'arguments', 'prompt_content', 'category', 'tags']
    });
    
    await fs.writeFile(CSV_FILE, csvContent, 'utf8');
    console.log(`CSV文件已更新，现在包含 ${csvData.length} 个prompts`);
    
  } catch (error) {
    console.error('添加prompt到CSV时出错:', error);
  }
}

/**
 * 从CSV文件读取所有prompts
 */
async function readPromptsFromCSV() {
  try {
    if (!await fs.pathExists(CSV_FILE)) {
      console.log('CSV文件不存在');
      return [];
    }
    
    const csvContent = await fs.readFile(CSV_FILE, 'utf8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    console.log(`从CSV文件读取了 ${records.length} 个prompts`);
    return records;
  } catch (error) {
    console.error('读取CSV文件时出错:', error);
    return [];
  }
}

// 如果直接运行此文件，则生成CSV
if (import.meta.url === `file://${process.argv[1]}`) {
  generateCSVFromYAML();
}

export { generateCSVFromYAML, addPromptToCSV, readPromptsFromCSV };

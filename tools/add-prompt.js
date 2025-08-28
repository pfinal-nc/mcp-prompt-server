import readline from 'readline';
import { addPromptToCSV } from '../src/csv-manager.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function addNewPrompt() {
  console.log('=== 添加新 Prompt ===\n');
  
  try {
    const name = await question('Prompt 名称 (唯一标识符): ');
    const description = await question('Prompt 描述: ');
    const category = await question('分类 (如 development, content_creation, entertainment): ');
    const tags = await question('标签 (用逗号分隔): ');
    
    console.log('\n=== 参数设置 ===');
    const args = [];
    let addMore = true;
    
    while (addMore) {
      const argName = await question('参数名称: ');
      const argDesc = await question('参数描述: ');
      const required = await question('是否必需 (y/n): ');
      
      args.push({
        name: argName,
        description: argDesc,
        required: required.toLowerCase() === 'y'
      });
      
      const more = await question('添加更多参数? (y/n): ');
      addMore = more.toLowerCase() === 'y';
    }
    
    console.log('\n=== Prompt 内容 ===');
    console.log('请输入 prompt 内容 (输入 "END" 结束):');
    
    const contentLines = [];
    let line;
    while ((line = await question('> ')) !== 'END') {
      contentLines.push(line);
    }
    
    const promptContent = contentLines.join('\n');
    
    // 构建 prompt 数据
    const promptData = {
      name: name.trim(),
      description: description.trim(),
      arguments: JSON.stringify(args),
      prompt_content: promptContent,
      category: category.trim() || 'general',
      tags: tags.trim()
    };
    
    // 确认信息
    console.log('\n=== 确认信息 ===');
    console.log(`名称: ${promptData.name}`);
    console.log(`描述: ${promptData.description}`);
    console.log(`分类: ${promptData.category}`);
    console.log(`标签: ${promptData.tags}`);
    console.log(`参数: ${promptData.arguments}`);
    console.log(`内容长度: ${promptData.prompt_content.length} 字符`);
    
    const confirm = await question('\n确认添加? (y/n): ');
    
    if (confirm.toLowerCase() === 'y') {
      await addPromptToCSV(promptData);
      console.log('\n✅ Prompt 添加成功！');
    } else {
      console.log('\n❌ 已取消添加');
    }
    
  } catch (error) {
    console.error('添加 prompt 时出错:', error);
  } finally {
    rl.close();
  }
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  addNewPrompt();
}

export { addNewPrompt };

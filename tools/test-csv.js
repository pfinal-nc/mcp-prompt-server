import { readPromptsFromCSV } from '../src/csv-manager.js';

async function testCSV() {
  console.log('测试 CSV 功能...');
  
  try {
    const prompts = await readPromptsFromCSV();
    console.log(`成功读取了 ${prompts.length} 个 prompts`);
    
    if (prompts.length > 0) {
      console.log('\n前3个 prompts:');
      prompts.slice(0, 3).forEach((prompt, index) => {
        console.log(`${index + 1}. ${prompt.name}: ${prompt.description}`);
      });
    }
    
    // 检查是否有分类信息
    const categories = [...new Set(prompts.map(p => p.category))];
    console.log(`\n发现的分类: ${categories.join(', ')}`);
    
    // 检查标签
    const allTags = prompts.flatMap(p => p.tags ? p.tags.split(',').map(tag => tag.trim()) : []);
    const uniqueTags = [...new Set(allTags)];
    console.log(`\n发现的标签: ${uniqueTags.slice(0, 10).join(', ')}...`);
    
  } catch (error) {
    console.error('测试失败:', error);
  }
}

testCSV();

import TurndownService from 'turndown';
import * as cheerio from 'cheerio';
import { downloadAsset } from './storage.js';

// 初始化 Turndown 服务
const turndownService = new TurndownService({
  headingStyle: 'atx', // 使用 # 风格的标题
  codeBlockStyle: 'fenced', // 使用 ``` 包裹的代码块
});

/**
 * 将 HTML 内容转换为 Markdown，并处理图片下载
 * @param {string} html 网页的完整HTML内容
 * @param {string} base_url 文章的原始URL，用于解析相对路径
 * @returns {Promise<{title: string, content: string}>} 返回包含文章标题和Markdown格式内容的对象
 */
async function convertToMarkdown(html, base_url) {
  try {
    const $ = cheerio.load(html);

    // 1. 提取文章标题
    const title = $('h1').first().text().trim() || $('title').text().trim();

    // 2. 智能提取文章正文所在的DOM节点
    const articleNode = 
      $('article').length ? $('article') :
      $('#content').length ? $('#content') :
      $('#main').length ? $('#main') :
      $('.post-content').length ? $('.post-content') :
      $('.article-content').length ? $('.article-content') :
      $('body');
    
    // 3. 处理图片下载和链接替换
    const imagePromises = [];
    articleNode.find('img').each((index, element) => {
      const img = $(element);
      const src = img.attr('src');
      if (src) {
        // 将相对URL转换为绝对URL
        const absoluteUrl = new URL(src, base_url).href;
        
        const promise = downloadAsset(absoluteUrl).then(localPath => {
          if (localPath) {
            // 将 'assets\xxx.png' 转换为 'assets/xxx.png' 以兼容markdown
            const markdownPath = localPath.replace(/\\/g, '/');
            img.attr('src', `app-asset://${markdownPath}`);
          }
        });
        imagePromises.push(promise);
      }
    });

    // 等待所有图片处理完成
    await Promise.all(imagePromises);

    // 4. 将处理后的HTML内容转换为Markdown
    const articleContent = articleNode.html();
    const markdownContent = turndownService.turndown(articleContent || '');

    return {
      title: title || '无标题',
      content: markdownContent || '',
    };
  } catch (error) {
    console.error('HTML转换为Markdown时出错:', error);
    throw new Error('转换内容失败');
  }
}

export { convertToMarkdown };

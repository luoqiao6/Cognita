/**
 * 使用主进程（后端）来下载文章的HTML内容
 * @param {string} url 要下载的网页URL
 * @returns {Promise<string>} 返回网页的HTML字符串
 */
async function fetchArticleHtml(url) {
  // window.electronAPI 是由 preload.js 暴露出来的安全API
  if (window.electronAPI && typeof window.electronAPI.downloadArticle === 'function') {
    const result = await window.electronAPI.downloadArticle(url);
    if (result.success) {
      return result.data;
    } else {
      // 从主进程抛出错误
      throw new Error(result.error);
    }
  } else {
    // 这是一个降级或错误情况，说明preload脚本没有正确加载
    throw new Error('下载功能不可用，请检查应用配置。');
  }
}

export { fetchArticleHtml };

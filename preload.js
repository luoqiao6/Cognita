// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { contextBridge, ipcRenderer } = require('electron');

// 在 "window" 对象上暴露一个安全的 API，
// 这样渲染进程就可以调用主进程的功能，而无需暴露整个 ipcRenderer。
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * 调用主进程来下载文章
   * @param {string} url 文章URL
   * @returns {Promise<{success: boolean, data?: string, error?: string}>}
   */
  downloadArticle: (url) => ipcRenderer.invoke('download-article', url),

  /**
   * 调用主进程来保存文章
   * @param {{title: string, content: string}} article 文章对象
   * @returns {Promise<{success: boolean, path?: string, error?: string}>}
   */
  saveArticle: (article) => ipcRenderer.invoke('save-article', article),

  // --- 数据库API ---
  getArticles: (categoryId) => ipcRenderer.invoke('get-articles', categoryId),
  addArticle: (articleData) => ipcRenderer.invoke('add-article', articleData),
  readArticleContent: (filePath) => ipcRenderer.invoke('read-article-content', filePath),
  deleteArticle: (id) => ipcRenderer.invoke('delete-article', id),
  searchArticles: (term) => ipcRenderer.invoke('search-articles', term),
  // --- 分类API ---
  getCategories: () => ipcRenderer.invoke('get-categories'),
  addCategory: (name) => ipcRenderer.invoke('add-category', name),
  updateArticleCategory: (data) => ipcRenderer.invoke('update-article-category', data),
  renameCategory: (data) => ipcRenderer.invoke('rename-category', data),
  deleteCategory: (id) => ipcRenderer.invoke('delete-category', id),
  downloadAsset: (url) => ipcRenderer.invoke('download-asset', url),
});

window.addEventListener('DOMContentLoaded', () => {
  // 可以在这里暴露一些Node.js API给渲染进程
  // 例如：
  // const { ipcRenderer } = require('electron');
  // window.ipcRenderer = ipcRenderer;
}); 
/**
 * 使用主进程（后端）来保存文章内容到本地文件
 * @param {{title: string, content: string}} article 要保存的文章对象
 * @returns {Promise<string>} 返回保存的文件路径
 */
export async function saveArticle(article) {
  if (window.electronAPI && typeof window.electronAPI.saveArticle === 'function') {
    const result = await window.electronAPI.saveArticle(article);
    if (result.success) {
      return result.path;
    } else {
      throw new Error(result.error);
    }
  } else {
    throw new Error('保存功能不可用，请检查应用配置。');
  }
}

/**
 * 从数据库获取所有文章记录
 * @returns {Promise<Array>}
 */
export async function getArticles(categoryId) {
  const result = await window.electronAPI.getArticles(categoryId);
  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.error);
  }
}

/**
 * 向数据库添加一篇文章记录
 * @param {{title: string, url: string, filePath: string}} articleData
 * @returns {Promise<number>} 返回新纪录的ID
 */
export async function addArticleToDb(articleData) {
  const result = await window.electronAPI.addArticle(articleData);
  if (result.success) {
    return result.id;
  } else {
    throw new Error(result.error);
  }
}

/**
 * 读取指定路径的Markdown文件内容
 * @param {string} filePath
 * @returns {Promise<string>}
 */
export async function readArticleContent(filePath) {
  const result = await window.electronAPI.readArticleContent(filePath);
  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.error);
  }
}

/**
 * 删除一篇文章（包括文件和数据库记录）
 * @param {number} id 文章ID
 * @returns {Promise<void>}
 */
export async function deleteArticle(id) {
  const result = await window.electronAPI.deleteArticle(id);
  if (!result.success) {
    throw new Error(result.error);
  }
}

// === 分类相关 ===

export async function getCategories() {
  const result = await window.electronAPI.getCategories();
  if (result.success) return result.data;
  throw new Error(result.error);
}

export async function addCategory(name) {
  const result = await window.electronAPI.addCategory(name);
  if (result.success) return result.id;
  throw new Error(result.error);
}

export async function updateArticleCategory({ articleId, categoryId }) {
  const result = await window.electronAPI.updateArticleCategory({ articleId, categoryId });
  if (!result.success) throw new Error(result.error);
}

export async function renameCategory({ id, name }) {
  const result = await window.electronAPI.renameCategory({ id, name });
  if (!result.success) throw new Error(result.error);
}

export async function deleteCategory(id) {
  const result = await window.electronAPI.deleteCategory(id);
  if (!result.success) throw new Error(result.error);
}

// === 资源下载 ===
export async function downloadAsset(url) {
  const result = await window.electronAPI.downloadAsset(url);
  if (result.success) return result.path;
  // 下载失败不抛出错误，以免中断整个文章的转换
  console.error(`Asset download failed for ${url}: ${result.error}`);
  return null;
}

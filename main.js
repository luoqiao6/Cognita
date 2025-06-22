const { app, BrowserWindow, ipcMain, protocol } = require('electron');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const Database = require('better-sqlite3');

// 数据库初始化
const dbPath = path.join(app.getPath('userData'), 'knowledge.db');
const db = new Database(dbPath);

// --- 数据库迁移脚本 ---
// 检查 articles 表是否包含 categoryId 列
const articlesInfo = db.prepare("PRAGMA table_info(articles)").all();
const hasCategoryId = articlesInfo.some(col => col.name === 'categoryId');

// 如果不存在，则添加该列
if (!hasCategoryId) {
  console.log('数据库迁移：为 articles 表添加 categoryId 列...');
  try {
    db.exec(`ALTER TABLE articles ADD COLUMN categoryId INTEGER REFERENCES categories(id) ON DELETE SET NULL`);
    console.log('迁移成功！');
  } catch (error) {
    console.error('数据库迁移失败:', error);
  }
}

// 创建 articles 表（如果不存在）
db.exec(`
  CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    url TEXT,
    filePath TEXT NOT NULL,
    categoryId INTEGER,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE SET NULL
  )
`);

// 创建 categories 表
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  )
`);

// 创建用于全文搜索的虚拟表 (FTS5)
// 我们将只索引 title 和 content，并且 content 会在添加文章时手动插入
db.exec(`
  CREATE VIRTUAL TABLE IF NOT EXISTS articles_fts USING fts5(
    title,
    content
  )
`);

// --- 数据迁移：确保所有现有文章都在FTS表中 ---
const transferMissingArticles = () => {
  const stmt = db.prepare(`
    SELECT id, title, filePath FROM articles
    WHERE id NOT IN (SELECT rowid FROM articles_fts)
  `);
  const missingArticles = stmt.all();

  if (missingArticles.length > 0) {
    console.log(`发现 ${missingArticles.length} 篇缺失索引的文章，正在同步...`);
    const insertStmt = db.prepare('INSERT INTO articles_fts (rowid, title, content) VALUES (?, ?, ?)');
    for (const article of missingArticles) {
      try {
        if (fs.existsSync(article.filePath)) {
          const content = fs.readFileSync(article.filePath, 'utf-8');
          insertStmt.run(article.id, article.title, content);
        }
      } catch (error) {
        console.error(`为文章 ${article.id} 同步FTS索引失败:`, error);
      }
    }
    console.log('FTS索引同步完成。');
  }
};
// 应用启动时执行一次
transferMissingArticles();

// 检查并插入默认分类
try {
  const stmt = db.prepare("INSERT INTO categories (name) VALUES ('未分类')");
  stmt.run();
} catch (error) {
  // 如果分类已存在，会抛出 UNIQUE 约束错误，可以安全地忽略
  if (!error.message.includes('UNIQUE constraint failed')) {
    console.error('Failed to insert default category:', error);
  }
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      // 开启安全设置
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // 开发环境下加载 Vite 开发服务器，生产环境下加载打包后的文件
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }
}

// 监听来自渲染进程的下载请求
ipcMain.handle('download-article', async (event, url) => {
  try {
    console.log(`Main process received download request for: ${url}`);
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Main process download error:', error.message);
    return { success: false, error: error.message || 'Failed to download URL in main process' };
  }
});

// 监听来自渲染进程的保存请求
ipcMain.handle('save-article', async (event, { title, content }) => {
  try {
    const documentsPath = app.getPath('documents');
    const storagePath = path.join(documentsPath, 'KnowledgeBase');

    // 确保存储目录存在
    if (!fs.existsSync(storagePath)) {
      fs.mkdirSync(storagePath, { recursive: true });
    }

    // 清理文件名中的非法字符
    const safeTitle = title.replace(/[\\/:*?"<>|]/g, '-');
    const filePath = path.join(storagePath, `${safeTitle}.md`);

    fs.writeFileSync(filePath, content);
    console.log(`Article saved to: ${filePath}`);
    
    return { success: true, path: filePath };
  } catch (error) {
    console.error('Main process save error:', error.message);
    return { success: false, error: 'Failed to save the article.' };
  }
});

// === 数据库IPC处理 ===

// 获取所有文章
ipcMain.handle('get-articles', (event, categoryId) => {
  try {
    const baseQuery = `
      SELECT a.id, a.title, a.url, a.filePath, a.createdAt, c.name as categoryName
      FROM articles a
      LEFT JOIN categories c ON a.categoryId = c.id
    `;
    
    let stmt;
    if (categoryId) {
      stmt = db.prepare(`${baseQuery} WHERE a.categoryId = ? ORDER BY a.createdAt DESC`);
      return { success: true, data: stmt.all(categoryId) };
    } else {
      stmt = db.prepare(`${baseQuery} ORDER BY a.createdAt DESC`);
      return { success: true, data: stmt.all() };
    }
  } catch (error) {
    console.error('Failed to get articles:', error);
    return { success: false, error: 'Failed to retrieve articles.' };
  }
});

// 添加一篇文章
ipcMain.handle('add-article', (event, { title, url, filePath, categoryId }) => {
  try {
    let finalCategoryId = categoryId;
    // 如果没有传入分类，则自动归入"未分类"
    if (!finalCategoryId) {
      const defaultCategory = db.prepare("SELECT id FROM categories WHERE name = '未分类'").get();
      if (defaultCategory) {
        finalCategoryId = defaultCategory.id;
      }
    }
    const stmt = db.prepare('INSERT INTO articles (title, url, filePath, categoryId) VALUES (?, ?, ?, ?)');
    const info = stmt.run(title, url, filePath, finalCategoryId);
    const articleId = info.lastInsertRowid;

    // 读取刚保存的文件内容并更新 FTS 表
    const content = fs.readFileSync(filePath, 'utf-8');
    db.prepare('INSERT INTO articles_fts (rowid, title, content) VALUES (?, ?, ?)').run(articleId, title, content);

    return { success: true, id: articleId };
  } catch (error) {
    console.error('Failed to add article:', error);
    return { success: false, error: 'Failed to add article to database.' };
  }
});

// 删除一篇文章
ipcMain.handle('delete-article', (event, id) => {
  try {
    // 1. 先从数据库找到文件路径
    const getStmt = db.prepare('SELECT filePath FROM articles WHERE id = ?');
    const article = getStmt.get(id);

    if (article && article.filePath) {
      // 2. 读取文章内容，以查找并删除其引用的图片
      if (fs.existsSync(article.filePath)) {
        const content = fs.readFileSync(article.filePath, 'utf-8');
        const documentsPath = app.getPath('documents');
        const storagePath = path.join(documentsPath, 'KnowledgeBase');
        
        const imageRegex = /!\[.*?\]\((app-asset:\/\/assets\/.*?)\)/g;
        let match;
        while ((match = imageRegex.exec(content)) !== null) {
          const assetUrl = match[1];
          const assetRelativePath = assetUrl.substring('app-asset://'.length);
          const assetFullPath = path.join(storagePath, assetRelativePath);
          
          if (fs.existsSync(assetFullPath)) {
            try {
              fs.unlinkSync(assetFullPath);
              console.log(`已删除关联图片: ${assetFullPath}`);
            } catch (e) {
              console.error(`删除关联图片失败 ${assetFullPath}:`, e);
            }
          }
        }

        // 3. 删除文章文件本身
        fs.unlinkSync(article.filePath);
      }
    }

    // 从 FTS 表删除记录
    db.prepare('DELETE FROM articles_fts WHERE rowid = ?').run(id);

    // 从数据库删除记录
    const deleteStmt = db.prepare('DELETE FROM articles WHERE id = ?');
    const info = deleteStmt.run(id);

    if (info.changes > 0) {
      return { success: true };
    } else {
      return { success: false, error: 'Article not found in database.' };
    }
  } catch(e) {
    console.error('Failed to delete article:', e);
    return { success: false, error: 'Failed to delete article.' };
  }
});

// 搜索文章
ipcMain.handle('search-articles', (event, searchTerm) => {
  if (!searchTerm) {
    // 如果搜索词为空，则返回所有文章
    return ipcMain.handlers.get('get-articles')[0](event, null);
  }
  try {
    const query = `
      SELECT a.id, a.title, a.url, a.filePath, a.createdAt, c.name as categoryName
      FROM articles a
      JOIN articles_fts fts ON a.id = fts.rowid
      LEFT JOIN categories c ON a.categoryId = c.id
      WHERE articles_fts MATCH ?
      ORDER BY rank
    `;
    const results = db.prepare(query).all(searchTerm);
    return { success: true, data: results };
  } catch (error) {
    console.error('Failed to search articles:', error);
    return { success: false, error: 'Failed to search articles.' };
  }
});

// === 分类IPC处理 ===
ipcMain.handle('get-categories', () => {
  try {
    return { success: true, data: db.prepare('SELECT * FROM categories').all() };
  } catch(e) { return { success: false, error: e.message } }
});

ipcMain.handle('add-category', (event, name) => {
  try {
    const info = db.prepare('INSERT INTO categories (name) VALUES (?)').run(name);
    return { success: true, id: info.lastInsertRowid };
  } catch(e) { return { success: false, error: e.message } }
});

ipcMain.handle('update-article-category', (event, { articleId, categoryId }) => {
  try {
    db.prepare('UPDATE articles SET categoryId = ? WHERE id = ?').run(categoryId, articleId);
    return { success: true };
  } catch(e) { return { success: false, error: e.message } }
});

ipcMain.handle('rename-category', (event, { id, name }) => {
  try {
    db.prepare('UPDATE categories SET name = ? WHERE id = ?').run(name, id);
    return { success: true };
  } catch(e) { return { success: false, error: e.message } }
});

ipcMain.handle('delete-category', (event, id) => {
  try {
    // 1. 找到 "未分类" 的ID
    const defaultCategory = db.prepare("SELECT id FROM categories WHERE name = '未分类'").get();
    const defaultId = defaultCategory ? defaultCategory.id : null;

    // 2. 将该分类下的所有文章移动到 "未分类"
    if (defaultId) {
      db.prepare('UPDATE articles SET categoryId = ? WHERE categoryId = ?').run(defaultId, id);
    } else {
      // 如果"未分类"不存在（理论上不应该发生），就设为NULL
      db.prepare('UPDATE articles SET categoryId = NULL WHERE categoryId = ?').run(id);
    }
    
    // 3. 删除该分类
    db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    return { success: true };
  } catch(e) { return { success: false, error: e.message } }
});

// 下载图片等资源
ipcMain.handle('download-asset', async (event, url) => {
  try {
    const documentsPath = app.getPath('documents');
    const assetsPath = path.join(documentsPath, 'KnowledgeBase', 'assets');
    if (!fs.existsSync(assetsPath)) {
      fs.mkdirSync(assetsPath, { recursive: true });
    }
    
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);
    
    // 生成一个安全且唯一的文件名
    const urlParts = new URL(url);
    const originalFilename = path.basename(urlParts.pathname);
    const safeFilename = originalFilename.replace(/[^a-zA-Z0-9.\-]/g, '_');
    const uniqueFilename = `${Date.now()}-${safeFilename}`;
    const filePath = path.join(assetsPath, uniqueFilename);

    fs.writeFileSync(filePath, buffer);
    
    // 返回一个可以在Markdown中使用的相对路径
    return { success: true, path: path.join('assets', uniqueFilename) };
  } catch (error) {
    console.error(`Failed to download asset ${url}:`, error.message);
    return { success: false, error: 'Failed to download asset' };
  }
});

// 读取文章内容
ipcMain.handle('read-article-content', (event, filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return { success: true, data: content };
    } else {
      return { success: false, error: 'File not found.' };
    }
  } catch (error) {
    console.error('Failed to read article content:', error);
    return { success: false, error: 'Failed to read file.' };
  }
});

app.whenReady().then(() => {
  // 注册自定义协议，用于安全地加载本地资源
  const documentsPath = app.getPath('documents');
  const storagePath = path.join(documentsPath, 'KnowledgeBase');
  
  protocol.registerFileProtocol('app-asset', (request, callback) => {
    const url = request.url.substr('app-asset://'.length);
    const filePath = path.join(storagePath, url);
    callback({ path: path.normalize(filePath) });
  });

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
}); 
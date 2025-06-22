import { defineStore } from 'pinia';

// 一个硬编码的预览文章，用于在设置时展示样式
const previewArticle = {
  id: -1,
  title: '预览文章样式',
  content: `# 这是一个一级标题

## 这是一个二级标题

这是一段普通的文本，包含 **加粗**、*斜体* 和 \`内联代码\`。

> 这是一个引用块。您可以测试不同主题下的引用样式。

\`\`\`javascript
// 这是一个代码块
function greet(name) {
  console.log('Hello, ' + name);
}
greet('World');
\`\`\`

- 列表项 1
- 列表项 2
- 列表项 3
`,
  url: '#',
  filePath: '',
};

export const useArticleStore = defineStore('article', {
  state: () => ({
    // 当前正在阅读的文章内容
    currentArticleContent: '',
    // 当前文章的标题
    currentArticleTitle: '',
    // 当前文章的原始URL
    currentArticleUrl: '',
    // 分类列表
    categories: [],
    // 当前选中的分类ID
    selectedCategoryId: null,
    // 加载状态
    isLoading: false,
    selectedArticle: null,
    isReading: false,
    isPreviewing: false, // 是否正在预览
  }),
  actions: {
    setArticle(article) {
      this.currentArticleTitle = article.title;
      this.currentArticleContent = article.content;
      this.currentArticleUrl = article.url;
    },
    clearArticle() {
      this.currentArticleTitle = '';
      this.currentArticleContent = '';
      this.currentArticleUrl = '';
    },
    setCategories(categories) {
      this.categories = categories;
    },
    setSelectedCategory(categoryId) {
      this.selectedCategoryId = categoryId;
    },
    setSelectedArticle(article) {
      this.selectedArticle = article;
      this.isPreviewing = false; // 用户主动选择文章，则退出预览状态
    },
    setLoading(status) {
      this.isLoading = status;
    },
    setReadingMode(status) {
      this.isReading = status;
    },
    setupPreview() {
      if (!this.selectedArticle) {
        this.selectedArticle = previewArticle;
        this.isPreviewing = true;
      }
    },
    clearPreview() {
      if (this.isPreviewing) {
        this.selectedArticle = null;
        this.isPreviewing = false;
      }
    },
  },
}); 
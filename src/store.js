import { defineStore } from 'pinia';

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
    },
    setLoading(status) {
      this.isLoading = status;
    }
  },
}); 
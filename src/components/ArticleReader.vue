<template>
  <div class="article-reader">
    <div v-if="store.selectedArticle">
      <div class="reader-toolbar">
        <el-button @click="exitReadingMode" :icon="ArrowLeftBold" circle />
        <h1 class="reader-title">{{ store.selectedArticle.title }}</h1>
        <a :href="store.selectedArticle.url" target="_blank" class="source-link">查看原文</a>
      </div>
      <div class="reader-content" ref="contentContainer" v-html="renderedMarkdown"></div>
    </div>
    <div v-else class="empty-state">
      <p>从左侧选择一篇文章开始阅读</p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue';
import { useArticleStore } from '../store.js';
import { marked } from 'marked';
import { Link, ArrowLeftBold } from '@element-plus/icons-vue';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css'; // 引入 GitHub 风格的代码高亮样式

const store = useArticleStore();
const contentContainer = ref(null);

const exitReadingMode = () => {
  store.setReadingMode(false);
  store.setSelectedArticle(null);
};

const renderedMarkdown = computed(() => {
  if (store.selectedArticle && store.selectedArticle.content) {
    return marked(store.selectedArticle.content);
  }
  return '';
});

// 监听内容变化，手动触发高亮
watch(renderedMarkdown, async () => {
  // 等待 v-html 将内容渲染到DOM上
  await nextTick();

  if (contentContainer.value) {
    // 找到所有代码块并应用高亮
    const blocks = contentContainer.value.querySelectorAll('pre code');
    blocks.forEach((block) => {
      hljs.highlightElement(block);
    });
  }
}, { immediate: true }); // immediate: true 保证首次加载也能高亮
</script>

<style scoped>
/* Remove the v-if from the root element, so .article-reader is always present */
.article-reader {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
  background-color: #fff;
  display: flex;
  flex-direction: column;
}

/* Ensure the content area fills the available space */
.reader-content {
  flex-grow: 1;
  overflow-y: auto;
}

.reader-container {
  height: 100%;
  overflow-y: auto;
  padding: 20px;
  background-color: #fff;
  border-left: 1px solid #ebeef5;
}

.article-content {
  max-width: 800px;
  margin: 0 auto;
  line-height: 1.8;
}

.article-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.article-title a {
  color: #909399;
  text-decoration: none;
}

.article-title a:hover {
  color: #409EFF;
}

.article-content h1 {
  border-bottom: 1px solid #ddd;
  padding-bottom: 10px;
  margin-bottom: 20px;
}

.placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #909399;
}

/* 简单的代码块样式 */
:deep(pre) {
  background-color: #f5f5f5;
  padding: 15px;
  border-radius: 5px;
  overflow-x: auto;
}

:deep(code) {
  font-family: 'Courier New', Courier, monospace;
}

.reader-toolbar {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
  border-bottom: 1px solid #e4e7ed;
  padding-bottom: 15px;
}

.reader-title {
  font-size: 24px;
  margin: 0;
  flex-grow: 1;
}

.source-link {
  font-size: 14px;
}
</style>

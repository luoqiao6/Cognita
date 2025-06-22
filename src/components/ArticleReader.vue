<template>
  <div class="reader-container" v-loading="store.isLoading">
    <div v-if="renderedContent" class="article-content">
      <h1 class="article-title">
        <span>{{ store.currentArticleTitle }}</span>
        <a v-if="store.currentArticleUrl" :href="store.currentArticleUrl" target="_blank" title="查看原文">
          <el-icon><Link /></el-icon>
        </a>
      </h1>
      <div ref="contentContainer" v-html="renderedContent"></div>
    </div>
    <div v-else class="placeholder">
      <p>从左侧列表选择一篇文章开始阅读</p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue';
import { useArticleStore } from '../store.js';
import { marked } from 'marked';
import { Link } from '@element-plus/icons-vue';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css'; // 引入 GitHub 风格的代码高亮样式

const store = useArticleStore();
const contentContainer = ref(null);

const renderedContent = computed(() => {
  if (store.currentArticleContent) {
    // 仅使用 marked 进行基础转换
    return marked.parse(store.currentArticleContent);
  }
  return '';
});

// 监听内容变化，手动触发高亮
watch(renderedContent, async () => {
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
</style>

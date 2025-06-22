<template>
  <div class="article-reader" :style="readerStyle">
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
import { useArticleStore } from '../store/articleStore';
import { useSettingsStore } from '../store/settingsStore';
import { marked } from 'marked';
import { Link, ArrowLeftBold } from '@element-plus/icons-vue';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css'; // 引入 GitHub 风格的代码高亮样式

const store = useArticleStore();
const settingsStore = useSettingsStore();
const contentContainer = ref(null);

const readerStyle = computed(() => ({
  '--reader-bg': settingsStore.readerSettings.background,
  '--reader-color': settingsStore.readerSettings.color,
  '--reader-font-size': `${settingsStore.readerSettings.fontSize}px`,
  '--reader-font-family': settingsStore.readerSettings.fontFamily,
  '--reader-code-bg': settingsStore.readerSettings.codeBlockBackground,
}));

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
  padding: 20px 40px;
  height: 100%;
  overflow-y: auto;
  background-color: var(--reader-bg);
  color: var(--reader-color);
  font-size: var(--reader-font-size);
  font-family: var(--reader-font-family);
  line-height: 1.8;
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
  border-bottom: 1px solid rgba(128, 128, 128, 0.3);
  padding-bottom: 15px;
}

.reader-title {
  font-size: 1.8em; /* Relative to the base font size */
}

.source-link {
  color: var(--reader-color);
  opacity: 0.7;
}

:deep(.reader-content h1),
:deep(.reader-content h2),
:deep(.reader-content h3),
:deep(.reader-content h4),
:deep(.reader-content p),
:deep(.reader-content ul),
:deep(.reader-content ol),
:deep(.reader-content li),
:deep(.reader-content strong),
:deep(.reader-content em) {
  color: var(--reader-color);
}

:deep(.reader-content h1),
:deep(.reader-content h2),
:deep(.reader-content h3),
:deep(.reader-content h4) {
  border-bottom-color: rgba(128, 128, 128, 0.3);
}

:deep(.reader-content a) {
  color: #1e80ff; /* Keep links distinct for better usability */
}

:deep(.reader-content blockquote) {
  border-left-color: rgba(128, 128, 128, 0.5);
  color: var(--reader-color); /* Use variable instead of inherit */
  opacity: 0.8;
}

/* Container for the code block with a new semi-transparent background */
:deep(.reader-content pre) {
  background-color: var(--reader-code-bg) !important;
  padding: 1em;
  border-radius: 6px;
  border: 1px solid rgba(128, 128, 128, 0.1);
}

/* Ensure the inner code element is transparent to avoid color stacking */
:deep(.reader-content pre code.hljs) {
  background-color: transparent !important;
}
</style>

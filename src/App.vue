<template>
  <div class="common-layout">
    <el-container>
      <!-- 阅读模式 -->
      <div v-if="articleStore.isReading" class="reading-mode-container">
        <ArticleReader />
      </div>

      <!-- 常规模式 -->
      <div v-else id="split-container" class="split-container">
        <div id="category-panel" class="split-item">
          <CategoryTree />
        </div>
        <div id="list-panel" class="split-item">
          <ArticleList />
        </div>
        <div id="reader-panel" class="split-item">
          <ArticleReader />
        </div>
      </div>
    </el-container>
    <SettingsPanel />
  </div>
</template>

<script setup>
import { onMounted, watch, nextTick } from 'vue';
import { useArticleStore } from './store/articleStore';
import { useSettingsStore } from './store/settingsStore';
import Split from 'split.js';
import CategoryTree from './components/CategoryTree.vue';
import ArticleList from './components/ArticleList.vue';
import ArticleReader from './components/ArticleReader.vue';
import SettingsPanel from './components/SettingsPanel.vue';

const articleStore = useArticleStore();
const settingsStore = useSettingsStore();
let splitInstance = null;

const initializeSplit = () => {
  if (splitInstance) {
    splitInstance.destroy();
  }
  nextTick(() => {
    splitInstance = Split(['#category-panel', '#list-panel', '#reader-panel'], {
      sizes: [20, 30, 50],
      minSize: [200, 300, 400],
      gutterSize: 8,
      cursor: 'col-resize',
    });
  });
};

// 监听全局主题变化
watch(() => settingsStore.globalTheme, (newTheme) => {
  const html = document.documentElement;
  if (newTheme === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
}, { immediate: true });

// onMounted 负责初始加载时的布局初始化
onMounted(() => {
  if (!articleStore.isReading) {
    initializeSplit();
  }
});

// watch 负责响应 isReading 状态的后续变化
watch(() => articleStore.isReading, (isReading) => {
  if (!isReading) {
    // 从阅读模式返回
    initializeSplit();
  } else {
    // 进入阅读模式
    if (splitInstance) {
      splitInstance.destroy();
      splitInstance = null;
    }
  }
});
</script>

<style>
html, body, #app, .common-layout, .el-container {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden; /* 防止出现不必要的滚动条 */
}

.split-container {
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100vh;
}

.split-item {
  padding: 0; /* 改为0，由内部组件控制 */
  box-sizing: border-box;
  overflow-y: auto; /* 让每个面板内容超出时可以独立滚动 */
  /* 使用 Element Plus 的背景色变量 */
  background-color: var(--el-bg-color);
}

#category-panel {
  border-right: 1px solid #dcdfe6;
}
#list-panel {
  border-right: 1px solid #dcdfe6;
}

.gutter {
  background-color: #f7f7f7;
  background-repeat: no-repeat;
  background-position: 50%;
  z-index: 10;
}

.gutter.gutter-horizontal {
  cursor: col-resize;
  background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAeCAYAAADkftS9AAAAIklEQVQoU2M4c+bMfxAGAgYYmwGrIIiDjrELjpo5aiZeMwF+yNnOs5KSvgAAAABJRU5ErkJggg==');
}

.reading-mode-container {
  width: 100%;
  height: 100%;
}
</style>

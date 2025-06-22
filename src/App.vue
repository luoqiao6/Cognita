<template>
  <div class="common-layout">
    <el-container>
      <!-- 阅读模式 -->
      <div v-if="store.isReading" class="reading-mode-container">
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
  </div>
</template>

<script setup>
import { onMounted, watch, nextTick } from 'vue';
import { useArticleStore } from './store';
import Split from 'split.js';
import CategoryTree from './components/CategoryTree.vue';
import ArticleList from './components/ArticleList.vue';
import ArticleReader from './components/ArticleReader.vue';

const store = useArticleStore();
let splitInstance = null;

const initializeSplit = () => {
  if (splitInstance) {
    splitInstance.destroy();
  }
  // 使用 nextTick 确保 DOM 更新完毕
  nextTick(() => {
    splitInstance = Split(['#category-panel', '#list-panel', '#reader-panel'], {
      sizes: [20, 30, 50],
      minSize: [200, 300, 400],
      gutterSize: 8,
      cursor: 'col-resize',
    });
  });
};

watch(() => store.isReading, (isReading) => {
  if (!isReading) {
    initializeSplit();
  } else {
    if (splitInstance) {
      splitInstance.destroy();
      splitInstance = null;
    }
  }
}, { immediate: true }); // immediate确保初始状态也执行

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
  height: 100%;
}

.split-item {
  padding: 0; /* 改为0，由内部组件控制 */
  box-sizing: border-box;
  overflow-y: auto; /* 让每个面板内容超出时可以独立滚动 */
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

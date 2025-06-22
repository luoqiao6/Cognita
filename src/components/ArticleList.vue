<template>
  <div class="article-list-container">
    <div class="toolbar">
      <form @submit.prevent="handleDownloadSubmit" class="download-form">
        <el-input
          v-model="url"
          placeholder="输入文章URL以下载，按回车键确认"
          class="input-with-button"
          clearable
        >
          <template #append>
            <el-button :loading="loading" native-type="submit">下载</el-button>
          </template>
        </el-input>
      </form>
      <el-input
        v-model="searchTerm"
        placeholder="搜索标题和内容..."
        class="search-input"
        clearable
        @input="handleSearch"
      />
    </div>
    <div class="table-container">
      <el-table :data="articles" stripe style="width: 100%" @row-click="handleRowClick" row-key="id" v-loading="loading">
        <el-table-column prop="title" label="标题">
          <template #default="{ row }">
            <div draggable="true" @dragstart="handleDragStart(row, $event)">
              {{ row.title }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="categoryName" label="分类" width="120" />
        <el-table-column prop="createdAt" label="创建时间" width="180" #default="{ row }">
          {{ new Date(row.createdAt).toLocaleString() }}
        </el-table-column>
        <el-table-column label="操作" width="70">
          <template #default="{ row }">
            <el-button link type="danger" @click.stop="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useArticleStore } from '../store.js';
import emitter from '../eventBus.js';
import { fetchArticleHtml } from '../services/downloader.js';
import { convertToMarkdown } from '../services/converter.js';
import { saveArticle, getArticles, addArticleToDb, readArticleContent, deleteArticle, updateArticleCategory, searchArticles } from '../services/storage.js';
import { debounce } from 'lodash-es';

const store = useArticleStore();
const url = ref('');
const loading = ref(false);
const articles = ref([]);
const searchTerm = ref('');

const fetchArticles = async (categoryId) => {
  loading.value = true;
  try {
    articles.value = await getArticles(categoryId);
  } catch (error) {
    ElMessage.error('加载文章列表失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const handleSearch = debounce(async () => {
  loading.value = true;
  try {
    articles.value = await searchArticles(searchTerm.value);
  } catch (error) {
    ElMessage.error('搜索失败');
  } finally {
    loading.value = false;
  }
}, 300); // 300ms 防抖

const handleCategorySelected = (categoryId) => {
  store.setSelectedCategory(categoryId);
  searchTerm.value = ''; // 清空搜索框
  fetchArticles(categoryId);
};

const refreshList = () => {
  fetchArticles(store.selectedCategoryId);
}

// 组件加载时执行
onMounted(() => {
  // 监听分类选择事件
  emitter.on('category-selected', handleCategorySelected);
  // 监听文章数据更新事件（用于拖拽等场景）
  emitter.on('articles-updated', refreshList);
  // 初始加载"所有文章"
  fetchArticles(null);
});

onUnmounted(() => {
  // 组件卸载时移除监听，防止内存泄漏
  emitter.off('category-selected', handleCategorySelected);
  emitter.off('articles-updated', refreshList);
});

const handleDragStart = (article, event) => {
  event.dataTransfer.setData('text/plain', article.id);
  event.dataTransfer.effectAllowed = 'move';
};

const handleDownloadSubmit = async () => {
  if (!url.value.trim()) {
    ElMessage.warning('请输入URL');
    return;
  }
  loading.value = true;
  try {
    const html = await fetchArticleHtml(url.value);
    const { title, content } = await convertToMarkdown(html, url.value);
    const filePath = await saveArticle({ title, content: content });
    await addArticleToDb({ title, url: url.value, filePath, categoryId: store.selectedCategoryId });
    ElMessage.success('下载并保存成功！');
    url.value = '';
    // 刷新当前分类的文章列表
    fetchArticles(store.selectedCategoryId); 
  } catch (error) {
    ElMessage.error(error.message || '处理文章失败');
  } finally {
    loading.value = false;
  }
};

const handleDelete = async (article) => {
  try {
    await ElMessageBox.confirm(
      `确定要永久删除文章《${article.title}》吗？`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    
    await deleteArticle(article.id);
    ElMessage.success('文章已删除');
    
    // 如果删除的是当前正在阅读的文章，则清空阅读器
    if (store.currentArticleTitle === article.title) {
      store.clearArticle();
    }
    
    await fetchArticles(store.selectedCategoryId); // 重新加载列表
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
      console.error(error);
    }
  }
};

const handleRowClick = async (row) => {
  try {
    const content = await readArticleContent(row.filePath);
    store.setSelectedArticle({ ...row, content });
    store.setReadingMode(true); // 进入阅读模式
  } catch (error) {
    ElMessage.error('加载文章内容失败');
  }
};
</script>

<style scoped>
.article-list-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #fff;
}
.toolbar {
  flex-shrink: 0;
  padding: 15px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.download-form {
  width: 100%;
}
.search-input {
  width: 100%;
  max-width: 400px;
}
.table-container {
  flex-grow: 1;
  overflow-y: auto;
}
.draggable-title {
  cursor: move;
}
</style>

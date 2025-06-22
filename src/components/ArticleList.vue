<template>
  <div>
    <el-input v-model="url" placeholder="请输入文章URL" class="input-with-button">
      <template #append>
        <el-button @click="handleDownload" :loading="loading">下载</el-button>
      </template>
    </el-input>
    
    <el-table :data="articles" stripe style="width: 100%" row-key="id" v-loading="loading">
      <el-table-column prop="title" label="标题">
        <template #default="{ row }">
          <div draggable="true" @dragstart="handleDragStart(row, $event)">
            {{ row.title }}
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="categoryName" label="分类" width="120" />
      <el-table-column prop="createdAt" label="保存日期" width="180" />
      <el-table-column label="操作" width="180">
        <template #default="scope">
          <el-button link type="primary" size="small" @click="handleView(scope.row)">查看</el-button>
          <el-button link type="danger" size="small" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useArticleStore } from '../store.js';
import emitter from '../eventBus.js';
import { fetchArticleHtml } from '../services/downloader.js';
import { convertToMarkdown } from '../services/converter.js';
import { saveArticle, getArticles, addArticleToDb, readArticleContent, deleteArticle, updateArticleCategory } from '../services/storage.js';

const store = useArticleStore();
const url = ref('');
const loading = ref(false);
const articles = ref([]);

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

const handleCategorySelected = (categoryId) => {
  store.setSelectedCategory(categoryId); // 仍然更新store，以便下载时能获取
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

const handleDownload = async () => {
  if (!url.value) {
    ElMessage.warning('请输入URL');
    return;
  }
  loading.value = true;
  const originalUrl = url.value;

  try {
    const html = await fetchArticleHtml(originalUrl);
    const { title, content } = await convertToMarkdown(html, originalUrl);
    
    const filePath = await saveArticle({ title, content });
    
    // 一步到位，直接在添加时就设置好分类
    await addArticleToDb({ 
      title, 
      url: originalUrl, 
      filePath, 
      categoryId: store.selectedCategoryId 
    });

    // 刷新当前列表
    await fetchArticles(store.selectedCategoryId);

    ElMessage.success(`文章《${title}》已成功保存！`);
    
    // 下载后自动查看
    handleView({ title, url: originalUrl, filePath });

  } catch (error) {
    console.error(error);
    ElMessage.error(error.message || '处理失败');
  } finally {
    loading.value = false;
    url.value = ''; // 清空输入框
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

const handleView = async (article) => {
  store.setLoading(true);
  try {
    const content = await readArticleContent(article.filePath);
    store.setArticle({ 
      title: article.title, 
      content: content,
      url: article.url,
    });
  } catch (error) {
    ElMessage.error('读取文章内容失败');
    console.error(error);
    store.clearArticle();
  } finally {
    store.setLoading(false);
  }
};
</script>

<style scoped>
.input-with-button {
  margin-bottom: 20px;
}
.draggable-title {
  cursor: move;
}
</style>

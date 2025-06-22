<template>
  <div class="category-container">
    <el-tree
      :data="treeData"
      :props="defaultProps"
      @node-click="handleNodeClick"
      default-expand-all
      :expand-on-click-node="false"
      highlight-current
    >
      <template #default="{ node, data }">
        <span
          class="custom-tree-node"
          @dragover.prevent="handleDragOver(data, $event)"
          @dragleave="handleDragLeave($event)"
          @drop.prevent="handleDrop(data, $event)"
        >
          <span>{{ node.label }}</span>
          <span>
            <el-button
              v-if="data.id === 'add'"
              link type="primary" size="small"
              @click.stop="handleAddCategory"
            >
              添加分类
            </el-button>
            <el-dropdown 
              v-else-if="data.id && data.name !== '未分类'" 
              trigger="click" 
              @command="handleCommand"
            >
              <el-button link size="small" @click.stop>
                <el-icon><MoreFilled /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="{type: 'rename', node: node, data: data}">重命名</el-dropdown-item>
                  <el-dropdown-item :command="{type: 'delete', node: node, data: data}">删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </span>
        </span>
      </template>
    </el-tree>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import emitter from '../eventBus.js';
import { getCategories, addCategory, renameCategory, deleteCategory, updateArticleCategory } from '../services/storage.js';
import { ElMessageBox, ElMessage } from 'element-plus';
import { MoreFilled } from '@element-plus/icons-vue';

const defaultProps = { children: 'children', label: 'name' };
const categories = ref([]);

const treeData = computed(() => {
  return [
    { name: '所有文章', id: null },
    ...categories.value,
    { name: '添加新分类', id: 'add', isLeaf: true },
  ];
});

const fetchCategories = async () => {
  try {
    categories.value = await getCategories();
  } catch (error) {
    ElMessage.error('加载分类失败');
  }
};

const handleNodeClick = (data) => {
  if (data.id !== 'add') {
    emitter.emit('category-selected', data.id);
  }
};

const handleDragOver = (data, event) => {
  if (data.id && data.id !== 'add') {
    event.currentTarget.classList.add('drop-target');
  }
};

const handleDragLeave = (event) => {
  event.currentTarget.classList.remove('drop-target');
};

const handleDrop = async (data, event) => {
  event.currentTarget.classList.remove('drop-target');
  const articleId = event.dataTransfer.getData('text/plain');
  const categoryId = data.id;

  if (articleId && categoryId && categoryId !== 'add') {
    try {
      await updateArticleCategory({ articleId, categoryId });
      ElMessage.success('文章已移动分类');
      emitter.emit('articles-updated');
    } catch (error) {
      ElMessage.error('移动分类失败');
    }
  }
};

const handleAddCategory = async () => {
  try {
    const { value } = await ElMessageBox.prompt('请输入新的分类名称', '添加分类', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /.+/,
      inputErrorMessage: '分类名不能为空',
    });
    await addCategory(value);
    await fetchCategories(); // 重新加载分类
    ElMessage.success('分类添加成功');
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '添加失败');
    }
  }
};

const handleCommand = (command) => {
  if (command.type === 'rename') {
    handleRename(command.data);
  } else if (command.type === 'delete') {
    handleDelete(command.data);
  }
};

const handleRename = async (data) => {
  try {
    const { value } = await ElMessageBox.prompt('请输入新的分类名称', '重命名', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValue: data.name,
      inputPattern: /.+/,
      inputErrorMessage: '分类名不能为空',
    });
    await renameCategory({ id: data.id, name: value });
    await fetchCategories();
    ElMessage.success('重命名成功');
  } catch (error) {
    if (error !== 'cancel') ElMessage.error(error.message || '重命名失败');
  }
};

const handleDelete = async (data) => {
  try {
    await ElMessageBox.confirm(`确定删除分类《${data.name}》吗？该分类下的所有文章将被移至"未分类"。`, '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    await deleteCategory(data.id);
    await fetchCategories();
    // 删除后，通知列表刷新到"所有文章"
    emitter.emit('category-selected', null);
    ElMessage.success('删除成功');
  } catch (error) {
    if (error !== 'cancel') ElMessage.error(error.message || '删除失败');
  }
};

onMounted(() => {
  fetchCategories();
});
</script>

<style scoped>
.category-container {
  padding: 10px;
  background: #fcfcfc;
  height: 100%;
}
.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 8px;
}

.drop-target {
  background-color: #c6e2ff;
  border-radius: 4px;
}
</style>

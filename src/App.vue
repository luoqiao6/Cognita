<template>
  <div class="common-layout">
    <el-container>
      <el-header>知识管理助手</el-header>
      <el-container class="main-container">
        <el-aside width="250px">
          <CategoryTree />
        </el-aside>
        <el-main>
          <ArticleList />
        </el-main>
        <el-aside width="60%">
          <ArticleReader />
        </el-aside>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import CategoryTree from './components/CategoryTree.vue';
import ArticleList from './components/ArticleList.vue';
import ArticleReader from './components/ArticleReader.vue';
</script>

<style>
html, body, #app, .common-layout, .el-container {
  height: 100%;
  margin: 0;
}
.main-container {
  height: calc(100% - 60px);
}
.el-header {
  background-color: #B3C0D1;
  color: #333;
  text-align: center;
  line-height: 60px;
}
.el-aside {
  background-color: #D3DCE6;
  color: #333;
  height: 100%;
}
.el-main {
  background-color: #E9EEF3;
  color: #333;
  padding: 20px;
  height: 100%;
}
</style>

<template>
  <el-drawer
    :model-value="settingsStore.showSettingsPanel"
    title="显示设置"
    direction="rtl"
    @close="handleClose"
    size="320px"
  >
    <div class="settings-container">
      <el-divider>全局设置</el-divider>
      <div class="setting-item">
        <span class="label">深色模式</span>
        <el-switch
          :model-value="settingsStore.globalTheme === 'dark'"
          @change="(val) => settingsStore.setGlobalTheme(val ? 'dark' : 'light')"
        />
      </div>

      <el-divider>阅读器设置</el-divider>
      
      <div class="setting-item">
        <span class="label">字体大小</span>
        <el-slider 
          :model-value="settingsStore.readerSettings.fontSize"
          @input="settingsStore.setReaderFontSize"
          :min="12" 
          :max="32" 
          show-input 
        />
      </div>

      <div class="setting-item">
        <span class="label">字体样式</span>
        <el-select 
          :model-value="settingsStore.readerSettings.fontFamily"
          @change="settingsStore.setReaderFontFamily" 
          placeholder="请选择"
        >
          <el-option
            v-for="font in settingsStore.fontFamilies"
            :key="font.value"
            :label="font.name"
            :value="font.value"
            :style="{ fontFamily: font.value }"
          />
        </el-select>
      </div>

      <div class="setting-item">
        <span class="label">预设主题</span>
         <el-button-group>
            <el-button 
              v-for="(theme, key) in settingsStore.readerThemes" 
              :key="key"
              :type="settingsStore.activeReaderTheme === key ? 'primary' : 'default'"
              @click="settingsStore.setReaderTheme(key)"
            >
              {{ theme.name }}
            </el-button>
        </el-button-group>
      </div>

      <div class="setting-item color-picker-item">
        <span class="label">背景颜色</span>
        <el-color-picker 
          :model-value="settingsStore.readerSettings.background"
          @active-change="(color) => settingsStore.setReaderCustomColor('background', color)"
        />
      </div>
       <div class="setting-item color-picker-item">
        <span class="label">字体颜色</span>
        <el-color-picker
          :model-value="settingsStore.readerSettings.color"
          @active-change="(color) => settingsStore.setReaderCustomColor('color', color)"
        />
      </div>

    </div>
  </el-drawer>
</template>

<script setup>
import { useSettingsStore } from '../store/settingsStore';
import { useArticleStore } from '../store/articleStore';

const settingsStore = useSettingsStore();
const articleStore = useArticleStore();

const handleClose = () => {
  settingsStore.toggleSettingsPanel(false);
  articleStore.clearPreview();
};
</script>

<style scoped>
.settings-container {
  padding: 0 20px;
}
.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.setting-item .label {
  font-size: 14px;
  color: var(--el-text-color-regular);
}
.el-select {
  width: 180px;
}
.color-picker-item {
  justify-content: flex-start;
  gap: 10px;
}
</style> 
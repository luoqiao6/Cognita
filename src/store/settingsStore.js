import { defineStore } from 'pinia';
import { ref, reactive, watch } from 'vue';

// 预设字体列表
const fontFamilies = [
  { name: '默认', value: `'PingFang SC', 'Microsoft YaHei', sans-serif` },
  { name: '宋体', value: `'SimSun', serif` },
  { name: '楷体', value: `'KaiTi', 'STKaiti', serif` },
  { name: '黑体', value: `'SimHei', 'STHeiti', sans-serif` },
  { name: '思源宋体', value: `'Noto Serif SC', serif` },
  { name: '思源黑体', value: `'Noto Sans SC', sans-serif` },
];

// 预设主题
const readerThemes = {
  default: { name: '默认', background: '#FFFFFF', color: '#303133' },
  sepia: { name: '黄昏', background: '#FBF0D9', color: '#5B4636' },
  night: { name: '夜间', background: '#1D1D1D', color: '#A9A9A9' },
  green: { name: '护眼', background: '#C7EDCC', color: '#222C24' },
};


export const useSettingsStore = defineStore('settings', () => {
  // 从 localStorage 加载配置，或使用默认值
  const loadSettings = () => {
    const saved = localStorage.getItem('app-settings');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      globalTheme: 'light', // 'light' | 'dark'
      showSettingsPanel: false,
      activeReaderTheme: 'default', // 新增：当前激活的阅读器主题
      readerSettings: {
        fontSize: 16,
        fontFamily: fontFamilies[0].value,
        ...readerThemes.default, // background, color
      },
    };
  };

  // --- State ---
  const globalTheme = ref(loadSettings().globalTheme);
  const showSettingsPanel = ref(loadSettings().showSettingsPanel);
  const activeReaderTheme = ref(loadSettings().activeReaderTheme);
  const readerSettings = reactive(loadSettings().readerSettings);

  // --- Actions ---
  const toggleSettingsPanel = (visible) => {
    showSettingsPanel.value = typeof visible === 'boolean' ? visible : !showSettingsPanel.value;
  };

  const setGlobalTheme = (theme) => {
    globalTheme.value = theme;
  };
  
  const setReaderFontSize = (size) => {
    readerSettings.fontSize = size;
  };
  
  const setReaderFontFamily = (font) => {
    readerSettings.fontFamily = font;
  };

  const setReaderTheme = (themeName) => {
    const theme = readerThemes[themeName];
    if (theme) {
      readerSettings.background = theme.background;
      readerSettings.color = theme.color;
      activeReaderTheme.value = themeName; // 激活预设主题
    }
  };

  const setReaderCustomColor = (type, color) => {
    if (type === 'background') {
      readerSettings.background = color;
    } else if (type === 'color') {
      readerSettings.color = color;
    }
    activeReaderTheme.value = 'custom'; // 切换到自定义主题
  };

  // --- Persistence ---
  // 监听状态变化并保存到 localStorage
  watch(
    () => ({
      globalTheme: globalTheme.value,
      showSettingsPanel: showSettingsPanel.value,
      activeReaderTheme: activeReaderTheme.value, // 持久化
      readerSettings: { ...readerSettings },
    }),
    (newSettings) => {
      localStorage.setItem('app-settings', JSON.stringify(newSettings));
    },
    { deep: true }
  );
  
  return { 
    globalTheme, 
    showSettingsPanel, 
    activeReaderTheme, // 导出
    readerSettings,
    fontFamilies, // 导出预设字体
    readerThemes, // 导出预设主题
    toggleSettingsPanel,
    setGlobalTheme,
    setReaderFontSize,
    setReaderFontFamily,
    setReaderTheme,
    setReaderCustomColor,
  };
}); 
# Cognita - 您的智能知识管理助手

<p align="center">
  <!-- 您可以在这里替换成您的 Logo 图片 -->
  <img src="https://raw.githubusercontent.com/luoqiao6/Cognita/main/build/favicon.ico" alt="Cognita Logo" width="128">
  <h3 align="center">Cognita</h3>
  <p align="center">
    一款基于 Electron 和 Vue 3 构建的现代化桌面知识管理应用。
    <br>
    帮助您轻松捕捉、整理和回顾网络知识。
    <br>
    <br>
    <a href="https://github.com/luoqiao6/Cognita/issues">报告Bug</a>
    ·
    <a href="https://github.com/luoqiao6/Cognita/issues">请求功能</a>
  </p>
</p>

---

## 核心功能

*   **⚡️ 快速剪藏**: 一键下载网页文章，并智能转换为干净、持久的 Markdown 格式。
*   **📂 灵活组织**: 通过多级分类树结构化地管理您的知识库。
*   **📖 沉浸式阅读**: 提供专注、无干扰的 Markdown 阅读界面，支持代码高亮。
*   **🔍 全文搜索**: 快速在您的知识库中定位需要的信息（即将推出）。
*   **🖼️ 图片本地化**: 自动下载文章中的图片并保存到本地，实现完全离线访问。
*   **跨平台**: 支持 Windows, macOS 和 Linux。

## 技术栈

| 分类       | 技术                                        |
| :--------- | :------------------------------------------ |
| **桌面端**   | Electron                                    |
| **前端框架** | Vue 3 (Composition API)                     |
| **构建工具** | Vite                                        |
| **UI 库**    | Element Plus                                |
| **状态管理** | Pinia                                       |
| **数据存储** | Better-Sqlite3 (用于元数据) + 本地文件系统    |
| **核心服务** | Cheerio (HTML解析), Turndown (HTML转Markdown) |


## 系统要求

### 开发环境

*   **Node.js**: `v18.x` 或更高版本
*   **npm**: `v8.x` 或更高版本
*   **操作系统**: Windows 10+, macOS 11+, 或者主流 Linux 发行版

### 运行环境

应用打包后可在以下系统运行：
*   **Windows**: Windows 10 及以上版本
*   **macOS**: macOS 11 (Big Sur) 及以上版本 (支持 Intel 和 Apple Silicon)
*   **Linux**: 主流发行版 (如 Ubuntu, Fedora)

## 安装与使用

1.  **克隆仓库**
    ```bash
    git clone https://github.com/luoqiao6/Cognita.git
    cd Cognita
    ```

2.  **安装依赖**
    ```bash
    npm install
    ```

3.  **启动开发模式**
    这将同时启动 Vite 开发服务器和 Electron 应用。
    ```bash
    npm run dev
    ```

4.  **构建应用**
    构建适用于您当前操作系统的可执行文件。
    ```bash
    npm run build
    ```
    构建产物将位于 `dist` 目录下。


## 项目结构

```text
.
├── dist/             # 应用打包输出目录
├── src/              # 源代码目录
│ ├── components/ # Vue 组件
│ ├── services/ # 核心服务 (下载、转换、存储)
│ ├── store/ # Pinia 状态管理
│ ├── utils/ # 工具函数
│ ├── main.js # Vue 应用入口
│ └── App.vue # 根组件
├── main.js # Electron 主进程入口
├── preload.js # Electron 预加载脚本
├── package.json # 项目元数据和依赖
└── vite.config.js # Vite 配置文件
```

## 贡献

欢迎任何形式的贡献！如果您有好的想法或建议，请随时提交 [Issue](https://github.com/luoqiao6/Cognita/issues) 或 Pull Request。

## 许可证

本项目采用 [MIT License](LICENSE) 开源许可证。
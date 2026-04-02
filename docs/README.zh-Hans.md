<p align="center">
  <a href="https://github.com/heixxxa/xhs-web-exporter">
    <img alt="xhs-web-exporter" src="https://socialify.git.ci/heixxxa/xhs-web-exporter/image?description=1&descriptionEditable=Export%20notes%2C%20comments%20and%20much%20more%20from%20Xiaohongshu%20web%20app.&font=Raleway&forks=0&issues=0&pattern=Plus&pulls=0&theme=Light&logo=https%3A%2F%2Fcompanieslogo.com%2Fimg%2Forig%2Fxiaohongshu-81d36809.png" />
  </a>
</p>

<p align="center">
  <a href="https://github.com/heixxxa/xhs-web-exporter/releases">
    <img alt="UserScript" src="https://badgen.net/badge/userscript/available?color=green" />
  </a>
  <a href="https://github.com/heixxxa/xhs-web-exporter/releases">
    <img alt="Latest Release" src="https://badgen.net/github/release/heixxxa/xhs-web-exporter" />
  </a>
  <a href="https://github.com/heixxxa/xhs-web-exporter/blob/main/LICENSE">
    <img alt="License" src="https://badgen.net/github/license/heixxxa/xhs-web-exporter" />
  </a>
  <a href="https://github.com/heixxxa/xhs-web-exporter">
    <img alt="TypeScript" src="https://badgen.net/badge/icon/typescript?icon=typescript&label" />
  </a>
</p>

<p align="center">
  <a href="https://github.com/heixxxa/xhs-web-exporter/blob/main/README.md">English</a>
   | 简体中文
</p>

## 功能

- 🚚 导出首页和搜索结果中的笔记为 JSON/CSV/HTML
- 📝 导出笔记详情，包含更完整的正文和互动数据
- 💬 导出笔记评论
- 🖼️ 批量导出笔记和评论里的图片、视频
- 🔍 浏览页面时自动捕获数据
- 🚀 无需开发者账号或 API Key
- 💾 所有数据处理都在浏览器本地完成

## 安装

1. 安装浏览器扩展 [Tampermonkey](https://www.tampermonkey.net/) 或 [Violentmonkey](https://violentmonkey.github.io/)
2. 点击 [这里](https://github.com/heixxxa/xhs-web-exporter/releases/latest/download/xhs-web-exporter.user.js) 安装用户脚本

## 使用方法

安装脚本后，打开小红书网页版 `https://www.xiaohongshu.com/`。

页面左侧会出现一个浮动控制面板。点击 🐈 猫咪按钮可以折叠或重新打开面板。你也可以点击浏览器工具栏中的 Tampermonkey/Violentmonkey 图标，从脚本菜单中打开控制面板。

如果你看不到猫咪按钮，也看不到脚本菜单项，请先检查脚本是否已正确安装并启用。

![03-menu-commands](https://github.com/heixxxa/xhs-web-exporter/raw/main/docs/03-menu-commands.png)

脚本目前会在以下页面自动捕获数据：

- 首页流和搜索结果中的笔记卡片
- 笔记详情页
- 评论区和子评论

浮动面板中会显示各模块已经捕获的数据条数。点击对应模块右侧的箭头按钮，可以打开表格视图，预览并选择要导出的数据。

![01-user-interface](https://github.com/heixxxa/xhs-web-exporter/raw/main/docs/01-user-interface.png)

点击「导出数据」可以将所选内容导出为 JSON、CSV 或 HTML。点击「导出媒体」可以批量下载所选笔记或评论引用的图片和视频。

如需批量处理较多媒体文件，建议先复制 URL，再配合外部下载工具使用。

![02-export-media](https://github.com/heixxxa/xhs-web-exporter/raw/main/docs/02-export-media.png)

## 局限性

此脚本仅支持小红书网页版，不支持手机客户端。

脚本只能导出当前页面已经加载到浏览器里的数据。如果某些内容尚未出现在页面上，脚本也无法直接获取到它们。导出前请尽量滚动页面、展开评论，确保数据已经加载完成。

导出媒体时，文件会先在浏览器中处理再打包下载。如果一次选择了过多的大文件，浏览器可能出现卡顿甚至崩溃。

## 常见问题

**问：脚本是如何获取数据的？**  
答：脚本会拦截小红书网页端发起的 XHR / Fetch 请求响应，并在必要时从页面 DOM 中补充解析可见的笔记卡片数据。

**问：为什么抓不到任何数据？**  
答：先确认脚本已启用，并且你正在小红书网页版的支持页面中浏览。然后尝试刷新页面、滚动列表或打开笔记详情页，让页面实际发起数据请求。

**问：为什么导出的数据不完整？**  
答：通常是因为页面内容还没有完全加载。继续滚动页面、展开更多评论后再导出即可。

**问：需要申请开发者账号吗？**  
答：不需要。

**问：数据会上传到服务器吗？**  
答：不会。所有处理都在本地浏览器内完成。

**问：遇到问题去哪里反馈？**  
答：请到 [Issues](https://github.com/heixxxa/xhs-web-exporter/issues) 提交反馈。

## 开源许可

[MIT](LICENSE)

# 项目接手检查记录

> 后续处理：2026-09-05 已完成第一轮图片优化与交互修复，部署检查也有新发现，见 [本轮实施与验证记录](docs/performance/README.md)。下文保留初次检查时的状态。

检查日期：2026-09-05。范围：本地代码、现有依赖、构建产物、页面与交互抽查。未修改网站源代码、升级依赖或执行部署。

## 项目结构与运行

- Astro 6.3.7 + MDX + Tailwind CSS 4 + PhotoSwipe 5；静态输出，无后端或数据库。
- `src/pages/`：首页、Work、About、Contact 和项目动态路由。
- `src/content/projects/`：7 个 MDX 项目，字段由 `src/content.config.ts` 校验。
- `src/components/layout/BaseLayout.astro`：公共页面外壳及大部分客户端交互。
- `src/styles/global.css`：公共样式；`public/images/`：作品图片。
- `astro.config.mjs`：配置站点 URL 为 https://yuxiangwang.com，构建生成 sitemap。
- `npm run dev`：开发；`npm run build`：生成 `dist/`；`npm run preview`：预览构建产物。
- 当前 Node 24.16.0、npm 11.13.0，满足 package.json 的 Node >=22.12.0 要求。
- 本次受沙箱限制，首次启动遥测尝试写入用户 AppData 目录失败。使用进程环境变量 `ASTRO_TELEMETRY_DISABLED=1` 后构建和启动成功，不属于网站代码构建错误。

## 已完成验证

- `npm ls --depth=0`：声明的直接依赖均已安装。
- `npm run build`：成功生成 11 个页面及 sitemap。
- 本地开发服务器的 11 个页面全部 HTTP 200。
- 扫描全部生成 HTML 的根路径 href/src：发现 1 个不存在的本地图片引用，未发现其他本地路径缺失。
- 浏览器：首页进入项目详情成功；生产预览封面大图打开/关闭、正文图库打开、下一张计数由 1/20 变为 2/20 成功。
- 390px 宽度抽查 Contact 与 half-diary：未检测到页面横向溢出，Contact 视觉排版正常。
- 开发模式首次浏览曾出现 Vite 动态模块加载错误，交互未初始化；重新直接加载项目页后大图正常。尚未定位这一暂时性开发错误的根因。

## 已确认的问题

1. **缺失作品图片**：`src/content/projects/half-diary.mdx:161` 引用了 `/images/projects/half-diary/gallery-14.png`，文件不存在，浏览器也确认加载失败。需要找回对应原图或确认应引用的正确图片；不能自行猜测替换。
2. **图片体积与加载策略**：public 资源总计 387,720,989 字节（约 369.8 MiB），最大图片约 10.78 MiB。生成页面仍直接引用这些原图；7 个详情页均没有 `loading="lazy"`。按各页引用的本地图片去重统计，Gather Living 约 86.6 MiB，half-diary 约 83.6 MiB，首页三张作品图约 21.2 MiB，Work 封面合计约 37.2 MiB。这是文件体积统计，并非实测网络传输量或加载时间。后续宜生成展示尺寸的压缩图、设置正文懒加载和尺寸，并按需提供大图。
3. **社交链接未配置**：Contact 和 Footer 的小红书、Instagram、Behance 全部为 `#`，不能打开真实个人主页。
4. **内容仍有占位素材**：About 明确显示 `Studio / workspace — placeholder`；iterative-learning 和 grandmothers-hearth 的正文引用 Unsplash 图片，需确认是否已替换为真实作品材料。首页背景同样来自 Unsplash。

## 代码审查发现与后续验证项

- BaseLayout 两处滚轮缩放使用 `slide.currentResolution` 作为当前缩放值。安装的 PhotoSwipe 源码区分 `currentResolution` 与 `currZoomLevel`，内置滚轮处理使用后者。应改为正确缩放状态并验证初次滚轮、点击放大后滚轮和 Ctrl+滚轮；本次未完成滚轮手势复现，不将其计为已复现故障。
- Hero 的内联脚本绑定 scroll 监听，没有页面离开时的清理；需在多次往返首页时验证监听累积及视差重新初始化。公共布局的 IntersectionObserver 也未显式断开。
- 多数正文图片使用空 alt，图片点击入口缺少键盘操作支持；部分浅灰小字可读性需后续评估。
- Google Fonts 和 Unsplash 是外部运行依赖；本次未对不同网络地区的可达性进行测试。
- README 仍是 Astro 默认模板；未找到仓库内自动部署流水线或托管平台配置，无法从这些文件确认实际部署平台、线上版本、DNS 或 HTTPS 状态。
- 没有 check/test/lint 脚本，未安装 @astrojs/check 或 TypeScript，因此本次构建通过不代表完整类型检查通过。未进行全新 npm ci、依赖漏洞审计或全浏览器兼容测试。

## 工作区状态

开始检查时 `.claude/settings.local.json` 已有未提交修改，本次未改动。只新增这份检查记录；构建及启动更新了被 Git 忽略的 dist、.astro 和依赖缓存。

建议处理顺序：缺图与真实链接 → 图片优化 → 滚轮缩放及导航生命周期 → 接手文档和检查脚本 → 对照实际托管平台验证部署。

# 王誉翔 · AI 产品与空间实践

**完整本地合并版，已完成静态构建与本地浏览器检查。尚未发布、未改 DNS 或证书。**

以 AI 产品求职为主，建筑作品作为专业背景与能力证据。源码、依赖、输出与开发记录均位于本目录；原 AI 项目及建筑项目保持只读。

## 安装、开发、预览

Node.js >=22.12.0；本次使用24.16.0。依赖锁定在package-lock.json，不复制原站node_modules。

```powershell
Set-Location -LiteralPath 'E:\ai作品网站\unified-portfolio'
npm ci
npm run dev
```

开发地址：http://127.0.0.1:4321/ 。验证最终静态输出时，先停止同端口开发进程，再执行：

```powershell
Set-Location -LiteralPath 'E:\ai作品网站\unified-portfolio'
npm run build
npm run check:links
npm run preview
```

本次交付预览为 **http://127.0.0.1:4321/**。进程停止后用npm run preview重启。preview只读dist，改源码后必须重新构建；dev自动更新。CLI启动器禁用Astro遥测，避免向个人AppData写全局配置。运行时不需要账号、数据库或AI API key。

## 页面

- `/`：综合首页。
- `/ai/`：AI与数字产品投递入口。
- `/projects/knowledge-copilot/`、`/projects/gym/`、`/projects/spatial-portfolio/`：3篇完整案例。
- `/architecture/`：7个建筑项目总览。
- `/architecture/[slug]/`：continuation、gather-living、grandmothers-hearth、half-diary、hard-hat-cafe、iterative-learning、symsensory。
- `/about/`、`/resume/`、`/contact/`：背景、完整网页简历与联系。

共16个内容页，加8个旧/work/兼容页及404，共25个静态HTML输出。深层页面可直接访问和刷新。旧AI域名跳转尚未启用。

## 维护结构

```text
src/layouts/                 全站、AI与建筑布局
src/components/Gallery.astro 项目分组图库
src/components/ui/           响应式图片与3D入口
src/scripts/                 模型按需下载、Range、取消、释放
src/content/ai/              三篇完整Astro案例正文
src/content/architecture/    七篇建筑MDX
src/data/profile.ts          统一个人事实、经历、简历项目
src/data/ai-projects.ts      AI项目摘要及章节
public/                     公开素材、证据与下载
scripts/                    构建、检查及来源迁移工具
data/                      来源哈希与旧网址映射
docs/qa/                   浏览器截图和本地HTTP检查
docs/verification/         素材、模型与PDF检查
docs/source-snapshots/      153份来源文本快照（不随dist发布）
dist/                       构建输出，不纳入Git
```

Astro 6.3.7 + MDX 5.0.6 + Three.js 0.180.0。AI案例改为静态Astro，移除Next专有导入，未引入不必要的React运行时。Three.js体积分块提示来自按需加载的查看器，不进入首页加载链。

建筑页面用WebP派生尺寸，点击图库才读原图。两个模型为6.24/5.81 MiB。public总量约562.65 MiB（含高清原图），**不是首屏流量**。准确字节以data/source-inventory.json与docs/qa/static-checks.json为准。另保留7个旧AI公开素材地址兼容历史链接，不由首页加载。

## 检查

```powershell
npm run check:links
npm run check:assets
npm run test:models
```

链接检查包括本地文件、srcset、原图及跨页锚点；素材审计核对830个建筑资源；模型测试35项覆盖真实文件与故障恢复，不能等同用户研究或线上验收。

可选 `node scripts/serve-qa.mjs` 在127.0.0.1:4322启动本地故障服务器。docs/qa/network-mode.json的mode可设slow/fail/healthy；测试完成后停止，不用于部署。

## 事实与记录

到岗统一“2026.11 可到岗，可协商提前至 10 月”，无城市偏好。当前PDF：`/downloads/yuxiang-wang-resume.pdf`；原版：`/downloads/yuxiang-wang-resume-original-2026-10-02.pdf`。

米兰设计周奖项在新旧来源中有二/三等奖差异，当前网页与PDF注明待证书确认。缺少的评测、用户效果和合作分工不补写成事实。

-docs/qa/acceptance.md：实际验收与未验证项目。
-docs/site-plan.md、docs/migration-checklist.md：框架与实际状态。
-docs/architecture-migration.md、ai-migration.md、profile-migration.md：来源、口径及差异。
-data/migration-map.json：旧路径与片段映射。
-docs/deployment-and-rollback.md：预发布、Range/缓存/HTTPS、主域切换和回退。
-docs/deployment/*.example.json：未启用的EdgeOne配置样例。

**保存代码、构建、发布、线上验收是四个步骤。** 当前GitHub推送不会自动更新旧AI站。本次未购买服务或修改线上部署。发布前仍需实际EdgeOne环境和关闭VPN的手机移动网络验收。


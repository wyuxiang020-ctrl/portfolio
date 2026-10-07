# 发布与回退操作方案

状态：仅准备本地完整静态站与配置样例，**未发布到预览托管或线上，未改 DNS/证书/现有部署**。检查日期 2026-10-07。

## 1. 构建与保存代码是不同步骤

```powershell
Set-Location -LiteralPath 'E:\ai作品网站\unified-portfolio'
npm ci
npm run build
npm run check:links
npm run preview
```

构建输出为 `dist/`，纯静态 HTML/CSS/JS/素材。Node 要求 >=22.12；本次 Node 24.16.0。不得把整个项目、源码快照、npm 缓存或 node_modules 当作上传目录。

Git 提交/推送只保存代码。现有 AI 站的 GitHub 推送不会自动发布；新站需要单独配置 Git 集成或由明确的部署步骤上传 `dist/`。发布后还须核对线上版本与文件哈希，不能把推送或构建成功称为发布成功。

## 2. 预发布：优先评估现有 EdgeOne

使用独立的预览项目或平台预览地址，优先上传本地已构建的 `dist/`，不为这一步修改主域 DNS。若后续接Git构建，框架选Astro/静态，安装 `npm ci`，构建 `npm run build`，输出 `dist`。

**构建运行时差异已核对：** EdgeOne官方配置页仍列出22.11.0作为预装Node版本之一，而当前Astro需要>=22.12.0。不能直接沿用默认Node开始云构建。先使用本地Node24.16.0构建并上传纯静态产物；如希望云端自动构建，再核对该账户实际可用Node版本并通过一次完整构建。不为解决平台运行时差异擅自升级或降级当前源码。[EdgeOne构建配置](https://pages.edgeone.ai/document/edgeone-json)

官方限额页当前列出单文件上限 25 MB；本项目的模型和单张原图要以 `docs/qa/static-checks.json`、资源清单及平台实际上传结果复核。总素材约数百 MiB，需额外确认当前账户的项目总容量、文件数与上传方式限制，不能仅由单文件上限推断可部署。[EdgeOne 官方限额](https://pages.edgeone.ai/document/limits-and-quotas)

静态路由配置参考 `docs/deployment/edgeone-main.example.json`。**示例不是已启用的托管配置**；复制为根目录 `edgeone.json` 前先确认所用 EdgeOne 产品/账户配置格式，先以 302 临时跳转验收，再切 301。不要加入将所有未知路径重写至首页的 SPA fallback，深层页面已有独立 HTML。[EdgeOne 配置文档](https://pages.edgeone.ai/document/edgeone-json)

`/work/` 及七条 `/work/[slug]/` 在本地提供静态 HTML 跳转兼容页，保留查询参数与锚点。静态 HTML 的跳转不是 HTTP 301；线上永久状态码由托管规则负责。[Astro 静态路由说明](https://v6.docs.astro.build/en/guides/routing/)

## 3. 根域切换前必须验证

1. 在预览地址逐页检查本次 16 个内容页面、404、7 个旧建筑详情与列表跳转。
2. 用浏览器真实加载两个模型，关闭再打开；检查取消、失败重试、渲染清晰度和图层操作。首页 Network 不应请求 `.glb`，普通详情在点击加载前也不能请求模型。
3. 请求模型 Range，必须验证内容而非只看状态码：

```powershell
$previewOrigin = 'https://替换为已创建的预览域名'
curl.exe -sS -D docs/qa/preview-range.headers -o docs/qa/preview-range.bin -H 'Range: bytes=0-31' "$previewOrigin/models/itb.glb"
curl.exe -sS -I "$previewOrigin/models/itb.glb"
curl.exe -sS -I "$previewOrigin/models/shekua-lite.glb"
```

核对 206、`Content-Range: bytes 0-31/完整长度`、实际响应 32 字节以及 `glTF` 文件头；不能返回 HTML 错误页。配置 `model/gltf-binary` MIME。若平台忽略 Range，下载器应安全回退完整下载，仍需测试取消及断线重试，不能声称已通过分段验证。

4. HTML 采用重新验证缓存；带哈希 `/_astro/` 静态资源可长期缓存；模型名称未带版本哈希，用短缓存/重新验证，替换模型时同时刷新 CDN。缓存策略参考 [EdgeOne 缓存文档](https://edgeone.ai/document/180002216702672896)。
5. 核验 HTTPS 完整证书链、混合内容、原图与两版 PDF；禁止绕过 TLS 报错。
6. 关闭 VPN，用真实手机与移动网络检查首页、知识助手、图库、两个模型与 PDF。记录日期、设备、系统、网络及失败项。本地模拟窄视口不能替代这一项。

## 4. 迁移域名与旧链接

主域规划 `https://yuxiangworks.com/`。Vercel 可继续管理域名与 DNS，托管可以在 EdgeOne；两者不是同一动作。不需要新买域名。

所有已知旧入口在 `data/migration-map.json` 中逐条列出。原 AI 根地址只跳 `/ai/`，AI 案例、简历及公开文件逐页跳到主域对应路径；原建筑 `/work/` 跳到 `/architecture/`，每个详情保留 slug。AI 子域的规则必须放在旧 AI 域名服务，**不能**放在主域后形成循环。示例见 `docs/deployment/edgeone-ai-legacy.example.json`。

锚点不会发送给 HTTP 服务器：新案例保留原章节 id；已知旧首页 `#projects` 等在 `/ai/` 保留兼容锚点。查询参数应由平台跳转机制保留并实测。旧公开文件保留路径；未引用素材不要仅为规避404盲目公开，先按访问日志核对。

## 5. 上线前记录、切换、观察

- 保存现有 DNS 记录（记录名、类型、目标、TTL）、两端托管项目和成功部署 ID、现有证书绑定与回退版本。不要将凭据提交仓库。
- 先完成预发布验收、绑定主域与 AI 子域有效证书，再进行获授权的 DNS 切换；本轮未授权实际切换。
- 切换后核对 canonical/sitemap、16 页内容、旧网址跳转、PDF 与文件哈希；观察缓存传播，并确认浏览器看到的是本次构建。
- 保留旧站托管与原仓库，直至新站稳定通过观察期。将每次保存代码、构建、发布、线上验收分别记录。

## 6. 回退

1. 内容/交互故障：优先切回上一个已验收的静态部署，清理受影响 CDN 缓存。
2. 域名/证书/平台故障：按已保存的 DNS 记录恢复原解析与托管绑定；等待 TTL 生效，分别核验 HTTPS 和业务内容。
3. 若旧 AI 子域已有永久跳转，回退时撤销规则并重新验证；浏览器缓存的 301 可能需要观察，因此预发布阶段用 302。
4. 原 AI 与建筑目录保持原样，不用新站文件覆盖原源码；本地来源快照及 SHA-256 清单仅作为追溯资料，不能替代托管部署备份。

待补：实际 EdgeOne 配额/上传/Range/缓存/HTTPS、国内手机网络验收、DNS 基线与回退部署 ID。这些是发布前门槛，当前没有冒充线上验收完成。

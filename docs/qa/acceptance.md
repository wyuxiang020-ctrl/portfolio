# 本地验收记录

2026-10-07，Windows，Node 24.16.0，Astro 6.3.7。正式预览 `http://127.0.0.1:4321/`，故障注入服务器 `http://127.0.0.1:4322/`。真实 Chromium/Codex 内置浏览器；视口 1440×1000、970×871 与 390×844。390px 是桌面浏览器窄视口，不能称为真实手机设备测试。

## 构建与资源

25个静态输出页：16个正式内容页、8个旧路径兼容页、404。构建成功；链接和跨页片段以 `static-checks.json` 为最终结果。Three.js有体积警告，但动态 import 只在点击模型时请求。

830个建筑资源哈希与引用核验、35个模型故障测试通过，详情在 `../verification/`。两个GLB无需外部贴图。原图保持原尺寸，派生WebP用于页面展示。

## 浏览器交互

| 检查 | 观察结果 |
| --- | --- |
| 首页项目卡 | 单击进入完整知识助手页 |
| 深层页刷新 | 迭代学习直接进入interactive-model并刷新正常，模型回到待加载 |
| 知识助手图库 | 5张，打开1/5；滚轮切2/5；End到5/5显示“后面没有其他图片了” |
| 居中完整显示 | 1440×1000视口中截图1265×712，边界x80/y130.5，未裁切或偏左上角 |
| 关闭与恢复 | Esc、关闭按钮、再次点图通过；前后scrollTop均761.3333，焦点回原图片 |
| 手机图库 | 新五感设计独立21张，按钮到2/21，图片完整，关闭后焦点恢复 |
| 手机菜单 | 展开aria-expanded=true，AI链接正确；Enter打开、Esc关闭且焦点回菜单按钮；页面无横向溢出 |
| ITB模型 | 实际渲染1个canvas；切换清晰/俯视；关闭为0，重开为1 |
| 火塘模型 | 轻量模型实际加载，390px无横向溢出，关闭可用 |
| 延迟/取消 | QA服务器12秒延迟，加载中可取消；closed，0个canvas，仍可阅读 |
| 503/重试 | 注入503显示重新加载；恢复服务并点击后ready，1个canvas |
| 首页模型请求 | QA日志访问首页前后均3条，无新增GLB；3条为慢速/503/成功测试 |
| 浏览器后退 | 模型已加载后进入建筑列表再后退，显示待加载入口；重新打开ready、1个canvas |
| 旧路径兼容 | /work/iterative-learning/?from=legacy#interactive-model 实际到达新详情，query与hash均保留 |
| 控制台 | 正常浏览和两模型无error/warn；故障注入有预期Model HTTP 503 |

`browser-mobile-pages.json` 与 `browser-desktop-pages.json` 保存批量页面检查，未见已加载图片损坏或水平溢出。全部图片引用存在性由静态检查补充；不是每张高清图纸的视觉重审。

## PDF与HTTP

当前PDF HTTP 200，`application/pdf`，262,770字节；下载SHA-256与public相同：`2752b134ec1f0f8fe57a2aebad5909d2abb56c37b968e40d2aab29cad7a0b374`。原版独立保留。当前2页PDF用Poppler渲染，截图在 `../verification/resume-pdf-page-1.png` 与 `-2.png`。

实际点击简历链接抵达PDF地址，但Codex内置浏览器未显示PDF阅读器（灰色空白）；因此确认链接、HTTP文件和离线渲染，**未确认该浏览器内嵌PDF阅读体验**。

本地ITB Range返回206，`Content-Range: bytes 0-31/6539052`，32字节，MIME `model/gltf-binary`。这是本地Astro预览结果，不能移用到EdgeOne或线上CDN。

## 截图

- `home-desktop.jpg`、`home-mobile.jpg`：最终首页。
- `ai-mobile.jpg`、`knowledge-mobile.jpg`、`resume-mobile.jpg`：修复后手机布局。
- `gallery-desktop.jpg`、`gallery-mobile.jpg`：完整图片、计数与切换。
- `model-itb-desktop.jpg`、`model-hearth-mobile.jpg`：两模型实际渲染。
- `model-retry-mobile.jpg`：故障恢复后的实际画布。

## 尚未验证

真实手机手势、其他浏览器PDF阅读器、操作系统减少动态效果设置、国内移动网络、实际托管Range/缓存/HTTPS、跨域301及DNS切换。未表述为已通过。

内容补证：奖项证书、部分建筑调查样本/合作细分、知识助手完整合成Demo评测、健身真实使用效果与部分食评原始分母。案例已保留边界，未补写商业效果或用户反馈。

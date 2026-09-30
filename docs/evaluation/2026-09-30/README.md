# 本轮有界完善与证据索引

日期 2026-09-30，演示标识 `spatial-ux-2026-09-30-r1`。范围：两个已有 3D 查看器的加载退出与重开、控制文案、可导出的本地测量记录、读者任务。未增加聊天/自然语言控制，未重新压缩或删减几何，未改作者署名。

## 原公开版本

- 正式入口 https://yuxiangworks.com/ ，项目 `/work/iterative-learning/#interactive-model` 和 `/work/grandmothers-hearth/#interactive-model`。
- Git `945b60d44279efb716ccbc4245240518bb3acb19`；Vercel `dpl_6JpdMQq7m5xr6LhGPorTYGmEKiax`，production READY；对应 `portfolio-gt4e0nmri-yuxiang-wang-s-projects.vercel.app`，自定义域名已绑定。
- 与 9 月 6—7 日历史报告区分：当时部分内容尚未部署、模型测速在本地/代理环境；9 月 14 日已有自定义域名。旧数据不作为本轮国内直连或真机结论。

## 本轮发现与修改

旧版加载按钮被禁用，退出入口只有成功后才出现。工程走查发现缺少取消路径；当前匿名下载审计又出现两个模型 60 秒未下载完成，说明需要容纳长等待，但不能断言所有访客都遇到。

第一轮实现：增加加载中取消，给恢复和图层更明确的文案；第二轮工程检查：处理取消后立即重开时旧请求失败返回的竞争，防止覆盖新请求状态。此处的两轮是工程迭代，不是两轮用户测试。解析任务在后台完成前不保证 CPU 立即停止，但取消会释放当前查看器、允许阅读/重试，迟到模型被释放。

保持按需下载；正文图纸和图片作为已有阅读路径。两模型 SHA256 未变：ITB `a54678b707aef0d8798d1f4837e39600a773bcc8bc37134c00b5c20d16b8ea5e`；火塘 `21ab5b2a859f61ad308ec7df9f40c971fa47f3ca23aec36e4536415d0425b74a`。不以文件体积推断体验改善。是否制作轻量模型，要等真机下载/解析/操作数据分开后决定。

## 已有证据与限制

- `public-before.json`：641 次匿名 curl GET，包含 11 页面、HTML 中图片 src/srcset、脚本/样式、2 个 GLB、www 入口。638 次完整 HTTP 200；3 次 60 秒超时：外部 Unsplash 图片，ITB 下载 1,754,845/6,539,052 字节，火塘 1,867,747/23,820,388 字节。HTTP 200 不等于完整成功。部分数据的 hash 不匹配源于未下载完成，不能据此断言文件损坏。审计为单次请求、最多六并发，不是访客成功率。
- 当前主机 Windows ProxyEnable=0，curl 显式绕过代理，但 VPN/隧道与真实路由未确认；不能写“大陆无 VPN 已通过”。没有浏览器登录 Cookie。srcset 被检查；动态浏览器才请求的资源、Google Fonts CSS 内所有字体变体未穷尽，不能写“全部外部资源已通过”。
- `model-retries.json`：同环境模型逐个复测，保留首次失败，不覆盖旧记录。
- `lifecycle-tests.json`：6 项 Node 控制器回归通过，加载器为模拟对象；验证取消、竞争状态、失败、换页清理与重复初始化，不验证 WebGL/触屏/视觉。
- Astro 构建成功，11 页。大 3D 依赖分块警告仍在；依赖只在打开模型时导入，不把警告消失作为性能目标。
- 浏览器工具绑定页面多次超时，另一个浏览器不可用。故本轮尚未测得可见首帧、首次真实交互、持续操作或关闭重开的浏览器时间。手机真机样本 n=0、真实读者 n=0；验收未完成。

## 交付与后续门槛

`TASKS.md` 为主持脚本与设备验收步骤；`readers.csv` 为未填造数据的记录表；`CASE.md` 为可同步作品集的保守草稿。测试链接加 `?modelTest=1#interactive-model`，页面内下载 JSON；刷新/离页前保存。数据不自动上传，测量口径见脚本。

本地演示为 http://127.0.0.1:4322/work/iterative-learning/?modelTest=1#interactive-model 和 http://127.0.0.1:4322/work/grandmothers-hearth/?modelTest=1#interactive-model 。需本地预览进程运行，不能当永久公网地址。部署后的准确版本另见 `release.json`，没有该文件时不视为已部署。

真机/读者完成后才判断空间理解是否改善，优先解决读者暴露的镜头、图层语义或触屏滚动问题。建筑原作联合署名 Yuxiang Wang · Han Liu，个人设计分工待确认；本轮网站产品工作与原设计成果分开归属。

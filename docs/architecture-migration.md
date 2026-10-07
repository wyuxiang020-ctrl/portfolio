# 建筑栏目迁移记录

记录日期：2026-10-07。来源为 `E:\cd portfolio` 的当前本地文件，原项目只读；核对的源仓库 HEAD 为 `bcf1ebe3375034f7b991c3aa519989e2e6d18bb3`，未以远端版本替代本地资料。适用范围内未检索到额外 `AGENTS.md`。

## 已迁移内容

7 篇完整 MDX、全部实际引用图纸与图片、2 个实际使用的 GLB、按需查看器和下载恢复模块。新路径均为 `/architecture/<slug>/`，旧路径为 `/work/<slug>/`。

| slug | 保留名称 | 内容与合作边界 |
| --- | --- | --- |
| continuation | 延续与重构 | 课程设计；人群比例缺样本与统计方法，明确列为设计分析假设 |
| symsensory | 新五感设计 | 参数化建筑提案；未表述为真实人流实验或落成后验证 |
| iterative-learning | 迭代学习 | 保留王誉翔、刘涵合作署名，前期研究和2026成果图纸，ITB模型 |
| grandmothers-hearth | 祖母的火塘 | 保留走访、设计、构造、实体模型、生活情景推演与合作署名，轻量模型 |
| half-diary | ½ 日记——大院时光 | 三人毕业设计中的篇章一；保留本人负责地块与其余篇章分工边界 |
| hard-hat-cafe | 暂驻之间｜临时咖啡馆 | 保留12人团队、In-Situ合作；原“落地呈现”调整为“方案中的社区场景” |
| gather-living | 「20+」青年集合住宅 | 青年模块居住课程提案；不作为真实居住体验或经济性验证 |

主标题与章节将中文提升为阅读层级，保留英文作为辅助。原有英语章节锚点继续可用。没有添加虚构的个人独立贡献；合作项目当前未提供更细分的个人图纸归属。

## 素材来源与体积

逐文件的原始路径、目标路径、字节数、SHA-256、图片尺寸及被哪些项目引用，见 `data/architecture-assets.json`。响应式索引见 `src/data/architecture-images.json`。

- 210 张被正文、封面或主视觉实际引用的原图，共 463.19 MiB。
- 618 个唯一对应的 480 / 960 / 1600 像素以内 WebP 派生文件，共 65.88 MiB（保留源已有派生结果，不重新生成或伪造项目图像）。
- 2 个模型共 12.05 MiB：`itb.glb` 6,539,052 字节，`shekua-lite.glb` 6,091,728 字节。
- 本栏目 public 总量约 541.11 MiB。正文与列表使用响应式派生图和原图尺寸占位，高清原图只在图库打开对应图片时请求；模型只在用户打开时请求。此体积不是首屏流量。
- 未迁移没有被本轮页面使用的 23,820,388 字节 `shekua.glb`、其他无引用资源、`.git`、`.env`、账号设置、源 `node_modules` 或源 `dist`。

源 public 中多数资源确由这 7 篇完整项目引用，因此选择性复制后的总体积仍接近源总量。发布平台若对包体积有限制，可在后续独立素材托管方案中处理；不能在没有逐页映射的前提下删除高清图纸。

`scripts/migrate-architecture.mjs` 为本次一次性导入脚本。检测到导入记录后会拒绝覆盖，防止重跑擦除已审阅的内容与查看器修复。日常开发、安装、构建无需运行该脚本。

## 共享组件接入

- `getCollection('architecture')` 提供7篇内容。
- `src/data/architecture-projects.ts` 提供中文简称、精选图与角色边界。
- `OptimizedImage.astro` 保留原图的 `data-full-src` 和尺寸供全站图库使用；列表卡传 `gallery={false}`，确保单击进入完整详情。
- 每个项目用唯一 `data-gallery-group` 包裹。详情主视觉与正文纳入同一个项目组，不单独打开窗口。
- 统一 `BaseLayout.astro`，建筑自身阅读样式只在 `ArchitectureLayout.astro`，未引入旧站 Tailwind 全局样式或 PhotoSwipe。

## 3D 生命周期与质量

保留源 Three.js / Meshopt 按需导入、首次点击并行下载模块与模型、下载取消、失败重试、总览/俯视/侧面/正面、图层显隐、全部恢复、键盘操作、关闭后重新打开和 GPU 资源释放。火塘轻量模型保留 Range 下载、字节长度/GLB头/SHA-256验证以及不支持 Range 时回退完整下载。

新增“渲染清晰度”流畅/清晰两档，明确只改变画面分辨率，不宣称增加模型几何细节；关闭重开保留本页选择。页面 `pagehide` 同样释放资源，浏览器前进/后退缓存恢复时用 `pageshow` 重新绑定。组件脚本直接调用 `setup()`，普通整页导航无需 Astro View Transitions。未主动预取模型。

移入3组源软件集成测试，改用本轮实际迁入的轻量模型和新的结果目录：

```powershell
node scripts/test-model-download.mjs
node scripts/test-model-range-download.mjs docs/verification/models
node scripts/test-model-preparation.mjs
```

这些测试通过本地 HTTP 传送真实 GLB 字节，注入失败、超时、中断等条件；不等同于浏览器/GPU、移动设备或线上网络验收。结果保存于 `docs/verification/models/`。

2026-10-07 本轮结果：download 9/9、Range 22/22、preparation 4/4，共 35 个软件用例全部通过。覆盖真实字节完整性、503、空闲/总超时、传输不完整、取消、失败后重试、乱序分段、200/压缩/ETag不满足条件时回退、错误 Range/总长度/hash 拒绝、取消后立即重开互不干扰。

`node scripts/check-architecture-assets.mjs` 同日通过：830 个实际 public 文件的 SHA-256 与来源一致，2 个模型没有未解析的外部资源；7 篇内容包含199个可解析的正文图片引用、166条图注，显式章节锚点有效、图片替代文本非空。报告为 `docs/verification/architecture-assets.json`。

## 待补证据与验收边界

1. `continuation` 人群比例、`half-diary` 问卷比例缺样本与原始统计；已在项目对应位置明示。
2. 咖啡馆人口图的 52% 缺统计年份、地理边界与出处；保留原图同时说明待核实。无已建成和运营证据，图像标为提案渲染。
3. 合作项目尚无逐图个人贡献分工表。
4. 浏览器、模型渲染、图库、深链接及移动视口检查将汇总到本地验收记录。云端 Range / 206、缓存、MIME、HTTPS 与关闭 VPN 的移动网络检查尚未执行，不以本地构建代替线上验收。

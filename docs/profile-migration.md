# 个人资料、简历与联系迁移

检查日期：2026-10-07。仅在 `E:\ai作品网站\unified-portfolio` 新建文件，未修改两个来源项目。

## 来源与责任

| 来源 | 用途 |
| --- | --- |
| `E:\ai作品网站\portfolio\app\resume\page.tsx` | 完整教育、实习、三个项目的简历内容、技能、荣誉；页面明确注明依据本人 2026.10.02《AI 产品方向 · 简历更新版》 |
| `E:\ai作品网站\portfolio\app\page.tsx` | AI 求职定位、联系方式、GitHub 个人地址与到岗口径 |
| `E:\ai作品网站\portfolio\public\downloads\yuxiang-wang-resume.pdf` | 原版 1 页 PDF，完整复制保存，未编辑原文件 |
| `E:\cd portfolio\src\pages\about.astro` | 建筑背景、原个人叙述、专业院校称呼、展览、实习责任 |
| `E:\cd portfolio\src\pages\contact.astro` | 邮箱、电话和小红书账号；旧站 Instagram / Behance 的 `#` 占位链接不迁入 |
| `E:\cd portfolio\public\images\yuxiang-portrait.jpg` | 真实个人肖像，仅复制此引用素材，未生成新肖像 |

已检查来源根目录及新项目适用的 AGENTS.md，未发现额外文件。所有新内容采用 `src/data/profile.ts` 作为统一事实数据；首页、关于、联系、网页简历和 PDF 构建器可复用。关于页保留专业背景，新增 AI 产品职责的描述直接来自旧 AI 首页和简历。

## 已完成页面与下载

- `/about/`：个人定位、真实肖像、专业背景、三个个人产品实践的责任、教育、实习、两个展览项目。
- `/contact/`：有效 `mailto:`、`tel:`、GitHub 和原小红书搜索账号；无虚构社交地址。
- `/resume/`：完整网页版简历，保留原简历全部教育、实习、三个项目的职责与评测、技能和荣誉。包含锚点索引、网页打印、当前与原版 PDF 入口。
- `/downloads/yuxiang-wang-resume.pdf`：当前统一主域版本，2 页 A4；与网页共用数据生成。
- `/downloads/yuxiang-wang-resume-original-2026-10-02.pdf`：源站原版 1 页 PDF，不改动原始内容。

## 已发现差异及采用依据

1. **到岗和城市**：原 PDF、2026.10.02 AI 网页简历均为“2026.11 可到岗，可协商提前至 10 月”，没有工作城市偏好。此口径原样保留，不把当前日期当作已毕业证明。
2. **米兰设计周等级**：AI 更新简历与原 PDF 均写二等奖，建筑关于页写“第八届米兰设计周高校设计竞赛，三等奖”。因 AI 简历明确标注 2026.10.02 更新，当前版沿用该写法，但在网页及 PDF 紧随奖项注明旧站冲突和“等级待证书核对”。现有资料不足以判定是否同一届或同一奖项，未自行消除冲突。
3. **教育机构称呼**：AI 简历为“曼彻斯特大学”，建筑页为“曼彻斯特建筑学院 / Manchester School of Architecture”。统一数据保留两个来源称呼，显示“曼彻斯特大学 / 曼彻斯特建筑学院”；不新增颁发学位关系等未证实事实。“预计 Distinction”保持预计状态。
4. **网站地址**：原 PDF 保留 `https://ai.yuxiangworks.com/`；当前 PDF 与网页采用规划统一主域 `https://yuxiangworks.com/`，三个案例链接为目标路径。它们本轮仅在本地验证，尚未以此声称统一主域已发布。
5. **原建筑站成果**：简历“11 个页面、两个真实模型、2026 年 9 月生产发布”明确指向原建筑站；合并版另做本地验收，不新增商业成果、用户研究或线上完成声明。
6. **评测边界**：保留 16 题基线、8 个已知答案问题 Hit@1 为 7/8、跨项目 11 项检查有效证据为 6/11、同组 20 条合成用例及其中 8 个边界处理样本。离线结果不写作真人验证。

## PDF 核验

使用 PDF 技能，先提取原版全部文字，再使用 Poppler 渲染原版 1 页和当前版 2 页逐页检查。当前版为 ReportLab 生成、嵌入微软雅黑字体的 PDF。未出现裁切、文本重叠或缺字；当前版在两页末尾保留页码。

- 当前 PDF：2 页、262,770 字节（生成于 2026-10-07；后续如更改数据请重新生成并核验）。
- 核对通过：完整到岗口径、统一主域、奖项待证书注记、7/8 与 6/11 分母、20 条合成样本说明、至少 5 个可点击注释链接。
- 视觉证据：`docs/verification/resume-pdf-page-1.png`、`docs/verification/resume-pdf-page-2.png`。
- 原版与来源文件 SHA-256 相同；复制肖像与来源 SHA-256 相同。
- 原 PDF 提取时 pypdf 对其原有 CMap 报非致命告警，Poppler 可以正常渲染；未修改其内部结构。

当前 PDF 从统一数据重建：

```powershell
cd E:\ai作品网站\unified-portfolio
node scripts/export-profile.mjs
# 使用安装了 reportlab 的 Python，Windows 下默认读取系统微软雅黑字体
python scripts/build-resume-pdf.py
pdftoppm -scale-to 1600 -png public/downloads/yuxiang-wang-resume.pdf tmp/pdfs/resume-current
```

此 PDF 辅助工作流独立于站点构建，日常 `npm run build` 不需要 Python。换平台时需为生成器提供相应 CJK TrueType 字体，保留已生成 PDF 即可正常建站。

## 尚待补证与验收边界

- 米兰设计周证书或明确届次，用于确认二等奖 / 三等奖差异。
- 教育称呼与学位证件的正式写法，以及预计成绩在毕业后的更新。
- 未进行邮箱投递、拨号、小红书登录验证；这些动作不属于本轮本地迁移。
- 页面浏览器验收与构建结果在主迁移验收记录中汇总；PDF 原版和当前版的视觉核验已完成。

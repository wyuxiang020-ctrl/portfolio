# Gym 案例重写与项目阅读优化

发布版本：2026-10-10.3

## 页面与组件

- `src/content/ai/gym.astro`：按用户原文排成七个区块、四个产品模块与六行反馈，保持 `/projects/gym/`。
- `src/styles/gym-case.css`（新增）：沿用现有 Astro 与普通 CSS 方案，正文 16px / 1.75；375px 下表格转为逐条阅读。
- `src/components/gym/GymImage.astro`（新增组件）：构建时检查六个约定 PNG，缺图时显示文件名占位；有图时读取真实尺寸，设置 alt、懒加载与图库入口。
- `public/images/gym/README.txt`（新增）：待提供图片清单与替换说明。
- `src/pages/projects/gym/index.astro`：更新页面标题。
- `src/data/ai-projects.ts`：同步 Gym 章节锚点。

## 其它项目正文与图片

- `src/styles/knowledge-case.css`：知识助手正文缩小一档。
- `src/styles/cases.css`：通用产品案例正文缩小一档，保留说明与小字下限。
- `src/layouts/ArchitectureLayout.astro`：建筑项目正文缩小一档。
- `src/pages/projects/slowtrail/index.astro`：旅行项目正文缩小一档。
- `src/components/fangkuai/CaseImage.astro`、`src/content/ai/knowledge-copilot.astro`：移除原图文字链接，保留图片说明与点击放大。
- `public/images/fangkuai/*.png`：20 张资源逐张无损压缩，尺寸与 RGBA 像素核对一致；每张超过 1 MiB。详情见 `image-compression.json`。
- `public/images/fangkuai/manifest.json`：更新实际字节数。
- `public/release.json`：更新线上版本标记。
- `docs/qa/static-checks.json`：更新全站链接检查结果。

## 用户文件

`portfolio.pdf` 与 `prd.pdf` 已核对，分别为 6 页与 4 页，与站内对应下载文件逐字节一致，因此未产生 PDF 内容差异。

## 待提供

放入 `public/images/gym/`，重新构建并部署即可替换占位：

- gym-hero.png
- gym-scanner.png
- gym-training.png
- gym-diet.png
- gym-panda-design.png
- gym-panda-rest.png

## 验证

- Astro 构建：27 个页面通过。
- 本地链接：30 页、零失败。
- Gym 375px：正文 16px、行高 28px、无横向溢出，6 处占位与 6 条反馈。
- 桌面：无横向溢出；其它项目实际正文计算字号已核对。
- 知识助手：无“原图”链接，点击封面能正常打开图片浏览。
- 本次压缩不改变分辨率与像素；体积变化不等于网络耗时实测。

截图与结构检查见同目录。

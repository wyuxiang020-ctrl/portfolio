# 王誉翔 · AI 产品作品集

AI 求职作品集：建筑项目知识助手、AI 健身与饮食记录、建筑作品与交互式 3D，以及网页版简历。

## 本地构建

使用 Node.js 22.13 以上版本：

```sh
npm ci
npm run typecheck
npm run build:portable
```

静态发布目录为 `portable-dist/`，包含首页、三个项目页、简历页、图片和 PDF。可使用任意静态 HTTP 服务预览该目录。预览完整简历时访问 `/resume/`。

## 发布

当前公开域名为 https://ai.yuxiangworks.com/ ，对应腾讯云 EdgeOne 项目 `yuxiang-ai-portfolio`。目前使用上传静态文件包发布，尚未建立 GitHub 自动发布连接。推送此仓库本身不会更新该域名。

GitHub Actions 会检查类型、构建静态站点并生成 `portfolio-static-site` 文件包。将文件包内的站点文件上传至原腾讯云项目即可更新；发布根目录须直接包含 `index.html`，不要再套一层 `portable-dist` 文件夹。

2026-10-03：本次同步包含整站新版排版、两个案例页重排、新版网页简历、原版 PDF 入口与原生简历跳转。上线及 HTTPS 证书状态须在发布后另行核验。

## 内容与目录

- `app/`：网页内容、案例、交互组件和样式。
- `public/media/`：原始截图、示意图及合成餐食测试素材。
- `public/evidence/`：项目已有评测记录及证据节选。
- `public/downloads/`：用户提供的简历 PDF。
- `portable/`：独立静态构建入口，供腾讯云等静态托管使用。

项目案例保留证据范围说明。合成评测、工程验收与真实用户验证分别表述。该仓库独立于建筑作品集 `wyuxiang020-ctrl/portfolio`。

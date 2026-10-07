# 祖母的火塘：SketchUp 模型网页整合

日期：2026-09-06。本轮仅更新本地网站，未推送或部署。

## 文件与结果

- 原始模型：`C:/Users/WangYuxiang/Desktop/shekua 网站模型.skb`，308,684,623 字节，约 294.4 MiB。全程只读，没有覆盖或另存原文件。
- 网页模型：`public/models/shekua.glb`，23,820,388 字节，约 22.7 MiB；相比原文件减少约 92.3%。此差异同时来自选取展示范围、组件复用、纹理压缩与几何压缩，不能单独称为纯压缩收益。
- 页面：`src/content/projects/grandmothers-hearth.mdx`，新增最后一章 `Interactive Model`，并加入章节导航。
- 预览：<http://127.0.0.1:4322/work/grandmothers-hearth/#interactive-model>。
- 共享查看器：`src/components/ui/ITBViewer.astro` 与 `src/scripts/itb-viewer.ts`。新增可配置的模型地址、名称、文件体积、聚焦范围和说明；原 ITB 调用保留默认参数。

## 模型范围与几何处理

通过本机已安装、签名有效的 Trimble SketchUp 2025 C API 读取 SKB 成功，加载状态为 0，无需用户重命名或重新上传。

第一次完整转换包含周边多组重复、拆解和迭代模型，浏览器总览中建筑过小。随后根据实景预览与顶层对象范围，选取中央完整院落、农田、相邻道路和周边场地。外围研究模型只在网页副本中排除，源文件完整保留。源对象索引、筛选范围、独立场地三角形取舍和坐标偏移均记录在 `model-transform-audit.json`。

- 全量可见工作模型约 8,236,913 三角面；最终展示模型 1,863,067 三角面。
- 展示范围内没有进行几何减面；采用网格去重、实例复用、合并和 meshopt 压缩/量化。
- 最终有 588 个带网格节点、5,186 个实例计数、710 个图元、319 个材质与 248 张纹理。
- 将英寸单位、Z 向上坐标转换为米和 Y 向上坐标，并居中。
- SketchUp 的齐次缩放与倾斜变换不能直接交给 glTF 的平移/旋转/缩放分解。先归一化齐次坐标，再用 QR 分解将残余倾斜烘焙进网格和法线，保持可复用的几何。
- 场地与建筑分为两个展示组：“场地与道路”“建筑与院落”。这是网页展示分组，不是原始 84 个标签的完整复刻，也不是改造前/后的状态分类。
- 基础色贴图最长边 768 px，WebP quality 82，透明纹理保留透明通道。

原模型中的辅助色和基础材质沿用；网页不是效果图渲染器。渲染引擎的灯光、复杂 PBR 材质不复刻；隐藏实体、辅助线、标注与剖切平面的裁切效果不导出。正反面采用正面优先的双面材质，背面单独着色的复杂情况不完全复刻。22.7 MiB 仍属于较大的交互资产，因此维持点击后加载。

## 页面实际功能

点击加载；拖动旋转、滚轮缩放、右键平移；键盘方向键平移、加减键缩放；总览、俯视、正面、侧面与完整场地视角；分组显示；重置；关闭并释放画布及 GPU 资源。

初始镜头聚焦院落，“完整场地”再拉远到道路和背景。相机远裁剪面按模型尺度配置，避免较大场地被裁切。沿用既有加载进度、超时/失败提示与重试、导航清理和触屏手势支持。

## 本轮真实测试

| 用例 | 结果 |
| --- | --- |
| 生产构建 | 通过，11 个静态页面；既有 Three.js 分块体积提示仍存在 |
| glTF 文件检查 | 压缩文件 0 errors、0 warnings；解码并展开实例后二次验证同样 0 errors、0 warnings。另有非阻断的扩展/纹理尺寸 information 提示 |
| 桌面加载最终文件 | ready；下载阶段 117 ms，首次画面提交 1,313 ms，23,820,388 字节 |
| 桌面实际绘制 | 初始总览 725 次绘制，1,868,019 个三角面提交；含透明材质额外绘制，与文件三角面统计口径不同 |
| 预设与旋转 | 俯视按钮改变相机位置；重置后实际拖动再次改变相机，目标点保持不变 |
| 滚轮缩放 | 俯视测试中相机到目标的距离从约 78.2 m 降到约 62.1 m |
| 分组隐藏 | 取消“场地与道路”后复选框为 false，绘制次数从 725 降为 675 |
| 重置与关闭 | 重置恢复分组；关闭后 state=closed，模型画布数量为 0 |
| 窄屏重新加载 | 390 × 844 视口下 ready；下载阶段 190 ms，首次画面提交 1,576 ms；页面内容宽/滚动宽均为 375 px，无横向溢出 |
| 窄屏布局 | 画布约 325 × 360 px，按钮换行，分组可操作；截图检查通过 |
| 键盘平移 | ArrowRight 后目标点从 [-10.9, 5, 1.5] 变为约 [-9.96, 5, 2.36] |
| 完整场地 | 相机切换到全场地中心并拉远，通过 |
| 控制台 | 最终模型测试标签页未读到 error 日志 |
| ITB 回归 | 原 ITB 6.2 MB 入口不变，加载后 ready，1 个画布 |
| 页面图片检查 | 全站本地图片引用检查通过，missing=[] |

以上是本机本地服务上的功能抽查，第二次加载可能受缓存影响。“首次画面提交”不是 GPU 完成或用户感知加载时间。窄屏模拟不是 Android/iPhone 真机测试，也未测试真实触摸硬件、弱网、国内直连、跨浏览器成功率。本轮没有独立重测失败注入或网络中断，失败提示沿用既有实现。

## 失败与修正记录

1. 少量原始法线含非有限值，导致工作 JSON 出现 NaN。归一化/修复法线后禁止 JSON 非有限数值输出，后续校验通过；未因该问题删除可见面。
2. 直接实例化原始变换后，解码校验出现 14 个非单位旋转错误。修正齐次缩放、烘焙倾斜后归零。
3. 完整文件包含外围研究模型，首次总览不可读。选取中央完整项目并提供聚焦/完整场地双尺度视角。
4. 本机 Sharp 的纹理转换出现 colourspace 错误，改用 Pillow 输出 WebP，再嵌入 GLB；最终纹理在浏览器正常加载。

## 重建顺序

在仓库根目录运行，Python 需要 numpy/Pillow，读取模型时需要本机 SketchUp 2025 的签名 DLL；DLL 路径配置在导出脚本中。

1. `python scripts/export-shekua.py`
2. `python scripts/analyze-shekua-site.py`
3. `python scripts/prepare-shekua-transforms.py`
4. `python scripts/compress-shekua-textures.py`
5. `node scripts/optimize-shekua.mjs`
6. `node scripts/validate-shekua.mjs`
7. `npm run build`

工作文件在已忽略的 `.model-work/shekua/` 下，不提交原 SKB 或大型中间文件。若用户更新模型，源对象索引和场地范围可能变化，应重新审查选择范围，而非直接沿用本次索引。

参考：[SketchUp C API](https://extensions.sketchup.com/developers/sketchup_c_api/sketchup/index.html)、[网格三角化接口](https://extensions.sketchup.com/developers/sketchup_c_api/sketchup/struct_s_u_mesh_helper_ref.html)、[纹理接口](https://extensions.sketchup.com/developers/sketchup_c_api/sketchup/struct_s_u_texture_ref.html)。

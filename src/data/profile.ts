/** Public facts migrated from the AI resume (2026-10-02) and architecture about/contact pages. */
export const profile = {
  name: '王誉翔',
  enName: 'Yuxiang Wang',
  tagline: '具有建筑与空间设计背景的 AI 产品实践者',
  role: 'AI 产品经理 / 产品策划',
  direction: 'AI 产品',
  email: 'm17347819733@163.com',
  phone: '15065171825',
  phoneDisplay: '+86 150 6517 1825',
  github: 'https://github.com/wyuxiang020-ctrl',
  xiaohongshu: '9535218642',
  availability: '2026.11 可到岗，可协商提前至 10 月',
  graduation: '预计 2026.10 毕业',
  language: 'IELTS 6.5',
  website: 'https://yuxiangworks.com/',
  portrait: '/images/yuxiang-portrait.jpg',
  resumePdf: '/downloads/yuxiang-wang-resume.pdf',
  originalResumePdf: '/downloads/yuxiang-wang-resume-original-2026-10-02.pdf',
  sourceUpdated: '2026.10.02',
  education: [
    { institution: '曼彻斯特大学 / 曼彻斯特建筑学院', date: '2025.09 — 2026.10（预计）', degree: 'MA Architecture and Adaptive Reuse · 硕士在读', result: '预计 Distinction', description: '建筑设计与适应性改造；跨学科研究、复杂信息梳理与方案表达。' },
    { institution: '四川美术学院', date: '2020.09 — 2025.06', degree: '建筑学学士', result: 'GPA 3.85 / 4.0 · 专业排名 1 / 50', description: '连续四年校级奖学金 · 本科毕业展入选。' },
  ],
  experience: [
    { institution: '重庆市设计院有限公司', date: '2024.03 — 2024.06', role: '建筑设计六院 · 建筑实习生', description: '参与建筑项目，梳理客户目标、场地条件与评审约束，将模糊诉求转化为功能、动线和设计任务；协同主创建筑师比较方案、收敛多轮反馈，以 CAD、Rhino、SketchUp 推进设计深化与图纸交付。' },
  ],
  skills: [
    { name: '产品与评测', description: '需求拆解、用户流程、MVP 取舍、边界情况、评测与验收。' },
    { name: 'AI 产品实践', description: '理解结构化输出、RAG 与多模态交互；持续使用 ChatGPT、Claude、Codex 推进个人项目。' },
    { name: '建筑与表达', description: 'Rhino、SketchUp、CAD；场地研究、空间设计与图纸表达。' },
  ],
  awards: [
    { name: '国家奖学金', detail: '2024.09', note: '' },
    { name: '米兰设计周中国高校设计学科师生优秀作品展二等奖', detail: '', note: '按 2026.10.02 更新简历记载；旧建筑站记为三等奖，等级待证书核对。' },
    { name: '校级一、二等奖学金；三好学生、优秀学生干部', detail: '', note: '' },
  ],
  exhibitions: [
    { name: '四川美术学院 2025 届毕业展', project: '½ 日记——大院时光', href: '/architecture/half-diary/' },
    { name: '四川美术学院第 27 届本科生年展（2023）', project: '延续与重构', href: '/architecture/continuation/' },
  ],
} as const;

export const resumeProjects = [
  { name: '建筑团队 RAG 知识助手', en: 'Project Knowledge Copilot', date: '2026.05 — 至今', href: '/projects/knowledge-copilot/', points: [
    { label: '问题洞察与规划', text: '基于个人建筑资料分散、AI 回答难核验的场景，以用户任务（JTBD）拆解“找到证据—形成结论—原文核验”；独立负责 MVP、交互与评测，优先打通可信问答，暂缓企业权限与复杂 Agent。' },
    { label: 'RAG 方案与可信交互', text: '将系统拆为资料入库、检索、生成与证据核验四层，借助 AI Coding 基于 Next.js、pgvector、Voyage AI 与 Claude API 完成原型；区分回答、证据不足、引用异常与请求失败，设计引用校验、拒答及恢复路径。' },
    { label: '文档处理与迭代', text: '支持项目范围选择、可恢复批量向量化及分卷 PDF 阅读，将物理分卷组织为保留原页码的逻辑文档；处理 293 页真实资料、完成 289 个片段向量化，持续跟踪生成失败和等待时间。' },
    { label: '分层评测与取舍', text: '建立 16 题基线，分别检查检索命中、回答依据、引用与拒答。8 个已知答案问题 Hit@1 为 7/8（87.5%）；跨项目实验中，11 个检查项的目标项目覆盖由 9/11 增至 11/11，有效证据仍为 6/11，因此保留原默认策略。' },
  ] },
  { name: 'AI 健身与饮食记录 PWA', en: 'Gym · 个人项目', date: '2026.07 — 至今', href: '/projects/gym/', points: [
    { label: '场景与产品规划', text: '从个人训练计划重复录入、零散记录难整理的问题出发，负责需求拆解、MVP 优先级与交互设计；复用 5 套训练模板、52 个动作和历史重量，设计“计划导入—逐组核对—确认完成”，降低重复填写负担。' },
    { label: '多模态与用户控制', text: '接入训练文字、饮食文字、照片及备注 4 类 AI 解析接口，将自由输入转为可编辑草稿；明确规则、模型与用户的职责，通过结构校验、缺失项补充与确认保存，避免模型结果直接写入历史记录。' },
    { label: '评测与体验迭代', text: '同组 20 条合成用例中，边界处理由 6/8 改善至 8/8，修复虚构时长与秒数误作次数；延迟中位数由 5.29 增至 6.41 秒，结合失败样本记录质量与等待成本，未将离线结果等同于真实用户效果。' },
    { label: '异常流程与验收', text: '为 AI 解析失败保留手动录入入口，写入前整体检查；把计划与完成状态分开，未确认的草稿不记为实际训练。新版处于受保护预览阶段，个人负责功能逻辑、测试用例与迭代验收。' },
  ] },
  { name: 'AI 辅助开发与交互式 3D', en: 'Architecture Portfolio Website', date: '2026.04 — 至今', href: '/projects/spatial-portfolio/', points: [
    { label: '用户阅读与产品表达', text: '面向招聘方和设计同行，将建筑作品组织为概览、过程、图纸与 3D 探索；通过分层内容、预设视角与图层控制，让读者先理解核心方案，再按需深入查看，减少图像堆叠和大型素材加载负担。' },
    { label: '原型落地与验收', text: '负责信息架构、内容取舍和交互验收，借助 Claude Code / Codex 交付原建筑站 11 个页面、两个真实模型；验证大图关闭恢复、返回后单画布和加载失败降级，原站于 2026 年 9 月完成生产发布。当前合并版的本地检查与线上发布分别记录。' },
  ] },
] as const;

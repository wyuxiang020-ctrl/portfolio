export const architectureNotes: Record<string, { title: string; role: string; boundary: string; discipline: string }> = {
  'continuation': { title: '延续与重构', role: '本科课程设计 · 场地分析、建筑设计与图纸表达', boundary: '课程设计方案，未作为已建成或运营项目展示。人群比例沿用原分析图，样本与统计方法待补充。', discipline: '文脉回应 / 公共空间' },
  'symsensory': { title: '新五感设计', role: '课程设计 · 场景分析、参数化推演与建筑表达', boundary: '设计方法与建筑提案；参数化推演表达设计判断，不等同于真实人流实验或建成后效果验证。', discipline: '参数化 / 感知体验' },
  'iterative-learning': { title: '迭代学习', role: '与刘涵合作 · 研究、设计与作品集表达', boundary: '王誉翔与刘涵合作项目；当前归档未逐项拆分个人负责图纸，页面保留团队署名，不将团队成果全部归为个人。', discipline: '适应性再利用 / 学习空间' },
  'grandmothers-hearth': { title: '祖母的火塘', role: '与刘涵合作 · 实地走访、设计与作品集表达', boundary: '王誉翔与刘涵合作项目；生活时间线为设计情景推演，效果图为设计表达，尚无建成后使用评估。', discipline: '文化遗产 / 木构更新' },
  'half-diary': { title: '½ 日记——大院时光', role: '三人毕业设计中的篇章一；其余两篇由组内同学负责', boundary: '本页展示本人负责的“大院时光”篇章。问卷图表保留原项目记录，有效样本数、原始问卷与调查日期待补充。', discipline: '工业遗产 / 校园更新' },
  'hard-hat-cafe': { title: '暂驻之间｜临时咖啡馆', role: '12 人跨年级团队成员 · 与 In-Situ 艺术组织合作', boundary: '展示团队提案、讨论与汇报记录；当前资料未逐项拆分个人职责，提案渲染图不作为已落成或真实运营证据。', discipline: '社区协作 / 临时建筑' },
  'gather-living': { title: '「20+」青年集合住宅', role: '课程设计 · 人群需求、模块系统与建筑表达', boundary: '青年居住课程提案；人物类型与使用场景用于设计讨论，尚无建成后的居住体验或经济性验证。', discipline: '模块化 / 共享居住' },
};
export const featuredArchitecture = [
  { slug: 'grandmothers-hearth', title: '祖母的火塘', year: '2026', cover: '/images/projects/grandmothers-hearth/portfolio/aerial-day.jpg', label: '文化遗产 · 柔性更新', summary: '从祖母的日常出发，在木构院落中组织家庭生活与访客体验。' },
  { slug: 'iterative-learning', title: '迭代学习', year: '2025–2026', cover: '/images/projects/iterative-learning/portfolio/aerial-front.jpg', label: '学习空间 · 适应性再利用', summary: '把尝试、反馈与重新开始，转译为可以行走的空间路径。' },
  { slug: 'symsensory', title: '新五感设计', year: '2024', cover: '/images/projects/symsensory/cover.jpg', label: '参数化 · 感知体验', summary: '以人群路径与感知框架，推演创业中心的空间与功能。' },
];
export const architectureOrder = ['grandmothers-hearth', 'hard-hat-cafe', 'iterative-learning', 'half-diary', 'symsensory', 'continuation', 'gather-living'];

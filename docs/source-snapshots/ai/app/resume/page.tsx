/* oxlint-disable next/no-html-link-for-pages -- Native document links. */
import type {Metadata} from 'next';
import PrintButton from './print-button';
export const metadata:Metadata={title:'王誉翔 · AI 产品经理简历',description:'AI 产品经理 / 产品策划。建筑与空间设计背景，产品定义、多模态交互与评测实践。'};
const projects=[
 {name:'建筑团队 RAG 知识助手',en:'Project Knowledge Copilot',date:'2026.05 — 至今',href:'/projects/knowledge-copilot',points:[
 ['问题洞察与规划','基于个人建筑资料分散、AI 回答难核验的场景，以用户任务（JTBD）拆解“找到证据—形成结论—原文核验”；独立负责 MVP、交互与评测，优先打通可信问答，暂缓企业权限与复杂 Agent。'],
 ['RAG 方案与可信交互','将系统拆为资料入库、检索、生成与证据核验四层，借助 AI Coding 基于 Next.js、pgvector、Voyage AI 与 Claude API 完成原型；区分回答、证据不足、引用异常与请求失败，设计引用校验、拒答及恢复路径。'],
 ['文档处理与迭代','支持项目范围选择、可恢复批量向量化及分卷 PDF 阅读，将物理分卷组织为保留原页码的逻辑文档；处理 293 页真实资料、完成 289 个片段向量化，持续跟踪生成失败和等待时间。'],
 ['分层评测与取舍','建立 16 题基线，分别检查检索命中、回答依据、引用与拒答。8 个已知答案问题 Hit@1 为 7/8（87.5%）；跨项目实验中，11 个检查项的目标项目覆盖由 9 项增至 11 项，有效证据仍为 6 项，因此保留原默认策略。']
 ]},
 {name:'AI 健身与饮食记录 PWA',en:'Gym · 个人项目',date:'2026.07 — 至今',href:'/projects/gym',points:[
 ['场景与产品规划','从个人训练计划重复录入、零散记录难整理的问题出发，负责需求拆解、MVP 优先级与交互设计；复用 5 套训练模板、52 个动作和历史重量，设计“计划导入—逐组核对—确认完成”，降低重复填写负担。'],
 ['多模态与用户控制','接入训练文字、饮食文字、照片及备注 4 类 AI 解析接口，将自由输入转为可编辑草稿；明确规则、模型与用户的职责，通过结构校验、缺失项补充与确认保存，避免模型结果直接写入历史记录。'],
 ['评测与体验迭代','同组 20 条合成用例中，边界处理由 6/8 改善至 8/8，修复虚构时长与秒数误作次数；延迟中位数由 5.29 增至 6.41 秒，结合失败样本记录质量与等待成本，未将离线结果等同于真实用户效果。'],
 ['异常流程与验收','为 AI 解析失败保留手动录入入口，写入前整体检查；把计划与完成状态分开，未确认的草稿不记为实际训练。新版处于受保护预览阶段，个人负责功能逻辑、测试用例与迭代验收。']
 ]},
 {name:'AI 辅助开发与交互式 3D',en:'Architecture Portfolio Website',date:'2026.04 — 至今',href:'/projects/spatial-portfolio',points:[
 ['用户阅读与产品表达','面向招聘方和设计同行，将建筑作品组织为概览、过程、图纸与 3D 探索；通过分层内容、预设视角与图层控制，让读者先理解核心方案，再按需深入查看，减少图像堆叠和大型素材加载负担。'],
 ['原型落地与验收','负责信息架构、内容取舍和交互验收，借助 Claude Code / Codex 交付 11 个页面、两个真实模型；验证大图关闭恢复、返回后单画布和加载失败降级，2026 年 9 月完成生产发布。']
 ]}
];
export default function Resume(){return <main className="wrap resume-page" id="resume-top">
 <div className="resume-toolbar"><a href="/">← 返回作品集</a><div><PrintButton/><a className="resume-pdf-link" href="/downloads/yuxiang-wang-resume.pdf" target="_blank" rel="noreferrer">查看原版 PDF ↗</a></div></div>
 <article className="resume-sheet">
 <header className="resume-heading"><p className="eyebrow">CURRICULUM VITAE / 简历</p><h1>王誉翔 <span>Yuxiang Wang</span></h1><p className="resume-position">AI 产品经理 / 产品策划</p><div className="resume-contacts"><a href="tel:15065171825">150 6517 1825</a><a href="mailto:m17347819733@163.com">m17347819733@163.com</a><span>IELTS 6.5</span></div><p className="resume-availability">预计 2026.10 毕业<br/><strong>2026.11 可到岗，可协商提前至 10 月</strong></p><p className="resume-url">作品集：<a href="https://ai.yuxiangworks.com/">ai.yuxiangworks.com ↗</a></p></header>
 <nav className="resume-index" aria-label="简历章节"><a href="#education">教育背景</a><a href="#internship">实习经历</a><a href="#practice">项目经历</a><a href="#skills">技能与荣誉</a></nav>
 <section id="education"><h2><span>01</span> 教育背景</h2><article className="resume-entry"><div className="resume-entry-heading"><h3>曼彻斯特大学</h3><time>2025.09 — 2026.10</time></div><p className="resume-meta">MA Architecture and Adaptive Reuse · 硕士 · 预计 Distinction</p><p>建筑设计与适应性改造；跨学科研究、复杂信息梳理与方案表达。</p></article><article className="resume-entry"><div className="resume-entry-heading"><h3>四川美术学院</h3><time>2020.09 — 2025.06</time></div><p className="resume-meta">建筑学学士</p><p>GPA 3.85 / 4.0 · 专业排名 1 / 50 · 连续四年校级奖学金 · 本科毕业展入选</p></article></section>
 <section id="internship"><h2><span>02</span> 实习经历</h2><article className="resume-entry"><div className="resume-entry-heading"><h3>重庆市设计院有限公司</h3><time>2024.03 — 2024.06</time></div><p className="resume-meta">建筑设计六院 · 建筑实习生</p><p><strong>需求拆解与协同：</strong>参与建筑项目，梳理客户目标、场地条件与评审约束，将模糊诉求转化为功能、动线和设计任务；协同主创建筑师比较方案、收敛多轮反馈，以 CAD、Rhino、SketchUp 推进设计深化与图纸交付。</p></article></section>
 <section id="practice"><h2><span>03</span> 项目经历</h2>{projects.map(p=><article className="resume-entry" key={p.href}><div className="resume-entry-heading"><h3><a href={p.href}>{p.name} ↗</a></h3><time>{p.date}</time></div><p className="resume-meta">{p.en}</p><ul className="resume-points">{p.points.map(([label,text])=><li key={label}><strong>{label}</strong><p>{text}</p></li>)}</ul><a className="resume-case-link" href={p.href}>阅读完整项目案例 ↗</a></article>)}</section>
 <section id="skills"><h2><span>04</span> 专业技能与荣誉</h2><h3>产品与 AI 工具</h3><p>需求拆解、用户流程、MVP 取舍、边界情况、评测与验收；持续使用 ChatGPT、Claude、Codex 推进个人项目，理解结构化输出、RAG 与多模态交互；具备 Rhino、SketchUp、CAD 设计实践。</p><h3>精选荣誉</h3><ul><li>国家奖学金（2024.09）</li><li>米兰设计周中国高校设计学科师生优秀作品展二等奖</li><li>校级一、二等奖学金；三好学生、优秀学生干部</li></ul></section>
 <footer className="resume-source"><p>依据本人提供的《AI 产品方向 · 简历更新版》整理 · 2026.10.02</p><a href="#resume-top">回到顶部 ↑</a></footer>
 </article></main>}

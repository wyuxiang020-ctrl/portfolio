/* oxlint-disable next/no-img-element -- Original project screenshots. */
/* oxlint-disable next/no-html-link-for-pages -- Native navigation in the portable build. */
import {ArrowUpRight, CodeXml, Mail, FileText} from 'lucide-react';
import AmbientLight from './components/ambient-light';
import PortfolioNavigation from './components/portfolio-navigation';
const projects = [
{id:'01',image:'knowledge-flow-cover.svg',caption:'检索与引用 · 流程示意',title:'建筑项目知识助手',subtitle:'PROJECT KNOWLEDGE COPILOT',href:'/projects/knowledge-copilot',description:'把分散的建筑资料，连接成可追溯的回答。以引用和原文核验组织体验，用检索实验决定产品取舍。',evidence:'一次关键判断：目标项目找得更多，有效证据却没有增加，因此保留原检索策略。',tags:['RAG','证据追溯','评测与决策']},
{id:'02',image:'meal-01-chicken-rice-broccoli.png',caption:'餐食识别 · 合成示例素材',title:'AI 健身与饮食记录',subtitle:'GYM · PERSONAL MVP',href:'/projects/gym',description:'复用训练计划，让 AI 处理文字与餐食照片。识别、修改、确认，再把实际发生的训练和饮食写入记录。',evidence:'以可编辑草稿与人工确认，处理未知重量、照片估算和重复记录。',tags:['多模态输入','人工确认','结构化输出']},
{id:'03',image:'spatial-court.png',caption:'真实模型 · 交互式 3D',title:'建筑作品与交互式 3D',subtitle:'SPATIAL PORTFOLIO',href:'/projects/spatial-portfolio',description:'将长篇 PDF 与专业模型，转化为分层阅读、高清图纸和按需加载的三维探索体验。',evidence:'11 个页面、两个真实模型，记录内容组织、资源成本与交互恢复的取舍。',tags:['空间体验','信息架构','AI 辅助开发']}
];
const experience = [
{date:'2025.09 — 2026.10',title:'曼彻斯特大学',role:'MA Architecture and Adaptive Reuse · 硕士在读',description:'预计 2026 年 10 月毕业。以建筑与空间设计为专业基础，持续探索 AI 应用与数字化空间表达。',tags:['建筑更新','空间研究']},
{date:'2024.03 — 2024.06',title:'重庆市设计院',role:'建筑实习生',description:'参与需求澄清、方案比较与图纸交付，将评审反馈转化为可执行的设计调整。',tags:['需求梳理','方案比较','协作交付']},
{date:'2020.09 — 2025.06',title:'四川美术学院',role:'建筑学学士',description:'GPA 3.85 / 4.0，专业排名 1 / 50，连续四年校级奖学金。',tags:['建筑设计','视觉表达']}
];
export default function Home(){return <div className="editorial-home" id="top">
<AmbientLight/><a className="skip" href="#about">跳到正文</a>
<div className="portfolio-shell">
<header className="identity-rail">
<div>
<a href="#top" className="identity-name"><h1>王誉翔</h1><span>Yuxiang Wang</span></a>
<p className="identity-role">AI 产品经理方向</p><p className="identity-en">AI PRODUCT · SPATIAL THINKING</p>
<p className="identity-intro">从建筑与空间设计出发，<br/>把真实场景转化为有依据的 AI 产品。</p>
<PortfolioNavigation items={[['about','关于我','ABOUT'],['projects','精选项目','PROJECTS'],['experience','教育与经历','EXPERIENCE']]}/>
</div>
<div className="identity-bottom">
<p className="availability-note"><span aria-hidden="true"/>2026.11 可到岗<br/><small>可协商提前至 10 月</small></p>
<div className="identity-links">
<a href="mailto:m17347819733@163.com" aria-label="邮件联系王誉翔" title="邮件联系"><Mail size={22}/></a>
<a href="https://github.com/wyuxiang020-ctrl" target="_blank" rel="noreferrer" aria-label="GitHub 个人主页（新窗口）" title="GitHub"><CodeXml size={22}/></a>
<a href="/resume/" aria-label="查看完整简历" title="完整简历"><FileText size={22}/></a>
<a className="rail-resume" href="/resume/">完整简历 <ArrowUpRight size={16}/></a>
</div></div></header>
<main className="portfolio-main" id="content">
<section id="about" className="portfolio-section about-copy" aria-labelledby="about-title">
<h2 className="section-kicker" id="about-title">关于我 <span>ABOUT</span></h2><p className="about-motto" lang="en">From real problems to thoughtful products.</p>
<p>你好，我是王誉翔，拥有<strong>建筑与空间设计背景</strong>，目前在曼彻斯特大学攻读建筑更新方向硕士。我关注 AI 如何进入具体的工作与生活场景，帮助人们查找依据、整理信息、完成任务。</p>
<p>在三个个人实践中，我负责<strong>问题定义、产品取舍、流程设计与评测验收</strong>，借助 Claude Code 和 Codex 完成开发协作。从建筑知识检索，到健身记录，再到数字空间展示，我尤其在意结果是否可检查，以及出错后能否继续。</p>
<p>目前希望寻找 <strong>AI 应用产品与空间智能</strong>相关机会。下面的案例保留了产品选择、实际界面、评测记录与尚未解决的问题。</p>
</section>
<section id="projects" className="portfolio-section" aria-labelledby="projects-title">
<h2 className="section-kicker" id="projects-title">精选项目 <span>SELECTED PROJECTS / 03</span></h2>
<div className="project-list">{projects.map(p=><a className={'project-entry entry-'+p.id} key={p.id} href={p.href} aria-label={p.title+'：阅读完整案例'}>
<div className="entry-visual"><div className="preview-frame"><img src={'/media/'+p.image} alt={p.caption} width="640" height="420" loading="lazy"/></div><span>PROJECT {p.id}</span><small>{p.caption}</small></div>
<div className="entry-copy"><p className="entry-overline">{p.subtitle}</p><h3>{p.title}<ArrowUpRight size={18} aria-hidden="true"/></h3><p>{p.description}</p><p className="entry-evidence">{p.evidence}</p><ul className="skill-pills" aria-label="项目能力">{p.tags.map(t=><li key={t}>{t}</li>)}</ul></div>
</a>)}</div>
<a href="/resume/" className="inline-link">查看完整简历 <ArrowUpRight size={17}/></a>
</section>
<section id="experience" className="portfolio-section" aria-labelledby="experience-title">
<h2 className="section-kicker" id="experience-title">教育与经历 <span>BACKGROUND</span></h2>
<div className="experience-entries">{experience.map(e=><article className="experience-entry" key={e.title}><p className="experience-date">{e.date}</p><div><h3>{e.title}</h3><p className="experience-role">{e.role}</p><p>{e.description}</p><ul className="skill-pills">{e.tags.map(t=><li key={t}>{t}</li>)}</ul></div></article>)}</div>
</section>
<footer className="editorial-footer"><p>欢迎交流 AI 产品与空间应用。</p><a className="inline-link" href="mailto:m17347819733@163.com">m17347819733@163.com <ArrowUpRight size={16}/></a><p className="design-credit">© 2026 王誉翔<br/>内容、项目与产品实践由本人整理。</p><a className="back-top" href="#top">回到顶部 ↑</a></footer>
</main></div></div>}


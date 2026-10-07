/* oxlint-disable next/no-img-element -- Original screenshots with explicit dimensions. */
type Shot={src:string;title:string;caption:string;width:number;height:number};
const shots:Record<string,Shot[]>={
 knowledge:[
 {src:'knowledge-answer.png',title:'自然语言提问 → 带引用回答',caption:'本轮在隔离 Demo 中实际提问北光档案馆的材料与结构。截图记录一次生成结果，不作为完整评测结论。',width:1265,height:712},
 {src:'knowledge-citation.png',title:'点击引用 → 核对原文片段',caption:'引用 [1] 跳转到被使用的技术摘要，高亮展示对应证据。语义匹配数值仅用于排序。',width:1265,height:712},
 {src:'knowledge-library.png',title:'选择项目 → 查看入库文档',caption:'按项目管理设计说明和技术摘要，解析、切分、向量化分阶段呈现。',width:1265,height:712},
 {src:'knowledge-chunks.png',title:'展开技术详情 → 查看切分结果',caption:'实际展示 chunk 编号、片段内容、token 估计与向量化状态；没有为截图重新入库。',width:1265,height:712}],
 gym:[
 {src:'gym-plan-hd.png',title:'01 / 选择与编辑计划',caption:'从模板开始，保留训练日、动作与目标组次。',width:708,height:1688},
 {src:'gym-import.png',title:'02 / 导入当天训练',caption:'复用已有计划，导入后的组次默认未完成。',width:415,height:899},
 {src:'gym-partial.png',title:'03 / 逐组核对完成',caption:'将计划与实际发生的训练分开，保留部分完成状态。',width:415,height:899},
 {src:'gym-complete.png',title:'04 / 完成后进入记录',caption:'确认训练完成后显示反馈，形成记录闭环。',width:415,height:899}],
 spatial:[
 {src:'spatial-selected.png',title:'Selected Work / 多项目概览',caption:'用户提供的真实建筑网站截图，集中呈现三个设计项目。',width:1929,height:1260},
 {src:'spatial-home.png',title:'网站首页 / 个人定位',caption:'真实首页以建筑背景、个人身份和作品入口建立阅读起点。',width:2487,height:1353}]
};
export default function ProjectGallery({project}:{project:'gym'|'knowledge'|'spatial'}){return <div className={'project-gallery gallery-'+project}><div className="gallery-caption"><span>真实界面 / PRODUCT SCREENS</span><p>{project==='spatial'?'建筑网站实拍 · 点击图片进入全屏图集，滚轮切换。':'合成演示数据 · 真实产品界面，非真人使用记录。点击图片进入全屏图集，滚轮切换。'}</p></div><div className="gallery-grid">{shots[project].map(s=><figure key={s.src}><a href={'/media/'+s.src} data-lightbox aria-label={'查看大图：'+s.title}><img src={'/media/'+s.src} alt={s.title} width={s.width} height={s.height} loading="lazy"/></a><figcaption><h3>{s.title}</h3><p>{s.caption}</p></figcaption></figure>)}</div></div>}

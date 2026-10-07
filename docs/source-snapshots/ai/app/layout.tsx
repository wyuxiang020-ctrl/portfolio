import type { Metadata } from 'next';
import './globals.css';
import './portfolio-refinements.css';
import './editorial.css';
import ImageLightbox from './components/image-lightbox';
import ReadingNavigation from './components/reading-navigation';
export const metadata: Metadata = {title:'王誉翔 · AI 产品作品集',description:'王誉翔的 AI 产品作品集：建筑团队 RAG 知识助手、AI 健身 PWA 与交互式 3D 原型。',icons:{icon:'/favicon.svg'},robots:{index:false,follow:false}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="zh-CN"><body><ReadingNavigation/><ImageLightbox/>{children}</body></html>}



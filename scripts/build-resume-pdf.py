"""Build the current public PDF from src/data/profile.ts via export-profile.mjs.
Requires reportlab. Run export-profile.mjs first, then this script from project root.
"""
from pathlib import Path
from html import escape
import json
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, KeepTogether

ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / 'tmp/pdfs/profile.json').read_text(encoding='utf-8'))
p, projects = data['profile'], data['resumeProjects']
pdfmetrics.registerFont(TTFont('YaHei', r'C:\Windows\Fonts\msyh.ttc', subfontIndex=0))
pdfmetrics.registerFont(TTFont('YaHeiBold', r'C:\Windows\Fonts\msyhbd.ttc', subfontIndex=0))
pdfmetrics.registerFontFamily('YaHei', normal='YaHei', bold='YaHeiBold', italic='YaHei', boldItalic='YaHeiBold')
INK = colors.HexColor('#172B2D')
MUTED = colors.HexColor('#516364')
GREEN = colors.HexColor('#386754')
LINE = colors.HexColor('#D3DEDA')
styles = {
  'name': ParagraphStyle('name', fontName='YaHeiBold', fontSize=23, leading=30, textColor=INK, spaceAfter=9),
  'role': ParagraphStyle('role', fontName='YaHeiBold', fontSize=11, leading=17, textColor=INK, spaceAfter=8),
  'body': ParagraphStyle('body', fontName='YaHei', fontSize=9.2, leading=15, textColor=INK, wordWrap='CJK', spaceAfter=7),
  'small': ParagraphStyle('small', fontName='YaHei', fontSize=8, leading=12.5, textColor=MUTED, wordWrap='CJK', spaceAfter=5),
  'section': ParagraphStyle('section', fontName='YaHeiBold', fontSize=12, leading=18, textColor=GREEN, spaceBefore=14, spaceAfter=10, keepWithNext=True),
  'entry': ParagraphStyle('entry', fontName='YaHeiBold', fontSize=10, leading=16, textColor=INK, spaceBefore=6, spaceAfter=4, keepWithNext=True),
  'point': ParagraphStyle('point', fontName='YaHei', fontSize=9.2, leading=15, textColor=INK, wordWrap='CJK', spaceAfter=8),
}

def clean(text):
  return escape(str(text).replace('—', '-').replace('–', '-'))

def para(text, style='body'):
  return Paragraph(text, styles[style])

def link(url, label=None):
  return f'<link href="{escape(url, quote=True)}" color="#386754">{clean(label or url)}</link>'

def project(item):
  flow = [para(clean(item['name']) + ' <font color="#516364" size="8"> / ' + clean(item['date']) + '</font>', 'entry'), para(clean(item['en']), 'small')]
  for point in item['points']:
    flow.append(para('<b>' + clean(point['label']) + '</b>  ' + clean(point['text']), 'point'))
  flow.append(para('完整案例：' + link(p['website'].rstrip('/') + item['href']), 'small'))
  return flow

story = [para(clean(p['name']) + ' <font name="YaHei" size="14" color="#516364">' + clean(p['enName']) + '</font>', 'name'), para('求职方向：' + clean(p['role']), 'role'), para(clean(p['phoneDisplay']) + '  |  ' + link('mailto:' + p['email'], p['email']) + '  |  ' + clean(p['language']), 'small'), para(clean(p['graduation']) + '  |  ' + clean(p['availability']), 'small'), para('作品集：' + link(p['website']), 'small'), para('01  教育背景', 'section')]
for item in p['education']:
  story.append(para(clean(item['institution']) + ' <font name="YaHei" size="8" color="#516364"> / ' + clean(item['date']) + '</font>', 'entry'))
  story.append(para(clean(item['degree']) + ' · ' + clean(item['result']), 'small'))
  story.append(para(clean(item['description'])))
story.append(para('02  实习经历', 'section'))
for item in p['experience']:
  story.append(para(clean(item['institution']) + ' <font name="YaHei" size="8" color="#516364"> / ' + clean(item['date']) + '</font>', 'entry'))
  story.append(para(clean(item['role']), 'small'))
  story.append(para('<b>需求拆解与协同</b>  ' + clean(item['description'])))
story.append(para('03  项目经历', 'section'))
story.extend(project(projects[0]))
story.append(PageBreak())
story.append(para('03  项目经历（续）', 'section'))
story.extend(project(projects[1]))
story.append(Spacer(1, 5))
story.extend(project(projects[2]))
story.append(para('04  专业技能与荣誉', 'section'))
for item in p['skills']:
  story.append(para('<b>' + clean(item['name']) + '</b>  ' + clean(item['description'])))
for item in p['awards']:
  text = clean(item['name']) + ('（' + clean(item['detail']) + '）' if item['detail'] else '')
  if item['note']:
    text += '<br/><font size="8" color="#516364">' + clean(item['note']) + '</font>'
  story.append(para(text))
story.append(Spacer(1, 8))
story.append(para('内容依据 2026.10.02 更新简历与建筑站现有资料整理。原版 PDF 与完整案例可在网页版简历中查看。', 'small'))
story.append(para(link('https://yuxiangworks.com/resume/'), 'small'))

def footer(canvas, doc):
  canvas.saveState()
  w,h=A4
  canvas.setStrokeColor(LINE)
  canvas.line(42, 34, w-42, 34)
  canvas.setFont('YaHei', 7)
  canvas.setFillColor(MUTED)
  canvas.drawString(42, 22, '王誉翔 · AI 产品方向 · 合并版 2026.10.07')
  canvas.drawRightString(w-42, 22, f'{doc.page} / 2')
  canvas.restoreState()

destination = ROOT / 'public/downloads/yuxiang-wang-resume.pdf'
doc = SimpleDocTemplate(str(destination), pagesize=A4, rightMargin=42, leftMargin=42, topMargin=35, bottomMargin=47, title='王誉翔 · AI 产品方向完整简历', author='王誉翔', subject='统一主域版本，保留评测分母和待核实事项')
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(destination)

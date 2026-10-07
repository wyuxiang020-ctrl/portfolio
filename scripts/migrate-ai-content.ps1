$ErrorActionPreference = 'Stop'
$sourceRoot = 'E:\ai作品网站\portfolio'
$targetRoot = Split-Path -Parent $PSScriptRoot

# Read the current source checkout, never its Git history or private configuration.
function Write-Utf8($Path, $Content) {
  $fullPath = Join-Path $targetRoot $Path
  [System.IO.Directory]::CreateDirectory((Split-Path -Parent $fullPath)) | Out-Null
  [System.IO.File]::WriteAllText($fullPath, $Content, [System.Text.UTF8Encoding]::new($false))
}
function Convert-Body($Text) {
  $Text = $Text.Replace('className=', 'class=')
  $Text = [regex]::Replace($Text, ' key=\{[^}]*\}', '')
  $Text = $Text.Replace('href="/#projects"', 'href="/ai/"').Replace('href="/projects/knowledge-copilot"', 'href="/projects/knowledge-copilot/"')
  $Text = $Text.Replace('https://portfolio-nine-alpha-vjzzxk79fm.vercel.app/work/grandmothers-hearth/#interactive-model', '/architecture/grandmothers-hearth/#interactive-model')
  $Text = $Text.Replace('https://portfolio-nine-alpha-vjzzxk79fm.vercel.app/work/iterative-learning/#interactive-model', '/architecture/iterative-learning/#interactive-model')
  $Text = [regex]::Replace($Text, '(href="/architecture/[^\"]+") target="_blank" rel="noreferrer"', '$1')
  return $Text
}
$projects = @('knowledge-copilot', 'gym', 'spatial-portfolio')
foreach ($project in $projects) {
  $sourceFile = Join-Path $sourceRoot ('app\projects\' + $project + '\page.tsx')
  $text = Get-Content -LiteralPath $sourceFile -Raw
  $start = $text.IndexOf('<section id="problem"')
  $end = $text.IndexOf('</div></div></section><EvidencePanel')
  if ($start -lt 0 -or $end -le $start) { throw 'Unexpected source structure: ' + $project }
  $body = Convert-Body $text.Substring($start, $end - $start)
  if ($project -eq 'knowledge-copilot') {
    $body = $body.Replace('以上为已实现流程的文字说明。案例未使用真实投标资料截图；公开视觉素材将使用独立合成数据。', '以上流程已实现。页首截图来自隔离 Demo 的合成项目与一次实际运行，没有使用真实投标资料；它们说明界面和流程，不代表整套质量评测已完成。')
    $body = $body.Replace('用合成资料制作截图、视频与 PDF 阅读演示。', '补充视频与 PDF 阅读演示；现有隔离 Demo 截图仍不替代完整流程录像。')
  }
  if ($project -eq 'spatial-portfolio') {
    $body = $body.Replace('最新生产访问检查见上方独立证据', '2026.09.07 生产访问检查见文末独立证据')
    $body = $body.Replace('以上来自本地开发环境；第一帧提交不等于 GPU 完成绘制或用户已感知可操作。', '以上来自原建筑站的本地开发环境，非本次合并版测速；第一帧提交不等于 GPU 完成绘制或用户已感知可操作。')
    $body = $body.Replace('以下来自项目已有工程与浏览器检查记录。', '以下来自原建筑站已有工程与浏览器检查记录；11 个页面为当时站点范围，不是本次合并版的页面数量。')
    $body = $body.Replace('<h3>两个真实模型，采用不同的信息组织</h3>', '<h3>两个真实模型，采用不同的信息组织</h3><p class="method-note">下表记录 2026.09 原站的交付范围。链接已接到本次合并的建筑详情，当前轻量与高清版本的体积以查看器按钮为准；本次本地迁移不等于重新完成线上验收。</p>')
  }
  if ($project -eq 'gym') {
    $body = $body.Replace("['语义召回','100%','100%'],", '')
    $body = $body.Replace("['语义精确率','98.7%','100%'],", '')
    $body = $body.Replace("['硬检查','94.9%','100%'],", '')
    $body = $body.Replace(']}/><p>真实问题包括', ']}/><details class="technical-note"><summary>原始评分百分比 · 逐项分母待补</summary><p>35 条基线的原记录为：语义召回 100%、语义精确率 98.7%、硬检查 94.9%；10 条定向重算为三项 100%。当前公开归档未附这三类指标的逐项命中数 / 总项数。它们仅作为历史评分记录保留，不呈现为完整准确率结论。</p></details><p>真实问题包括')
    $body = $body.Replace('语义指标按合成数据集评分口径计算，不代表营养识别达到医疗级准确度；', '上表语义召回、语义精确率与硬检查百分数保留原案例记录：样本为 35 条基线和 10 条定向重算；逐项命中数 / 总项数未随当前公开归档提供，分母仍待补证，不作为总体准确率结论。')
    $body = $body.Replace('上表语义召回、语义精确率与硬检查百分数保留原案例记录：样本为 35 条基线和 10 条定向重算；逐项命中数 / 总项数未随当前公开归档提供，分母仍待补证，不作为总体准确率结论。', '语义评分的逐项分母待补；照片与营养估算不作为健康结果或营养准确率证明。')
  }
  $repo = if ($project -eq 'knowledge-copilot') { 'https://github.com/wyuxiang020-ctrl/Project-Knowledge-Copilot' } else { 'https://github.com/wyuxiang020-ctrl/portfolio' }
  $header = "---`nimport Results from '../../components/cases/Results.astro';`nimport BodyImage from '../../components/cases/BodyImage.astro';`nimport FoodAnalysis from '../../components/cases/FoodAnalysis.astro';`nconst repo = '$repo';`n---`n"
  Write-Utf8 ('src/content/ai/' + $project + '.astro') ($header + $body + "`n")
  $page = "---`nimport CaseLayout from '../../../layouts/CaseLayout.astro';`nimport Content from '../../../content/ai/$project.astro';`nimport { projects } from '../../../data/ai-projects';`nconst project = projects.find(item => item.id === '$project')!;`n---`n<CaseLayout project={project}><Content /></CaseLayout>`n"
  Write-Utf8 ('src/pages/projects/' + $project + '/index.astro') $page
}

$food = Get-Content -LiteralPath (Join-Path $sourceRoot 'app\components\body-visuals.tsx') -Raw
$foodStart = $food.IndexOf('return <section className="story-section"') + 'return '.Length
$foodEnd = $food.LastIndexOf('</section>}') + '</section>'.Length
$foodBody = Convert-Body $food.Substring($foodStart, $foodEnd - $foodStart)
foreach ($pair in @(@('TableHeader','thead'),@('TableBody','tbody'),@('TableRow','tr'),@('TableHead','th'),@('TableCell','td'),@('Table','table'))) {
  $foodBody = $foodBody.Replace('<' + $pair[0], '<' + $pair[1]).Replace('</' + $pair[0], '</' + $pair[1])
}
$foodBody = $foodBody.Replace('<a data-lightbox href={''/media/''+d.image}><img ', '<img data-gallery="project" data-full-src={''/media/''+d.image} ')
$foodBody = $foodBody.Replace('/></a>', '/>')
$foodBody = $foodBody.Replace(' · 合成测试餐图', ' · AI 生成的合成餐图，非真实餐食照片')
$foodBody = $foodBody.Replace('src={''/media/''+d.image}', 'src={''/media/''+d.image.replace(''.png'', ''-thumb.webp'')}')
$foodBody = $foodBody.Replace('data-full-src={''/media/''+d.image.replace(''.png'', ''-thumb.webp'')}', 'data-full-src={''/media/''+d.image}')
$foodBody = $foodBody.Replace('width="1024" height="1024"', 'width={[[1254,1254],[1366,1151],[1358,1159],[1254,1254]][i][0]} height={[[1254,1254],[1366,1151],[1358,1159],[1254,1254]][i][1]}')
$foodHeader = "---`nimport dishes from '../../data/food-evidence.json';`nimport BodyImage from './BodyImage.astro';`n---`n"
Write-Utf8 'src/components/cases/FoodAnalysis.astro' ($foodHeader + $foodBody + "`n")

[System.IO.Directory]::CreateDirectory((Join-Path $targetRoot 'public/evidence')) | Out-Null
Copy-Item -LiteralPath (Join-Path $sourceRoot 'app/data/food-evidence.json') -Destination (Join-Path $targetRoot 'src/data/food-evidence.json')
Copy-Item -LiteralPath (Join-Path $sourceRoot 'app/data/evidence.json') -Destination (Join-Path $targetRoot 'src/data/ai-evidence.json')
Get-ChildItem -LiteralPath (Join-Path $sourceRoot 'public/evidence') -File | ForEach-Object { Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $targetRoot ('public/evidence/' + $_.Name)) }
Write-Output 'Migrated three complete case narratives and five evidence files from the current read-only source checkout.'

/**
 * 与 src/audio/phrase-registry.ts 中 allPhraseAssetEntries 保持同步（仅用于无 tsx 时 Node 直跑）
 * macOS: say + afconvert -> src/assets/audio/*.wav
 */
import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const clientRoot = join(__dirname, '..')
const outDir = join(clientRoot, 'src/assets/audio')

function rankSpeech(mainValue) {
  if (mainValue >= 100) return ''
  if (mainValue === 16) return '小王'
  if (mainValue === 17) return '大王'
  const m = {
    3: '三',
    4: '四',
    5: '五',
    6: '六',
    7: '七',
    8: '八',
    9: '九',
    10: '十',
    11: '钩',
    12: '圈',
    13: '凯',
    14: '尖',
    15: '二',
  }
  return m[mainValue] ?? ''
}

const MAIN_VALUES = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]

function allPhraseAssetEntries() {
  const map = new Map()
  const add = (key, text) => {
    if (!map.has(key)) map.set(key, text)
  }

  add('pass_skip', '跳过')
  add('triple_with_pair', '三带二')
  add('joker_bomb', '王炸')
  add('fallback_play', '出牌')

  for (const mv of MAIN_VALUES) {
    const r = rankSpeech(mv)
    add(`single_mv_${mv}`, r ? `单张，${r}` : '单张')
    add(`pair_mv_${mv}`, r ? `对${r}` : '对子')
    add(`triple_mv_${mv}`, r ? `三个${r}` : '三张')
    add(`straight_mv_${mv}`, r ? `顺子，${r}` : '顺子')
    add(`straight_pair_mv_${mv}`, r ? `连对，${r}` : '连对')
    add(`triple_run_mv_${mv}`, r ? `钢板，${r}` : '钢板')
    add(`straight_bomb_mv_${mv}`, r ? `同花顺，${r}` : '同花顺')
  }

  for (let n = 4; n <= 10; n++) {
    for (const mv of MAIN_VALUES) {
      if (mv > 15) continue
      const r = rankSpeech(mv)
      add(`bomb_${n}_mv_${mv}`, r ? `${n}张炸弹，${r}` : `${n}张炸弹`)
    }
  }

  return [...map.entries()].map(([key, text]) => ({ key, text }))
}

const voice = process.env.SAY_VOICE ?? 'Ting-Ting'
const force = process.env.FORCE === '1'

if (process.platform !== 'darwin') {
  console.error('仅支持 macOS（需要 say / afconvert）。')
  process.exit(1)
}

mkdirSync(outDir, { recursive: true })
const tmpDir = mkdtempSync(join(tmpdir(), 'guandan-tts-'))

try {
  const list = allPhraseAssetEntries()
  console.log(`共 ${list.length} 条短语，语音: ${voice}`)

  let skipped = 0
  let written = 0

  for (const { key, text } of list) {
    const wavPath = join(outDir, `${key}.wav`)
    if (existsSync(wavPath) && !force) {
      skipped++
      continue
    }

    const aiffPath = join(tmpDir, `${key}.aiff`)
    execSync(`say -v ${JSON.stringify(voice)} ${JSON.stringify(text)} -o ${JSON.stringify(aiffPath)}`)
    execSync(`afconvert -f WAVE -d LEI16 ${JSON.stringify(aiffPath)} ${JSON.stringify(wavPath)}`)
    rmSync(aiffPath, { force: true })
    written++
    if (written % 50 === 0) console.log(`…已写入 ${written} 个`)
  }

  console.log(`完成：新建/覆盖 ${written} 个，跳过已有 ${skipped} 个（FORCE=1 强制全部重生成）`)
} finally {
  rmSync(tmpDir, { recursive: true, force: true })
}

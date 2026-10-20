// emojibase-data(日本語) + iamcal(Slack名) + 英語タグ → 軽量JSONを生成
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import kuromoji from 'kuromoji'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const base = join(root, 'node_modules/emojibase-data')
const load = (p: string) => JSON.parse(readFileSync(join(base, p), 'utf8'))

interface Raw {
  label: string
  hexcode: string
  emoji: string
  tags?: string[]
  order?: number
  version?: number
  group?: number
}

const ja: Raw[] = load('ja/data.json')
const en: Raw[] = load('en/data.json')
const iamcal: Record<string, string | string[]> = load('en/shortcodes/iamcal.json')
const messages: { groups: { key: string; message: string; order: number }[] } = load('ja/messages.json')

const enByHex = new Map(en.map((e) => [e.hexcode, e]))

// 検索用の正規化(クライアントの lib/search.ts と同じ規則にすること)
const norm = (s: string) =>
  s
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .replace(/_/g, ' ')

// group 2 は「コンポーネント」(髪型パーツ・肌色など)なので除外
const SKIP_GROUPS = new Set([2])
const groupDefs = messages.groups.filter((g) => !SKIP_GROUPS.has(g.order))
const groupIndex = new Map(groupDefs.map((g, i) => [g.order, i]))

// 漢字の読み(ひらがな検索用)。ビルド時のみ使用し、実行時には含まれない
const tokenizer = await new Promise<kuromoji.Tokenizer<kuromoji.IpadicFeatures>>((resolve, reject) =>
  kuromoji
    .builder({ dicPath: join(root, 'node_modules/kuromoji/dict') })
    .build((err, t) => (err ? reject(err) : resolve(t))),
)
const reading = (text: string) =>
  tokenizer
    .tokenize(text)
    .map((t) => (t.reading && t.reading !== '*' ? t.reading : t.surface_form))
    .join('')

const items = ja
  .filter((e) => e.group !== undefined && !SKIP_GROUPS.has(e.group))
  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  .map((e) => {
    const sc = iamcal[e.hexcode]
    const names = sc === undefined ? [] : Array.isArray(sc) ? sc : [sc]
    const enE = enByHex.get(e.hexcode)
    const search = norm(
      [e.label, ...(e.tags ?? []), ...[e.label, ...(e.tags ?? [])].map(reading), enE?.label ?? '', ...(enE?.tags ?? []), ...names].join(' '),
    )
    return [e.emoji, names[0] ?? '', search, groupIndex.get(e.group!)!, e.version ?? 0] as const
  })

mkdirSync(join(root, 'src/data'), { recursive: true })
writeFileSync(
  join(root, 'src/data/emoji.json'),
  JSON.stringify({ groups: groupDefs.map((g) => g.message), items }),
)
const named = items.filter((i) => i[1]).length
console.log(`emoji.json: ${items.length} items (${named} with Slack name), ${groupDefs.length} groups`)

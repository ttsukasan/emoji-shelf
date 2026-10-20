// この環境で描画できない(新しすぎる)絵文字を判定する。
// 絵文字バージョンごとの代表絵文字を canvas に描き、
//  - 色が付いていない(代替グリフ/豆腐) → 非対応
//  - ZWJ 結合絵文字が複数グリフに分解されて横幅が広い → 非対応
// とみなす。OS は通常バージョン単位でまとめて対応するため、代表1個で判定できる。
const CANARIES: [version: number, emoji: string][] = [
  [12.1, '\u{1F9D1}\u200D\u{1F9B0}'],
  [13, '\u{1F972}'],
  [13.1, '\u{1F62E}\u200D\u{1F4A8}'],
  [14, '\u{1FAE0}'],
  [15, '\u{1FAE8}'],
  [15.1, '\u{1F426}\u200D\u{1F525}'],
  [16, '\u{1FAE9}'],
  [17, '\u{1FAEA}'],
  [18, '\u{1FAEB}'],
]

const SIZE = 40

function createChecker(): (version: number) => boolean {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = SIZE
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return () => true
    ctx.font = '28px sans-serif'
    ctx.textBaseline = 'middle'
    const refWidth = ctx.measureText('\u{1F600}').width

    const renders = (text: string) => {
      if (text.includes('\u200D') && ctx.measureText(text).width > refWidth * 1.5) return false
      ctx.clearRect(0, 0, SIZE, SIZE)
      ctx.fillText(text, 2, SIZE / 2)
      const d = ctx.getImageData(0, 0, SIZE, SIZE).data
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] > 128 && Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2]) > 24) return true
      }
      return false
    }

    // そもそも色付き絵文字を描けない環境では絞り込まない
    if (!renders('\u{1F600}')) return () => true

    const results = CANARIES.map(([v, e]) => [v, renders(e)] as const)
    return (version) => {
      let ok = true
      for (const [v, r] of results) {
        if (v <= version) ok = r
        else break
      }
      return ok
    }
  } catch {
    return () => true
  }
}

export const isSupported = createChecker()

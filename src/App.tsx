import { useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks'
import data from './data/emoji.json'
import { copyText } from './lib/clipboard'
import { normQuery } from './lib/search'
import { isSupported } from './lib/support'

type Item = readonly [emoji: string, slack: string, search: string, group: number, version: number]
const groups = data.groups as string[]
// この環境で描画できない絵文字は最初から除外する
const items = (data.items as unknown as Item[]).filter((it) => isSupported(it[4]))

interface Pop {
  id: number
  text: string
  name: string
  x: number
  y: number
  below: boolean
}

/** 名前を "_" の位置で折り返せるようにする */
function SlackName({ name }: { name: string }) {
  const parts = name.split('_')
  return (
    <>
      {parts.map((p, i) => (
        <>
          {i > 0 && '_'}
          {i > 0 && <wbr />}
          {p}
        </>
      ))}
    </>
  )
}

export function App() {
  const [query, setQuery] = useState('')
  const [pop, setPop] = useState<Pop | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const popId = useRef(0)
  const popEl = useRef<HTMLDivElement>(null)

  const q = normQuery(query)
  const byGroup = useMemo(() => {
    const result: Item[][] = groups.map(() => [])
    for (const it of items) {
      if (!q || it[2].includes(q)) result[it[3]].push(it)
    }
    return result
  }, [q])
  // メッセージの幅は内容で変わるので、描画後に画面からはみ出さないよう補正する
  useLayoutEffect(() => {
    const el = popEl.current
    if (!el || !pop) return
    const half = el.offsetWidth / 2
    el.style.left = `${Math.min(Math.max(pop.x, half + 6), window.innerWidth - half - 6)}px`
  }, [pop])

  const total = byGroup.reduce((n, g) => n + g.length, 0)

  const onCopy = async (e: MouseEvent, emoji: string, name: string) => {
    const el = e.currentTarget as HTMLElement
    const r = el.getBoundingClientRect()
    const ok = await copyText(emoji)
    const x = r.left + r.width / 2
    const below = r.top < 90
    setPop({
      id: ++popId.current,
      text: ok ? 'コピーしました' : 'コピーできませんでした',
      name: ok ? name : '',
      x,
      y: below ? r.bottom + 4 : r.top - 4,
      below,
    })
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setPop(null), 1600)
  }

  return (
    <>
      <header class="bar">
        <input
          class="search"
          type="search"
          placeholder="検索(ねこ / heart / cry …)"
          value={query}
          onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
          aria-label="絵文字を検索"
        />
        <nav class="cats" aria-label="カテゴリ">
          {groups.map(
            (name, i) =>
              byGroup[i].length > 0 && (
                <a key={i} href={`#g${i}`}>
                  {name}
                </a>
              ),
          )}
        </nav>
      </header>

      <main>
        {total === 0 && <p class="empty">見つかりませんでした</p>}
        {groups.map(
          (name, gi) =>
            byGroup[gi].length > 0 && (
              <section key={gi}>
                <h2 id={`g${gi}`} class="band">
                  {name}
                </h2>
                <div class="grid">
                  {byGroup[gi].map((it) => (
                    <button key={it[0]} class="cell" type="button" onClick={(e) => onCopy(e, it[0], it[1])}>
                      <span class="emoji">{it[0]}</span>
                      <span class="name">{it[1] && <SlackName name={it[1]} />}</span>
                    </button>
                  ))}
                </div>
              </section>
            ),
        )}
      </main>

      <footer class="foot">
        <a href="https://github.com/ttsukasan/emoji-shelf" target="_blank" rel="noopener noreferrer">
          ttsukasan/emoji-shelf
        </a>
      </footer>

      {pop && (
        <div
          key={pop.id}
          ref={popEl}
          class={`pop${pop.below ? ' below' : ''}`}
          style={{ left: `${pop.x}px`, top: `${pop.y}px` }}
          role="status"
        >
          <span>{pop.text}</span>
          {pop.name && <span class="pop-name">:{pop.name}:</span>}
        </div>
      )}
    </>
  )
}

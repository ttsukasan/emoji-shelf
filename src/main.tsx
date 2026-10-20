import { render } from 'preact'
import { App } from './App'
import './style.css'

render(<App />, document.getElementById('app')!)

// オーバースクロールの下地色: 最上部ではページ色、それ以外(=下端を引っ張る時)はフッター色
const root = document.documentElement
const syncOverscrollColor = () => {
  root.style.backgroundColor = window.scrollY > 0 ? 'var(--foot-bg)' : 'var(--bg)'
}
window.addEventListener('scroll', syncOverscrollColor, { passive: true })
syncOverscrollColor()

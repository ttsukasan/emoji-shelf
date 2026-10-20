// scripts/build-data.ts の norm と同じ規則
export const norm = (s: string) =>
  s
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .replace(/_/g, ' ')

/** ":cry:" のようなコロン付き入力も受け付ける */
export const normQuery = (q: string) => norm(q).replace(/:/g, '').trim()

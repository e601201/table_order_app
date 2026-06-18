import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// app/frontend を指す絶対パス。テストからの `@/` / `~/` エイリアス解決に使う
// （tsconfig.app.json の paths と一致させる）。
const frontend = fileURLToPath(new URL('./app/frontend', import.meta.url))

export default defineConfig({
  resolve: {
    // 先頭の `@/` `~/` だけを書き換える。`@inertiajs/...` 等の scoped package を
    // 巻き込まないよう、文字列ではなく正規表現で限定する。
    alias: [
      { find: /^@\//, replacement: `${frontend}/` },
      { find: /^~\//, replacement: `${frontend}/` },
    ],
  },
  test: {
    include: ['app/frontend/**/*.test.ts'],
  },
})

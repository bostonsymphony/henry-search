import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from "node:path"
import vueJsx from '@vitejs/plugin-vue-jsx'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueJsx()],
  build: {
    lib: {
      entry: resolve(__dirname, "src/main.js"),
      name: "HenrySearch",
      fileName: "HenrySearch",
    },
    rollupOptions: {
      external: ["vue"],
      output: {
        globals: {
          vue: "Vue",
        },
      },
    },
  },
})

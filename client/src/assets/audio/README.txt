短语出牌音效：本目录下 *.wav（与 phrase-registry 中的 key 对应）。

说明：
- 源码放在 src/assets/audio/，便于与 Vite 静态资源管线一起处理。
- 生产构建（npm run build）后，wav 会输出到 dist/assets/audio/，不再与其它 dist/assets/* 文件混在同一层（见 vite.config.ts 的 assetFileNames）。

生成方式（macOS，在项目 client 目录执行，仅需 Node、无需 tsx）：
  npm run generate:phrases
  SAY_VOICE=Mei-Jia npm run generate:phrases

常用女声语音可先查看：say -v '?'
未生成 wav 时，运行时仍会使用浏览器甜美女声 TTS 作为回退。

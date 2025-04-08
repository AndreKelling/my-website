export const srcDir = "./src/"
export const distDir = "./dist/"
export const srcAssetsDir = `${srcDir}assets/`
export const srcAssetsRootDir = `${srcDir}assets-root/`
export const srcLayoutsDir = `${srcDir}layouts/`
export const cssFilePath = `${srcAssetsDir}style.css`
export const jsFilePath = `${srcAssetsDir}main.js`
export const imageDirs = {
  src: `${srcDir}images-original/*.{jpg,png,svg}`,
  srcPreviews: `${srcDir}images-original/previews`, // preserve path for glob in image-resize.js
  srcContent: `${srcDir}images-original/content`, // preserve path for glob in image-resize.js
  dist: `${srcAssetsDir}images`,
  distPreviews: `${srcAssetsDir}images/previews`,
  distContent: `${srcAssetsDir}images/content`
}

export const svgSymbolsPath = `${srcLayoutsDir}svg-symbols.svg`
export const criticalCssPath = `${srcLayoutsDir}critical.css`

export const browserSyncPort = 3030 // 3030 to not disturb may open 3000 port

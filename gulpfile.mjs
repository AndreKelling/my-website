import fs from "node:fs";
import { exec } from "node:child_process";
import gulp from "gulp";
import imagemin from "imagemin";
import svgmin from "gulp-svgmin";
import svgSymbols from "gulp-svg-symbols";
import imageminJpegRecompress from "imagemin-jpeg-recompress";
import imageminPngquant from "imagemin-pngquant";

const production = process.env.NODE_ENV === "production";
// const production = false;

import browserify from "browserify";
import babelify from "babelify";
import source from "vinyl-source-stream";
import buffer from "vinyl-buffer";
import uglify from "gulp-uglify";
import * as dartSass from 'sass'
import gulpSass from 'gulp-sass';
const sass = gulpSass(dartSass);
import sourcemaps from "gulp-sourcemaps";
import autoprefixer from "autoprefixer";
import postcss from "gulp-postcss";
import cssnano from "cssnano";
import noop from "gulp-noop";
import browserSync from "browser-sync";
const bs = browserSync.create();
import { srcLayoutsDir, criticalCssPath, browserSyncPort, srcDir, srcAssetsRootDir, srcAssetsDir, imageDirs } from "./config.mjs";

const svgOriginalFiles = `${srcDir}svg-original/**/*`
const outputDir = srcAssetsDir

const paths = {
  styles: {
    src: `${srcDir}scss/style.scss`,
    watchSrc: `${srcDir}scss/**/*.scss`
  },
  scripts: {
    entries: [`${srcDir}js/app.entry.js`],
    src: [`${srcDir}js/**/*.js`]
  },
  site: [
    `${srcDir}assets/**/*`,
    `${srcDir}assets-root/**/*`,
    `${srcDir}content/**/*`,
    `${srcDir}layouts/**/*`,
    `${srcDir}metadata/**/*`
  ]
}

/** JS * */

export const scripts = () =>
  browserify({
    entries: [paths.scripts.entries],
    transform: [
      babelify.configure({
        presets: ["@babel/preset-env"],
        sourceMaps: !production
      })
    ]
  })
    .bundle()
    .pipe(source("main.js"))
    .pipe(buffer())
    .pipe(!production ? sourcemaps.init({ loadMaps: true }) : noop())
    .pipe(production ? uglify() : noop())
    .pipe(!production ? sourcemaps.write(".") : noop())
    .pipe(gulp.dest(outputDir))

/** CSS * */

const postCssPlugins = [
  autoprefixer({
    cascade: false
  }),
  production ? cssnano() : false
].filter(Boolean)

// CSS needs to go after svg icons, so it can use the svg icons scss
export const css = () =>
  gulp
    .src(paths.styles.src)
    .pipe(!production ? sourcemaps.init({ loadMaps: true }) : noop())
    .pipe(sass().on("error", sass.logError))
    .pipe(postcss(postCssPlugins))
    .pipe(!production ? sourcemaps.write(".") : noop())
    .pipe(gulp.dest(srcAssetsDir))

export const stylelint = (done) => {
  exec(`stylelint ${paths.styles.watchSrc}`, (err, stdout, stderr) => {
    console.log(stdout)
    console.log(stderr)
    done(err)
  })
}

/** images * */
const imagesRoot = async () => {
  await imagemin([imageDirs.src], {
    destination: imageDirs.dist,
    plugins: [
      imageminJpegRecompress({
        loops: 4,
        min: 50,
        max: 95,
        quality: "high"
      }),
      imageminPngquant()
    ],
  });
}
const imagesPreview = (done) =>
  exec(`node image-resize.mjs ${imageDirs.srcPreviews} ${imageDirs.distPreviews} 170`, (err, stdout, stderr) => {
    console.log(stdout)
    console.log(stderr)
    done(err)
  })
const imagesContentResize444 = (done) =>
  exec(`node image-resize.mjs ${imageDirs.srcContent} ${imageDirs.distContent} 444 -md`, (err, stdout, stderr) => {
    console.log(stdout)
    console.log(stderr)
    done(err)
  })
const imagesContentResize888 = (done) =>
  exec(`node image-resize.mjs ${imageDirs.srcContent} ${imageDirs.distContent} 888 -lg`, (err, stdout, stderr) => {
    console.log(stdout)
    console.log(stderr)
    done(err)
  })

// parallel
export const images = gulp.series(
  imagesRoot,
  imagesPreview,
  imagesContentResize444,
  imagesContentResize888
)

/** svg symbols * */

// SVG icons needs to go before CSS, so it can use the svg icons scss
export const svgsymbols = () =>
  gulp
    .src(svgOriginalFiles)
    .pipe(svgmin())
    .pipe(
      svgSymbols({
        svgAttrs: {
          class: "svg-icon-lib"
        },
        templates: ["default-svg", "default-scss"],
        id: "icon-%f",
        class: ".icon-%f",
        title: "Icon %f"
      })
    )
    .pipe(gulp.dest(srcLayoutsDir))

/**
 * metalsmith build
 *
 * does clean up the dir!
 * copies to ./dist
 * */

const buildMetalsmith = (done) => {
  exec("node metalsmith.mjs", (err, stdout, stderr) => {
    console.log(stdout)
    console.log(stderr)
    done(err)
  })
}

/**
 * critical css
 *
 * needs to run when serving
 * */

const removeCriticalCss = (done) => {
  console.log(criticalCssPath)
  try {
    fs.unlinkSync(criticalCssPath)
  } catch (err) {
    console.log(err.message)
  } finally {
    done()
  }
}

const criticalCss = (done) => {
  exec("env DEBUG='penthouse,penthouse:*' node penthouse.config.mjs", (err, stdout, stderr) => {
    console.log(stdout)
    console.log(stderr)
    done(err)
  })
}

const serve = (done) => {
  bs.init({
    server: {
      baseDir: "./dist"
    },
    port: browserSyncPort,
    open: false
  })
  done()
}
const serveStop = (done) => {
  bs.exit()
  done()
}

/** build * */

export const build = gulp.series(gulp.parallel(scripts, images, svgsymbols), css, buildMetalsmith)

export const buildProd = gulp.series(
  (done) => {
    console.log("gulp production:", production)
    done()
  },
  removeCriticalCss,
  build,
  serve,
  criticalCss,
  serveStop,
  build
)

/** watch * */

export const watch = () => {
  build()

  gulp.watch(paths.site, buildMetalsmith)

  // TODO just copy new build artifacts (styles, scripts, images) to dist. not whole metalsmith build
  gulp.watch(paths.styles.watchSrc, gulp.series(stylelint, css, buildMetalsmith))

  gulp.watch(paths.scripts.src, gulp.series(scripts, buildMetalsmith))

  gulp.watch([imageDirs.src, imageDirs.srcPreviews, imageDirs.srcContent], gulp.series(images, buildMetalsmith))
}

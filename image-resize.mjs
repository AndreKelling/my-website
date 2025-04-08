import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { glob } from "glob";

const dir = process.argv[2];
const dist = process.argv[3];
const size = Number.parseInt(process.argv[4]);
const suffix = process.argv[5] || "";

/**
 * used in gulp for resizing images to assets build dir
 *
 * @param {string} dir source dir
 * @param {string} dist destination dir. assets dir
 * @param {number} size image cropping size in px
 * @param {string} suffix addition to image name
 */
glob(`${dir}/**/*.{jpg,png}`, (err, files) => {
  if (err != null) {
    throw err;
  }
  fs.mkdirSync(dist, { recursive: true });
  for (const inputFile of files) {
    sharp(inputFile)
      .resize(size, size, { fit: "inside" })
      .webp({ quality: 77, force: true })
      .toFile(path.join(dist, `${path.basename(inputFile, path.extname(inputFile)) + suffix}.webp`), (err, info) => {
        if (err === null) {
          console.log(`successfully compressed ${inputFile} to ${info.format} in size ${info.width}px`);
        } else {
          throw err
         }
      });
  }
}).catch(err => console.log(err));

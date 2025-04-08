import sharp from "sharp";
import path from "node:path";
import { glob } from "glob";

/**
 * used in gulp for handling images to assets build dir
 * resizing and reformatting to webp format
 *
 * @param {string} dir source dir
 * @param {string} dist destination dir. assets dir
 * @param {number} size image cropping size in px
 * @param {string} suffix addition to image name
 */
export default function imageResize(dir, dist, size, suffix = '') {
  glob(`${dir}/*.{jpg,png}`).then((images) => {
    for (const inputFile of images) {
      sharp(inputFile)
        .resize(size, size, { fit: "inside" })
        .webp({ quality: 77, force: true })
        .toFile(path.join(dist, `${path.basename(inputFile, path.extname(inputFile)) + suffix}.webp`), (err, info) => {
          if (err === null) {
            console.log(`successfully compressed ${inputFile} to ${info.format} in size ${info.width}px`);
          } else {
            console.error(err)
          }
        });
    }
  }).catch((err) => console.error(err));
}

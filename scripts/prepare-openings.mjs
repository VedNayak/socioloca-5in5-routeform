import sharp from "sharp";
import { stat } from "node:fs/promises";
const base =
  "C:/Users/Vedavyas Nayak/.codex/generated_images/01a12caa-d2ec-7de3-a45b-eafabac8b3b5";
const entries = [
  ["services", "exec-ec51afee-6653-47f7-8a3b-38d6e6b96c12.png", "right"],
  ["industries", "exec-b2eeae7d-a4ad-4432-aedc-2eb5931065d9.png", "left"],
  ["about", "exec-638b2563-9f37-4078-a1ff-1e43e45a7eb6.png", "centre"],
  ["quote", "exec-04088e94-705c-48a3-9858-2fb0449cf9fb.png", "right"],
];
for (const [name, source, position] of entries) {
  const input = `${base}/${source}`;
  for (const format of ["webp", "avif"]) {
    const full = `public/images/opening-${name}.${format}`;
    const mobile = `public/images/opening-${name}-mobile.${format}`;
    await sharp(input)
      .resize({ width: 1600 })
      .toFormat(format, { quality: format === "avif" ? 52 : 82 })
      .toFile(full);
    await sharp(input)
      .resize({ width: 720, height: 1000, fit: "cover", position })
      .toFormat(format, { quality: format === "avif" ? 48 : 78 })
      .toFile(mobile);
    console.log(
      full,
      (await stat(full)).size,
      mobile,
      (await stat(mobile)).size,
    );
  }
}

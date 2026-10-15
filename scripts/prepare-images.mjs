import sharp from "sharp";
import { join } from "node:path";
const root =
  "C:/Users/Vedavyas Nayak/.codex/generated_images/01a12caa-d2ec-7de3-a45b-eafabac8b3b5";
const images = {
  port: "exec-251cea32-031c-4318-8c7a-a2ffb59a939c.png",
  air: "exec-a0d490b0-5551-4e06-acd6-46fdd73055fd.png",
  road: "exec-e0bb12a9-9a65-4010-8d90-3830ecd1ee46.png",
  warehouse: "exec-4cacd9d2-0c4c-48e7-89a7-577a166fde58.png",
  electronics: "exec-eb465567-578f-46f1-885a-d8a357748ff6.png",
  food: "exec-cf110400-548b-4828-8008-c0b31194a407.png",
  industrial: "exec-bda5b3bc-7f7f-42c2-981b-2730983c1b14.png",
};
for (const [name, file] of Object.entries(images)) {
  await sharp(join(root, file))
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(`public/images/${name}.webp`);
  await sharp(join(root, file))
    .resize({ width: 640, withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(`public/images/${name}-640.webp`);
  console.log(`Optimised ${name} with desktop and mobile derivatives.`);
}
const port = sharp(join(root, images.port));
const metadata = await port.metadata();
const cropWidth = Math.round(metadata.height * 0.54);
await port
  .extract({
    left: Math.round((metadata.width - cropWidth) * 0.62),
    top: 0,
    width: cropWidth,
    height: metadata.height,
  })
  .resize({ width: 640 })
  .webp({ quality: 82 })
  .toFile("public/images/port-mobile.webp");
console.log("Prepared a sharp portrait hero derivative for narrow screens.");
await sharp(join(root, images.port))
  .extract({
    left: Math.round((metadata.width - cropWidth) * 0.62),
    top: 0,
    width: cropWidth,
    height: metadata.height,
  })
  .resize({ width: 640 })
  .avif({ quality: 50, effort: 6 })
  .toFile("public/images/port-mobile.avif");

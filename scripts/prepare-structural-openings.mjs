import sharp from "sharp";
const sources = {
  services: "exec-6c1cfa5a-ec15-4bf1-b0d2-5a39c790875e.png",
  industries: "exec-053bb726-b276-48ee-a62b-a7549df758b7.png",
  about: "exec-73a56b9a-2d3a-4a93-b69c-73b2590d6da1.png",
  quote: "exec-2daa59a4-cc21-47e1-b5c9-ee9df25a5b9b.png",
};
const base =
  "C:/Users/Vedavyas Nayak/.codex/generated_images/01a12caa-d2ec-7de3-a45b-eafabac8b3b5";
for (const [kind, file] of Object.entries(sources)) {
  const input = await sharp(base + "/" + file)
    .resize(1600, 900, { fit: "fill" })
    .toBuffer();
  const cx = kind === "industries" ? 0.285 : kind === "about" ? 0.62 : 0.725;
  const width = 648,
    left = Math.round(
      Math.max(0, Math.min(1600 - width, cx * 1600 - width / 2)),
    );
  for (const format of ["avif", "webp"]) {
    await sharp(input)
      .toFormat(format, { quality: format === "avif" ? 53 : 82 })
      .toFile("public/images/opening-v6-" + kind + "." + format);
    await sharp(input)
      .extract({ left, top: 0, width, height: 900 })
      .resize(720, 1000)
      .toFormat(format, { quality: format === "avif" ? 49 : 78 })
      .toFile("public/images/opening-v6-" + kind + "-mobile." + format);
  }
}

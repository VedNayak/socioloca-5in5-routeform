import sharp from "sharp";
const chapters = ["cargo", "geometry", "particles", "globe"];
const tiles = await Promise.all(
  chapters.map(async (chapter, index) => ({
    input: await sharp(`docs/screenshots/v2-desktop-${chapter}.png`)
      .resize(720, 500)
      .png()
      .toBuffer(),
    left: (index % 2) * 720,
    top: Math.floor(index / 2) * 500,
  })),
);
await sharp({
  create: { width: 1440, height: 1000, channels: 3, background: "#ece9e1" },
})
  .composite(tiles)
  .png()
  .toFile("docs/preview.png");
console.log("Prepared four actual rendered states in docs/preview.png");

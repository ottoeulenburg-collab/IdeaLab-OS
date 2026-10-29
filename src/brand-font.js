// A supplied Coolvetica file is bundled locally by Vite, never fetched remotely.
// Without it, CSS first checks installed Coolvetica, then uses the local fallback.
const fontFiles = import.meta.glob("./assets/fonts/*.{woff2,woff,otf,ttf}", {
  eager: true,
  import: "default",
  query: "?url",
});

const regularFont = Object.entries(fontFiles)
  .filter(
    ([path]) =>
      /coolvetica/i.test(path) &&
      !/italic|bold|heavy|cond|comp|cram/i.test(path),
  )
  .sort(
    ([a], [b]) => Number(!a.endsWith(".woff2")) - Number(!b.endsWith(".woff2")),
  )[0];

if (regularFont) {
  const face = new FontFace("Coolvetica", `url("${regularFont[1]}")`, {
    style: "normal",
    weight: "400",
    display: "swap",
  });
  document.fonts.add(face);
  face
    .load()
    .catch(() =>
      console.warn(
        "Coolvetica konnte nicht geladen werden. Die lokale Ersatzschrift wird verwendet.",
      ),
    );
}

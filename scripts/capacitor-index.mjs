// Generates dist/client/index.html for the Capacitor APK after `vite build`.
// The SSR build does not emit a static index.html, so we create one that
// bootstraps the client entry bundle directly.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const assetsDir = join(process.cwd(), "dist/client/assets");
const files = readdirSync(assetsDir);

const css = files.find((f) => f.endsWith(".css"));
const entry = files.find(
  (f) =>
    f.endsWith(".js") &&
    readFileSync(join(assetsDir, f), "utf8").includes("hydrateRoot"),
);

if (!entry) {
  console.error("Client entry bundle not found in dist/client/assets");
  process.exit(1);
}

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>FireFame</title>
    ${css ? `<link rel="stylesheet" href="/assets/${css}" />` : ""}
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/${entry}"></script>
  </body>
</html>
`;

writeFileSync(join(process.cwd(), "dist/client/index.html"), html);
console.log(`Wrote dist/client/index.html (entry: ${entry}${css ? `, css: ${css}` : ""})`);

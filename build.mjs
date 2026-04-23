import { cpSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const rootDir = process.cwd();
const distDir = join(rootDir, "dist");
const siteEntries = ["index.html", "styles.css", "script.js", "assets"];

rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });

for (const entry of siteEntries) {
  cpSync(join(rootDir, entry), join(distDir, entry), {
    recursive: true,
  });
}

console.log("Built static site into dist/");

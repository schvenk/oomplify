import esbuild from "esbuild";
import { mkdir, rm, copyFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const watch = process.argv.includes("--watch");
const outdir = "dist";

const copyStaticFiles = async () => {
  await mkdir(outdir, { recursive: true });
  await copyFile("manifest.json", resolve(outdir, "manifest.json"));
};

await rm(outdir, { recursive: true, force: true });

const ctx = await esbuild.context({
  entryPoints: ["src/content.ts"],
  outdir,
  bundle: true,
  sourcemap: true,
  target: ["es2022"],
  format: "iife",
  platform: "browser",
});

if (watch) {
  await copyStaticFiles();
  await ctx.watch();
  console.log("Watching...");
} else {
  await ctx.rebuild();
  await copyStaticFiles();
  await ctx.dispose();
}

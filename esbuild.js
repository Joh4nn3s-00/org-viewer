const esbuild = require("esbuild");

const isWatch = process.argv.includes("--watch");

/** @type {import('esbuild').BuildOptions} */
const extensionOptions = {
  entryPoints: ["src/extension.ts"],
  bundle: true,
  outfile: "dist/extension.js",
  external: ["vscode"],
  format: "cjs",
  platform: "node",
  target: "node18",
  sourcemap: true,
  minify: !isWatch,
};

/** @type {import('esbuild').BuildOptions} */
const webviewOptions = {
  entryPoints: ["src/webview.ts"],
  bundle: true,
  outfile: "media/preview.js",
  format: "iife",
  platform: "browser",
  target: "es2020",
  sourcemap: false,
  minify: !isWatch,
};

/** @type {import('esbuild').BuildOptions} */
const testOptions = {
  entryPoints: [
    "test/suite/orgParser.test.ts",
    "test/suite/extension.test.ts",
    "test/suite/index.ts",
    "test/runTest.ts",
  ],
  bundle: true,
  outdir: "out/test",
  outbase: "test",
  external: ["vscode", "mocha", "@vscode/test-electron"],
  format: "cjs",
  platform: "node",
  target: "node18",
  sourcemap: true,
};

async function main() {
  if (isWatch) {
    const extCtx = await esbuild.context(extensionOptions);
    const webCtx = await esbuild.context(webviewOptions);
    await extCtx.watch();
    await webCtx.watch();
    console.log("Watching for changes...");
  } else {
    await Promise.all([
      esbuild.build(extensionOptions),
      esbuild.build(webviewOptions),
      esbuild.build(testOptions),
    ]);
    console.log("Build complete.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

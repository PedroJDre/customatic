// Bundles the widget into public/widget.js (+ the lazy page-capture chunk). Run: npm run widget:build
import { build } from "esbuild";

const shared = { bundle: true, minify: true, format: "iife", target: ["es2020"], legalComments: "none", logLevel: "info" };
await build({ ...shared, entryPoints: ["src/widget/widget.ts"], outfile: "public/widget.js" });
await build({ ...shared, entryPoints: ["src/widget/capture.ts"], outfile: "public/widget-capture.js" });

import { createRequire } from "node:module";

const requireFrontend = createRequire(new URL("../../frontend/package.json", import.meta.url));
const js = requireFrontend("@eslint/js");
const globals = requireFrontend("globals");

export default [
  { ignores: ["results/**"] },
  js.configs.recommended,
  { files: ["benchmark.js"], languageOptions: { sourceType: "script", globals: globals.browser } },
  { files: ["*.mjs"], languageOptions: { globals: globals.node } },
  { files: ["verify.mjs"], languageOptions: { globals: globals.browser } }
];

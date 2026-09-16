import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Next 16: `next lint` is removed — the ESLint CLI runs this flat config
// directly (`npm run lint`).
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
    // vendored agent skills — not app code
    ".agents/**",
    ".claude/**",
  ]),
]);

export default eslintConfig;

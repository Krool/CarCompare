import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Node/CommonJS data-maintenance scripts are not app code; the Next.js/TS
    // rules (e.g. no-require-imports) do not apply to them. See issue #3.
    "scripts/**",
  ]),
  // react/no-unescaped-entities is cosmetic (literal ' and " in JSX text render
  // fine). Disabled to keep lint actionable. See issue #3; revert for strict escaping.
  {
    rules: {
      "react/no-unescaped-entities": "off",
    },
  },
]);

export default eslintConfig;

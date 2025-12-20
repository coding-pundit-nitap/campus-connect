import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettierConfig from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import simpleImportSort from "eslint-plugin-simple-import-sort";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "**/*.generated.ts",
    "node_modules/**",
    "prisma/generated",
    "dist/**"
  ]),
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
      "react-hooks": reactHooks,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",

      "simple-import-sort/imports": "warn",
      "simple-import-sort/exports": "warn",
      "@typescript-eslint/no-explicit-any": "warn",

      "react/no-unescaped-entities": "off",
      "react/prop-types": "off",
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/rules-of-hooks": "error",

      "no-debugger": "error",
      "no-var": "error",
      "prefer-const": "error",
      eqeqeq: ["error", "always"],
      curly: ["error", "all"],
      "no-duplicate-imports": "error",
      "no-unused-expressions": "warn",
      "no-console": "warn",
    },
  },
  {
    files: [
      "src/app/api/**/*.{ts,tsx}",
      "src/actions/**/*.{ts,tsx}",
      "src/lib/**/*.{ts,tsx}",
      "src/repositories/**/*.{ts,tsx}",
      "src/services/**/*.{ts,tsx}",
      "src/proxy.ts",
      "prisma/**/*.ts",
    ],
    rules: {
      "no-console": "off",
    },
  },

  prettierConfig,
]);

export default eslintConfig;

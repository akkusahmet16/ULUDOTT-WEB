import { defineConfig, globalIgnores } from "eslint/config";
import nextPlugin from "@next/eslint-plugin-next";
import tseslint from "typescript-eslint";

export default defineConfig([
  ...tseslint.configs.recommended,
  {
    languageOptions: { parserOptions: { tsconfigRootDir: import.meta.dirname } },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { "@next/next": nextPlugin },
    rules: { ...nextPlugin.configs.recommended.rules, ...nextPlugin.configs["core-web-vitals"].rules },
  },
  // Kullanıcının bu dizindeki bağımsız Git checkout'u bu uygulamanın kaynağı değildir.
  globalIgnores(["ULUDOTT-WEB/**", ".next/**", ".local/**", "node_modules/**", "next-env.d.ts", "test-results/**", "playwright-report/**"]),
]);

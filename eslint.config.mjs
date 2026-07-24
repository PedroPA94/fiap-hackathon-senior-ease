import eslint from "@eslint/js";
import angular from "angular-eslint";
import expoConfig from "eslint-config-expo/flat.js";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
  globalIgnores([
    "**/node_modules/**",
    "**/dist/**",
    "**/coverage/**",
    "**/.angular/**",
    "**/.expo/**",
  ]),

  {
    files: ["packages/**/*.{js,ts}"],
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended],
  },

  {
    files: ["apps/web/**/*.ts"],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "se",
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "se",
          style: "kebab-case",
        },
      ],
    },
  },

  {
    files: ["apps/web/**/*.html"],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
  },

  {
    files: ["apps/mobile/**/*.{js,jsx,ts,tsx}"],
    extends: [expoConfig],
  },
);

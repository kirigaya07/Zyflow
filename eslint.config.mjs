import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ESLint disabled: no extends, no rules
const eslintConfig = [
  {
    ignores: ["**/*"], // Ignore every file — full ESLint disable
  },
];

export default eslintConfig;

import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["**/*.css"], // Применяем правила только к CSS-файлам
    rules: {
      // Игнорируем неизвестные директивы @tailwind и @apply в CSS
      "css/unknownAtRules": ["off", { allow: ["tailwind", "apply"] }],
    },
  },
];

export default eslintConfig;
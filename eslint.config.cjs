const eslint = require("@eslint/js");
const reactPlugin = require("eslint-plugin-react");

module.exports = [
  eslint.configs.recommended,
  {
    plugins: {
      react: reactPlugin,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        window: "readonly",
      },
    },
    settings: {
      react: {
        version: "19.0",
      },
    },
    rules: {
      "no-unused-vars": "off",
      "no-case-declarations": "off",
      "no-empty": "warn",
      "no-fallthrough": "warn",
      "react/prop-types": 0,
      // ...reactPlugin.configs.recommended.rules,
    },
  },
];

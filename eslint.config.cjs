const eslint = require("@eslint/js");
const reactPlugin = require("eslint-plugin-react");
const globals = require("globals");

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
        ...globals.browser,
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

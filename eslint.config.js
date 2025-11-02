// https://docs.expo.dev/guides/using-eslint/
const expoConfig = require("eslint-config-expo/flat");

/** @type {import('eslint').Linter.FlatConfig[]} */
module.exports = [
  // Start with the Expo config
  expoConfig,
  // Add your custom rules and settings
  {
    rules: {
      // You can add or override rules here
      // e.g., "react/prop-types": "off"
    },
    settings: {
      "import/resolver": {
        node: {
          extensions: [".js", ".jsx", ".ts", ".tsx"],
        },
        // This alias config helps eslint-plugin-import understand your path aliases
        alias: {
          map: [
            ["@", "./"],
            ["@env", "./"], // Assuming you might use this for environment variables
          ],
          extensions: [".js", ".jsx", ".ts", ".tsx"],
        },
      },
    },
  },
];

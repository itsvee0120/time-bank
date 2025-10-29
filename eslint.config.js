// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
]);
module.exports = {
  root: true,
  extends: ["universe/native", "plugin:react/recommended"],
  settings: {
    "import/resolver": {
      node: {
        extensions: [".js", ".jsx", ".ts", ".tsx"],
      },
      alias: {
        map: [["@env", "./"]],
        extensions: [".js", ".jsx", ".ts", ".tsx"],
      },
    },
  },
};

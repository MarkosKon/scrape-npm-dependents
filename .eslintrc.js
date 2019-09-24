module.exports = {
  env: {
    commonjs: true,
    es6: true,
    node: true,
    "jest/globals": true
  },
  extends: [
    "airbnb-base",
    "plugin:prettier/recommended",
    "plugin:node/recommended",
    "plugin:jest/recommended"
  ],
  plugins: ["jest"],
  globals: {
    Atomics: "readonly",
    SharedArrayBuffer: "readonly"
  },
  parserOptions: {
    ecmaVersion: 2018
  },
  rules: {}
};

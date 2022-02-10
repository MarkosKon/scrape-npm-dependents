module.exports = {
  env: {
    commonjs: true,
    es6: true,
    node: true,
    "jest/globals": true,
  },
  extends: [
    "plugin:jest/recommended",
    "plugin:node/recommended",
    "airbnb-base",
    "plugin:prettier/recommended",
  ],
  globals: {
    Atomics: "readonly",
    SharedArrayBuffer: "readonly",
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  rules: { "no-console": "off", "no-process-exit": "off" },
};

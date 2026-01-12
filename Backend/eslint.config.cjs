// ESLint flat config for Backend (Node/Express)
// CommonJS export for ESLint v8 compatibility on Node CJS projects

module.exports = [
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "commonjs",
      globals: {
        process: "readonly",
        __dirname: "readonly",
        module: "readonly",
        require: "readonly",
        console: "readonly",
        Buffer: "readonly"
      }
    },
    rules: {
      // Platform/style
      "linebreak-style": "off",
      "indent": ["warn", 2, { SwitchCase: 1 }],
      "comma-dangle": ["warn", "only-multiline"],

      // Express Router capitalization nuance
      "new-cap": [
        "error",
        { newIsCap: true, capIsNew: false, capIsNewExceptions: ["Router"] }
      ],

      // Practical relaxations for existing code
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "require-await": "off",
      "no-empty": ["warn", { allowEmptyCatch: true }],
      "radix": "off",
      "no-useless-escape": "warn",
      "brace-style": "warn"
    }
  }
];



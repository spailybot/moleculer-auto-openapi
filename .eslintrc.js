module.exports = {
    parser: '@typescript-eslint/parser', // Specifies the ESLint parser
    extends: [
        'plugin:prettier/recommended',
        'prettier'
    ],
    parserOptions: {
        ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
        sourceType: 'module' // Allows for the use of imports
    },
    ignorePatterns: ["*.hbs", "*.md"],
    rules: {
        camelcase: 'off',
        '@typescript-eslint/camelcase': 'off',
        '@typescript-eslint/interface-name-prefix': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
        indent: 'off', //prettier take it in charge
        "@typescript-eslint/no-object-literal-type-assertion": 'off',
        "@typescript-eslint/no-inferrable-types": 'off',
        '@typescript-eslint/ban-ts-ignore': 'off'
    }
};

import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';
import tsParser from '@typescript-eslint/parser';

export default [
    {
        ignores: ['*.hbs', '*.md']
    },
    {
        files: ['src/**/*.{ts,mts,cts}'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 2018,
                sourceType: 'module'
            }
        },
        rules: {
            camelcase: 'off',
            '@typescript-eslint/camelcase': 'off',
            '@typescript-eslint/interface-name-prefix': 'off',
            '@typescript-eslint/ban-ts-comment': 'off',
            indent: 'off',
            '@typescript-eslint/no-object-literal-type-assertion': 'off',
            '@typescript-eslint/no-inferrable-types': 'off',
            '@typescript-eslint/ban-ts-ignore': 'off'
        }
    },
    eslintPluginPrettier
];

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierPlugin from 'eslint-plugin-prettier';
import stylisticTs from '@stylistic/eslint-plugin'

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    {
        plugins: {
            "@typescript-eslint/eslint-plugin": tseslint.plugin,
            "prettier": prettierPlugin,
            '@stylistic/ts': stylisticTs
        },
        languageOptions: {
            globals: {
                node: true,
                es2020: true,
                mocha: true,
            },
            parserOptions: {
                ecmaVersion: 2020,
                sourceType: "module",
                project: "./tsconfig.json",
            },
            parser: tseslint.parser,
        },
        rules: {
            "prettier/prettier": ["error", {
                "printWidth": 80,
                "tabWidth": 2,
                "useTabs": false,
                "semi": true,
                "singleQuote": false,
                "trailingComma": "es5",
                "bracketSpacing": true,
                "arrowParens": "always",
                "endOfLine": "lf",
                "importOrderParserPlugins" : ["classProperties", "decorators-legacy", "typescript", "jsx", "tsx"],
                "importOrder": ["<THIRD_PARTY_MODULES>", "^@aero(.*)$", "^@app/(.*)$",  "^@(.*)$", "^[./]"],
                "importOrderSeparation": true,
                "importOrderSortSpecifiers": true,
                "plugins": ["@trivago/prettier-plugin-sort-imports"]
            }],
            semi: ["off"],
            eqeqeq: "error",
            quotes: "off",
            "@typescript-eslint/prefer-for-of": "off",
            "@typescript-eslint/no-unsafe-member-access": "off",
            "@typescript-eslint/no-unsafe-argument": "off",
            "@typescript-eslint/no-unsafe-assignment": "off",
            "@typescript-eslint/no-unsafe-call": "off",
            "@typescript-eslint/no-unsafe-declaration-merging": "off",
            "@typescript-eslint/no-unsafe-enum-comparison": "off",
            "@typescript-eslint/no-unsafe-return": "off",
            "@typescript-eslint/no-unsafe-unary-minus": "off",
            "prefer-const": "error",
            // "no-console": "error",
            "linebreak-style": ["error", "unix"],
            "comma-dangle": ["error", "only-multiline"],
            // do not allow relative path import. only import from @app/*
            // "no-restricted-imports": ["error", { patterns: ["./*", "../*"] }],
            "@typescript-eslint/explicit-function-return-type": [
                "error",
                { allowExpressions: true },
            ],
            "@typescript-eslint/no-explicit-any": "error",
            "@stylistic/ts/semi": ["error", "always"],
            "@typescript-eslint/no-non-null-assertion": "error",
            "@typescript-eslint/explicit-member-accessibility": ["error"],
            "@typescript-eslint/no-inferrable-types": [
                "error",
                {
                    ignoreParameters: false,
                },
            ],
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    caughtErrorsIgnorePattern: "^_",
                },
            ],
            // "@typescript-eslint/member-ordering": ["error"],
            "@typescript-eslint/interface-name-prefix": "off",
            "@typescript-eslint/explicit-module-boundary-types": "off",
            "@typescript-eslint/no-unnecessary-type-assertion": ["error"],
            "@typescript-eslint/naming-convention": [
                "error",
                {
                    selector: [
                        "variable",
                        "classProperty",
                        "function",
                        "parameter",
                        "typeProperty",
                        "parameterProperty",
                        "classMethod",
                        "objectLiteralMethod",
                        "typeMethod",
                        "accessor",
                    ],
                    format: ["camelCase"],
                    leadingUnderscore: "allow",
                },
                {
                    selector: [
                        "class",
                        "interface",
                        "enum",
                        "enumMember",
                        "typeAlias",
                        "typeParameter",
                    ],
                    format: ["PascalCase"],
                },
            ],
        }
    }
);

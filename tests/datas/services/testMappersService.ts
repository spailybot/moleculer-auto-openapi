export const testMappersService = {
    name: 'tests-mappers',
    settings: {
        rest: '/tests'
    },
    actions: {
        simple: {
            rest: 'POST /simple',
            params: {
                any: {
                    type: 'any'
                },
                array: {
                    type: 'array'
                },
                boolean: {
                    type: 'boolean'
                },
                class: {
                    type: 'class',
                    instanceOf: Buffer
                },
                currency: {
                    type: 'currency'
                },
                date: {
                    type: 'date'
                },
                email: {
                    type: 'email'
                },
                enum: {
                    type: 'enum',
                    values: ['admin', 'user', 'guest']
                },
                equal: {
                    type: 'equal'
                },
                forbidden: {
                    type: 'forbidden'
                },
                function: {
                    type: 'function'
                },
                luhn: {
                    type: 'luhn'
                },
                mac: {
                    type: 'mac'
                },
                multi: {
                    type: 'multi',
                    rules: [{ type: 'string' }, { type: 'boolean' }]
                },
                number: {
                    type: 'number'
                },
                object: {
                    type: 'object'
                },
                objectID: {
                    type: 'objectID'
                },
                record: {
                    type: 'record'
                },
                string: {
                    type: 'string'
                },
                tuple: {
                    type: 'tuple'
                },
                url: {
                    type: 'url'
                },
                uuid: {
                    type: 'uuid'
                },
                custom: {
                    type: 'custom'
                }
            },
            handler() {}
        },
        any: {
            rest: 'POST /any',
            params: {
                normal: {
                    type: 'any'
                },
                shortHand: {
                    type: 'any'
                }
            },
            handler() {}
        },
        array: {
            rest: 'POST /array',
            params: {
                normal: {
                    type: 'array'
                },
                shortHand: 'array',
                withEmpty: {
                    type: 'array',
                    empty: true
                },
                withMin: {
                    type: 'array',
                    min: 1
                },
                withMax: {
                    type: 'array',
                    max: 1
                },
                withLength: {
                    type: 'array',
                    length: 1
                },
                withContains: {
                    type: 'array',
                    contains: ['test']
                },
                withUnique: {
                    type: 'array',
                    unique: true
                },
                withEnum: {
                    type: 'array',
                    enum: ['test']
                },
                withItems: {
                    type: 'array',
                    items: { type: 'string' }
                },
                withConvert: {
                    type: 'array',
                    convert: true
                }
            },
            handler() {}
        },
        boolean: {
            rest: 'POST /boolean',
            params: {
                normal: {
                    type: 'boolean'
                },
                shortHand: 'boolean',
                withConvert: {
                    type: 'boolean',
                    convert: true
                }
            },
            handler() {}
        },
        strings: {
            rest: 'POST /strings',
            params: {
                normal: {
                    type: 'string'
                },
                shortHand: 'string',
                allowEmpty: {
                    type: 'string',
                    empty: true
                },
                withMin: {
                    type: 'string',
                    min: 5
                },
                withMax: {
                    type: 'string',
                    max: 10
                },
                withLength: {
                    type: 'string',
                    length: 10
                },
                withPattern: {
                    type: 'string',
                    pattern: /^[a-z]+$/
                },
                withContains: {
                    type: 'string',
                    contains: 'test'
                },
                withEnum: {
                    type: 'string',
                    enum: ['option1', 'option2', 'option3']
                },
                withAlpha: {
                    type: 'string',
                    alpha: true
                },
                withNumeric: {
                    type: 'string',
                    numeric: true
                },
                withAlphanum: {
                    type: 'string',
                    alphanum: true
                },
                withAlphadash: {
                    type: 'string',
                    alphadash: true
                },
                withHex: {
                    type: 'string',
                    hex: true
                },
                withSingleLine: {
                    type: 'string',
                    singleLine: true
                },
                withBase64: {
                    type: 'string',
                    base64: true
                },
                withTrim: {
                    type: 'string',
                    trim: true
                },
                withTrimLeft: {
                    type: 'string',
                    trimLeft: true
                },
                withTrimRight: {
                    type: 'string',
                    trimRight: true
                },
                withPadStart: {
                    type: 'string',
                    padStart: 5
                },
                withPadEnd: {
                    type: 'string',
                    padEnd: 5
                },
                withPadChar: {
                    type: 'string',
                    padChar: '*'
                },
                withLowerCase: {
                    type: 'string',
                    lowercase: true
                },
                withUpperCase: {
                    type: 'string',
                    uppercase: true
                },
                withLocaleLowerCase: {
                    type: 'string',
                    localeLowercase: true
                },
                withLocaleUpperCase: {
                    type: 'string',
                    localeUppercase: true
                },
                withConvert: {
                    type: 'string',
                    convert: true
                }
            },
            handler() {}
        }
    }
};

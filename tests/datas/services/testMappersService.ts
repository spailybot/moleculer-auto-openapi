import {
    RuleAny,
    RuleArray,
    RuleBoolean,
    RuleClass,
    RuleCurrency,
    RuleCustom,
    RuleCustomInline,
    RuleDate,
    RuleEmail,
    RuleEnum,
    RuleEqual,
    RuleForbidden,
    RuleFunction,
    RuleLuhn,
    RuleMac,
    RuleMulti,
    RuleNumber,
    RuleObject,
    RuleObjectID,
    RuleRecord,
    RuleString,
    RuleTuple,
    RuleURL,
    RuleUUID
} from 'fastest-validator';

type paramsOf<T extends RuleCustom> = Record<string, T> | { shortHand: `${T['type']}${string}` };

type tParams = {
    any: paramsOf<RuleAny>;
    array: paramsOf<RuleArray>;
    boolean: paramsOf<RuleBoolean>;
    class: paramsOf<RuleClass>;
    currency: paramsOf<RuleCurrency>;
    date: paramsOf<RuleDate>;
    email: paramsOf<RuleEmail>;
    enum: paramsOf<RuleEnum>;
    equal: paramsOf<RuleEqual>;
    forbidden: paramsOf<RuleForbidden>;
    function: paramsOf<RuleFunction>;
    luhn: paramsOf<RuleLuhn>;
    mac: paramsOf<RuleMac>;
    multi: paramsOf<RuleMulti>;
    number: paramsOf<RuleNumber>;
    object: paramsOf<RuleObject>;
    record: paramsOf<RuleRecord>;
    strings: paramsOf<RuleString>;
    tuple: paramsOf<RuleTuple>;
    url: paramsOf<RuleURL>;
    uuid: paramsOf<RuleUUID>;
    objectId: paramsOf<RuleObjectID>;
    custom: paramsOf<RuleCustomInline>;
};

const params: tParams = {
    any: {
        normal: {
            type: 'any'
        },
        shortHand: 'any',
        withDefault: {
            type: 'any',
            default: 'test'
        }
    },
    array: {
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
        },
        withDefault: {
            type: 'array',
            default: ['test1', 'test2']
        }
    },
    boolean: {
        normal: {
            type: 'boolean'
        },
        shortHand: 'boolean',
        withConvert: {
            type: 'boolean',
            convert: true
        },
        withDefault: {
            type: 'boolean',
            default: [true]
        }
    },
    class: {
        normal: {
            type: 'class',
            instanceOf: Buffer
        },
        shortHand: 'class|instanceOf:Buffer',
        withDefault: {
            type: 'class',
            instanceOf: Buffer,
            default: Buffer.from('test')
        }
    },
    currency: {
        normal: {
            type: 'currency'
        },
        shortHand: 'currency',
        withConvert: {
            type: 'currency',
            convert: true
        },
        withDefault: {
            type: 'currency',
            default: '$12,222.2'
        },
        withCurrencySymbol: {
            type: 'currency',
            currencySymbol: '$'
        },
        withSymbolOptional: {
            type: 'currency',
            currencySymbol: '$',
            symbolOptional: true
        },
        withThousandSeparator: {
            type: 'currency',
            thousandSeparator: ' '
        },
        withDecimalSeparator: {
            type: 'currency',
            decimalSeparator: ','
        },
        withCustomRegex: {
            type: 'currency',
            customRegex: /[a-z]/i
        }
    },
    date: {
        normal: {
            type: 'date',
            convert: true
        },
        shortHand: 'date|convert',
        withoutConvert: {
            type: 'date'
        },
        withDefault: {
            type: 'date',
            convert: true,
            default: '1998-01-10T13:00:00.000Z'
        }
    },
    email: {
        normal: {
            type: 'email'
        },
        shortHand: 'email',
        withDefault: {
            type: 'email',
            default: 'email@foobar.com'
        },
        withEmpty: {
            type: 'email',
            empty: true
        },
        withMode: {
            type: 'email',
            mode: 'precise'
        },
        withNormalize: {
            type: 'email',
            normalize: true
        },
        withMin: {
            type: 'email',
            min: 1
        },
        withMax: {
            type: 'email',
            max: 5
        }
    },
    enum: {
        normal: {
            type: 'enum',
            values: ['test1', 'test2', 'test3']
        }
    },
    equal: {
        // @ts-expect-error
        fake: 'email',
        normal: {
            type: 'equal'
        },
        withDefault: {
            type: 'equal',
            value: 'test',
            default: 'test'
        },
        withValue: {
            type: 'equal',
            value: 'test'
        },
        withField: {
            type: 'equal',
            field: 'fake'
        },
        withStrict: {
            type: 'equal',
            strict: true,
            value: 2
        }
    },
    forbidden: {
        normal: {
            type: 'forbidden'
        },
        shortHand: 'forbidden'
    },
    function: {
        normal: {
            type: 'function'
        },
        shortHand: 'function'
    },
    luhn: {
        normal: {
            type: 'luhn'
        },
        shortHand: 'luhn',
        withDefault: {
            type: 'luhn',
            default: '4242424242424242'
        }
    },
    mac: {
        normal: {
            type: 'mac'
        },
        shortHand: 'mac',
        withDefault: {
            type: 'mac',
            default: '00:B0:D0:63:C2:26'
        }
    },
    multi: {
        normal: {
            type: 'multi',
            rules: ['string']
        },
        withDefault: {
            type: 'multi',
            rules: ['string'],
            default: 'test'
        }
    },
    number: {
        normal: {
            type: 'number'
        },
        shortHand: 'number',
        withDefault: {
            type: 'number',
            default: 1
        },
        withMin: {
            type: 'number',
            min: 1
        },
        withMax: {
            type: 'number',
            max: 5
        },
        withEqual: {
            type: 'number',
            equal: 2
        },
        withNotEqual: {
            type: 'number',
            notEqual: 2
        },
        withInteger: {
            type: 'number',
            integer: true
        },
        withPositive: {
            type: 'number',
            positive: true
        },
        withNegative: {
            type: 'number',
            negative: true
        },
        withConvert: {
            type: 'number',
            convert: true
        }
    },
    object: {
        normal: {
            type: 'object'
        },
        shortHand: 'object',
        withDefault: {
            type: 'object',
            default: { foo: 'bar' }
        },
        withStrict: {
            type: 'object',
            strict: true
        },
        withProperties: {
            type: 'object',
            properties: {
                num: 'number'
            }
        },
        withProps: {
            type: 'object',
            props: {
                num: 'number'
            }
        },
        withMinProps: {
            type: 'object',
            minProps: 1
        },
        withMaxProps: {
            type: 'object',
            maxProps: 2
        }
    },
    record: {
        normal: {
            type: 'record'
        },
        shortHand: 'record',
        withDefault: {
            type: 'record',
            default: { foo: 'bar' }
        },
        withKey: {
            type: 'record',
            key: {
                type: 'string'
            }
        },
        withValue: {
            type: 'record',
            value: { type: 'number' }
        }
    },
    strings: {
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
    tuple: {
        normal: {
            type: 'tuple'
        },
        shortHand: 'tuple',
        withDefault: {
            type: 'tuple',
            default: [1, 'test']
        },
        withEmpty: {
            type: 'tuple',
            empty: true
        },
        withItems: {
            type: 'tuple',
            items: [
                {
                    type: 'object',
                    properties: {
                        num: 'number'
                    }
                },
                { type: 'string' }
            ]
        }
    },
    url: {
        normal: {
            type: 'url'
        },
        shortHand: 'url',
        withDefault: {
            type: 'url',
            default: 'https://mysite.com'
        },
        withEmpty: {
            type: 'url',
            empty: true
        }
    },
    uuid: {
        normal: {
            type: 'uuid'
        },
        shortHand: 'uuid',
        withDefault: {
            type: 'uuid',
            default: '6a6e3331-4e5f-4c5b-9b78-782d60426cc6'
        },
        withVersion0: {
            type: 'uuid',
            version: 0
        },
        withVersion1: {
            type: 'uuid',
            version: 1
        },
        withVersion2: {
            type: 'uuid',
            version: 2
        },
        withVersion3: {
            type: 'uuid',
            version: 3
        },
        withVersion4: {
            type: 'uuid',
            version: 4
        },
        withVersion5: {
            type: 'uuid',
            version: 5
        },
        withVersion6: {
            type: 'uuid',
            version: 6
        }
    },
    objectId: {
        normal: {
            type: 'objectID'
        },
        shortHand: 'objectID',
        withDefault: {
            type: 'objectID',
            default: '507f1f77bcf86cd799439012'
        },
        withConvert: {
            type: 'objectID',
            convert: true
        }
    },
    custom: {
        normal: {
            type: 'custom',
            check: (value) => true
        },
        shortHand: 'custom'
    }
};

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
                    type: 'date',
                    convert: true
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
        ...Object.fromEntries(
            Object.entries(params).map(([k, v]) => {
                const params = {
                    rest: `POST /${k}`,
                    params: v,
                    handler() {}
                };
                return [k, params];
            })
        )
    }
};

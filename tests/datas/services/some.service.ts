import { ServiceSchema } from 'moleculer';

export const SomeService: ServiceSchema = {
    name: 'some',
    settings: {
        openapi: {
            tags: ['some']
        }
    },
    actions: {
        upload: {
            openapi: {
                responses: {
                    200: {
                        description: '',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        examples: [{ id: 1, filename: 'foo.txt', mimetype: 'text/plain', sizeInBytes: 100 }]
                                    }
                                }
                            }
                        }
                    },
                    400: {
                        $ref: '#/components/responses/FileNotExist'
                    },
                    401: {
                        $ref: '#/components/responses/UnauthorizedError'
                    },
                    413: {
                        $ref: '#/components/responses/FileTooBig'
                    },
                    422: {
                        $ref: '#/components/responses/ValidationError'
                    },
                    default: {
                        $ref: '#/components/responses/ServerError'
                    }
                }
            },
            handler() {}
        },
        update: {
            openapi: {
                summary: 'Foo bar baz'
            },
            params: {
                $$strict: 'remove',
                roles: { type: 'array', items: 'string', enum: ['user', 'admin'] },
                sex: { type: 'enum', values: ['male', 'female'], default: 'female' },
                id: { type: 'number', convert: true, default: 5 },
                numberBy: 'number',
                someNum: { $$oa: { description: 'Is some num' }, type: 'number', convert: true },
                types: {
                    $$oa: { description: 'Types arr' },
                    type: 'array',
                    default: [{ id: 1, typeId: 5 }],
                    length: 1,
                    items: {
                        type: 'object',
                        strict: 'remove',
                        default: { id: 1, typeId: 5 },
                        props: {
                            id: { type: 'number', optional: true },
                            typeId: { type: 'number', optional: true }
                        }
                    }
                },
                bars: {
                    $$oa: { description: 'Bars arr' },
                    type: 'array',
                    min: 1,
                    max: 2,
                    items: {
                        type: 'object',
                        strict: 'remove',
                        props: {
                            id: { type: 'number', optional: true },
                            fooNum: { $$oa: { description: 'fooNum' }, type: 'number', optional: true }
                        }
                    }
                },
                someObj: {
                    $$oa: { description: 'Some obj' },
                    default: { name: 'bar' },
                    type: 'object',
                    strict: 'remove',
                    props: {
                        id: { $$oa: { description: 'Some obj ID' }, type: 'number', optional: true },
                        numberId: { type: 'number', optional: true },
                        name: { type: 'string', optional: true, max: 100 }
                    }
                },
                someBool: { type: 'boolean', optional: true },
                desc: { type: 'string', optional: true, max: 10, min: 4 },
                email: 'email',
                date: 'date|optional|convert|min:0|max:99|default:1998-01-10T13:00:00.000Z',
                uuid: 'uuid',
                url: 'url',
                shortObject: {
                    $$type: 'object',
                    desc: { type: 'string', optional: true, max: 10000 },
                    url: 'url'
                },
                shortObject2: {
                    $$type: 'object|optional',
                    desc: { type: 'string', optional: true, max: 10000 },
                    url: 'url'
                }
            },
            handler() {}
        },
        /**
         * Action from moleculer-db mixin
         */
        find: {
            openapi: {
                parameters: [
                    {
                        name: 'version',
                        in: 'header',
                        description: 'API version',
                        required: true,
                        schema: {
                            type: 'string'
                        }
                    },
                    {
                        name: 'state',
                        in: 'cookie',
                        description: 'the state',
                        required: true,
                        schema: {
                            type: 'string'
                        }
                    }
                ]
            },
            cache: {
                keys: ['populate', 'fields', 'limit', 'offset', 'sort', 'search', 'searchFields', 'query']
            },
            params: {
                roles: { type: 'array', items: 'string', enum: ['user', 'admin'] },
                sex: { type: 'enum', values: ['male', 'female'] },
                populate: [
                    { type: 'string', optional: true },
                    { type: 'array', optional: true, items: 'string' }
                ],
                fields: [
                    { type: 'string', optional: true },
                    { type: 'array', optional: true, items: 'string' }
                ],
                limit: { type: 'number', integer: true, min: 0, optional: true, convert: true },
                offset: { type: 'number', integer: true, min: 0, optional: true, convert: true },
                sort: { type: 'string', optional: true },
                search: { type: 'string', optional: true, default: 'find me now' },
                searchFields: [
                    { type: 'string', optional: true },
                    { type: 'array', optional: true, items: 'string' }
                ],
                query: [
                    { type: 'object', optional: true },
                    { type: 'string', optional: true }
                ]
            },
            handler() {}
        },
        go: {
            openapi: {
                responses: {
                    200: {
                        description: ``,
                        content: {
                            'application/json': {
                                schema: {
                                    type: `object`,
                                    examples: [{ line: `number`, text: `string` }]
                                }
                            }
                        }
                    }
                }
            },
            params: {
                line: { type: `number` }
            },
            handler() {}
        },
        login: {
            params: {
                password: { type: 'string', min: 8, pattern: /^[a-zA-Z0-9]+$/ },
                repeatPassword: { type: 'string', min: 8, pattern: '^[a-zA-Z0-9]+$' },
                confirmPassword: { type: 'equal', field: 'password' }
            },
            handler() {}
        },
        false: {
            openapi: false,
            handler() {}
        }
    }
};

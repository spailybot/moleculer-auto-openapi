import * as moleculerWeb from 'moleculer-web';
import { ServiceSchema } from 'moleculer';
import type { ApiSettingsSchemaOpenApi } from '../../../src/types/types.js';

const ApiGateway = moleculerWeb.default;

export const ApiService = {
    name: 'api',
    mixins: [ApiGateway],
    // version: 1,
    settings: {
        port: 0,
        path: '/api',
        routes: [
            {
                path: '/test-aliases',
                aliases: {
                    health: '$node.health',
                    custom(req, res) {
                        res.writeHead(201);
                        res.end();
                    },
                    'GET multipleMethods': {
                        action: '$node.health',
                        method: 'POST'
                    },
                    'POST multipleTypes': {
                        action: 'multipart:$node.health',
                        type: 'stream',
                        method: 'POST'
                    },
                    'POST login-custom-function': {
                        handler(_, res) {
                            res.end();
                        },
                        openapi: {
                            summary: 'Login',
                            tags: ['auth'],
                            requestBody: {
                                content: {
                                    'application/json': {
                                        schema: {
                                            type: 'object',
                                            examples: [{ login: '', pass: '' }]
                                        }
                                    }
                                }
                            }
                        }
                    },
                    other: [
                        function (req, res, next) {
                            this.logger.info('Middleware 1');
                            next();
                        },
                        function (req, res, next) {
                            this.logger.info('Middleware 2');
                            next();
                        }
                    ],
                    'REST posts': 'posts'
                }
            },
            {
                path: '/base',
                aliases: {
                    'FILE /': 'some.upload',
                    'PUT upload': 'multipart:some.upload',
                    'PATCH update/:id': 'some.update',
                    'GET find': {
                        openapi: {
                            summary: 'Some find summary'
                        },
                        action: 'some.find'
                    },
                    'POST go': 'some.go',
                    'POST some-login': 'some.login'
                },
                bodyParsers: {
                    json: true,
                    urlencoded: true,
                    text: true,
                    raw: true
                }
            },
            {
                path: '/openapi',
                whitelist: ['openapi.*'],
                autoAliases: true
            },
            {
                path: '/auto-aliases-version',
                whitelist: ['v2.math.*'],
                autoAliases: true
            },
            {
                path: '/tests',
                whitelist: ['tests-mappers.*'],
                autoAliases: true
            },
            {
                openapi: {
                    tags: ['routeTag']
                },
                path: '/tests-openapi',
                aliases: {
                    'GET addTag': {
                        openapi: {
                            tags: ['aliasTagAddTag']
                        },
                        action: 'tests-openapi.addTag'
                    },
                    'GET resetTags': {
                        openapi: {
                            tags: ['aliasTagResetTags']
                        },
                        action: 'tests-openapi.resetTags'
                    },
                    'GET multipleTags': {
                        openapi: {
                            tags: ['aliasTagMultipleTags']
                        },
                        action: 'tests-openapi.multipleTags'
                    },
                    'GET responses': {
                        openapi: {},
                        action: 'tests-openapi.responses'
                    },
                    'GET response': {
                        openapi: {},
                        action: 'tests-openapi.response'
                    }
                }
            }
        ]
    }
} as ServiceSchema<ApiSettingsSchemaOpenApi>;

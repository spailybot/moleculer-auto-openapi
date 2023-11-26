import { ApiRouteSchema } from '../../src/types/types.js';

export const routes = {
    testsTags: {
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
    } as ApiRouteSchema,
    testMappers: {
        path: '/tests-mappers',
        whitelist: ['tests-mappers.*'],
        autoAliases: true
    } as ApiRouteSchema,
    autoAliasesVersion: {
        path: '/auto-aliases-version',
        whitelist: ['v2.math.*'],
        autoAliases: true
    } as ApiRouteSchema,
    openApi: {
        path: '/openapi',
        whitelist: ['openapi.*'],
        autoAliases: true
    } as ApiRouteSchema,
    base: {
        path: '/',
        aliases: {
            'POST login-custom-function': {
                handler(req, res) {
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
                                    example: { login: '', pass: '' }
                                }
                            }
                        }
                    }
                }
            },
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
        }
    } as ApiRouteSchema,
    edge: {
        path: '/edge',
        aliases: {
            //old method, skipped now
            'FILE /': 'some.upload',
            // middlewares
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
            // REST
            'REST posts': 'posts',
            // invalid action name
            invalidName: '$node.health',
            // joker method
            health: 'api.health',
            // function
            custom(req, res) {
                res.writeHead(201);
                res.end();
            },
            // different method in name and body
            'GET multipleMethods': {
                action: '$node.health',
                method: 'POST'
            },
            // different type in action name and action type
            'POST multipleTypes': {
                action: 'multipart:$node.health',
                type: 'stream',
                method: 'POST'
            }
        },
        bodyParsers: {
            json: true,
            urlencoded: true,
            text: true,
            raw: true
        }
    } as ApiRouteSchema
} as const;

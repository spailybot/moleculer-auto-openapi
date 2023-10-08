import * as moleculerWeb from 'moleculer-web';

const ApiGateway = moleculerWeb.default;

export const ApiService = {
    name: 'api',
    mixins: [ApiGateway],
    settings: {
        routes: [
            {
                path: '/api',
                aliases: {
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
                    }
                }
            },
            {
                path: '/api',
                aliases: {
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
            },
            {
                path: '/api',
                whitelist: ['openapi.*'],
                autoAliases: true
            },
            {
                path: '/api',
                whitelist: ['tests-mappers.*'],
                autoAliases: true
            }
        ]
    }
};

import type { Context } from 'moleculer';
import { Service, ServiceBroker } from 'moleculer';
import type { IncomingRequest, Route } from 'moleculer-web';
import ApiGateway from 'moleculer-web';
import type { ApiSettingsSchemaOpenApi, ApiSettingsOpenApi, ApiRouteOpenApi } from '@spailybot/moleculer-auto-openapi';
import { OpenAPIV3_1 } from 'openapi-types';

interface Meta {
    userAgent?: string | null | undefined;
    user?: object | null | undefined;
}

export default class ApiService extends Service<ApiSettingsSchemaOpenApi> {
    constructor(broker: ServiceBroker) {
        super(broker);

        this.parseServiceSchema({
            name: 'api',
            mixins: [ApiGateway],
            settings: {
                port: process.env.PORT != null ? Number(process.env.PORT) : 3000,
                assets: {
                    folder: 'public'
                },
                routes: [
                    {
                        path: '/api',
                        whitelist: ['$node*'],
                        autoAliases: true,
                        mappingPolicy: 'all'
                    },
                    {
                        path: '/openapi',
                        whitelist: ['openapi.*'],
                        autoAliases: true
                    },
                    {
                        path: '/',
                        whitelist: ['hidden.*', 'pets.*'],
                        autoAliases: true,
                        aliases: {
                            'POST /pets/:id/image': {
                                type: 'multipart',
                                action: 'pets.upload_image'
                            } as ApiRouteOpenApi,
                            'POST /pets/:id/image-stream': {
                                type: 'stream',
                                action: 'pets.upload_image'
                            } as ApiRouteOpenApi
                        },
                        authentication: true,
                        authorization: true,
                        busboyConfig: {
                            limits: {
                                //this will limit upload to 3 files at the same time
                                files: 3
                            }
                        }
                    },
                    {
                        path: '/users',
                        aliases: {
                            'REST /': {
                                openapi: {
                                    tags: [
                                        {
                                            name: 'User',
                                            description: 'Represent an user'
                                        },
                                        'User'
                                    ]
                                } as ApiRouteOpenApi,
                                // add except because this bug https://github.com/moleculerjs/moleculer-web/issues/344
                                except: [],
                                action: 'users'
                            },
                            'POST /avatar': {
                                openapi: {
                                    tags: ['User']
                                },
                                type: 'multipart',
                                action: 'users.upload_avatar',
                                busboyConfig: {
                                    limits: {
                                        //this will generate an uniq file field
                                        files: 1
                                    }
                                }
                            } as ApiRouteOpenApi
                        },
                        authentication: true,
                        authorization: true
                    }
                ],
                openapi: {
                    //add default responses
                    responses: {
                        '403': {
                            description: 'This is an example of common response'
                        }
                    },
                    components: {
                        securitySchemes: {
                            myAuth: {
                                type: 'http',
                                scheme: 'bearer',
                                description: 'the bearer is : "123456"'
                            } as OpenAPIV3_1.SecuritySchemeObject
                        }
                    }
                } as ApiSettingsOpenApi
            },

            methods: {
                /**
                 * PLEASE NOTE, IT'S JUST AN EXAMPLE IMPLEMENTATION. DO NOT USE IN PRODUCTION!
                 */
                authenticate(ctx: Context, route: Route, req: IncomingRequest): Record<string, unknown> | null {
                    // Read the token from header
                    const auth = req.headers.authorization;

                    if (auth && auth.startsWith('Bearer')) {
                        const token = auth.slice(7);

                        // Check the token. Tip: call a service which verify the token. E.g. `accounts.resolveToken`
                        if (token === '123456') {
                            // Returns the resolved user. It will be set to the `ctx.meta.user`
                            return { id: 1, name: 'John Doe' };
                        }
                        // Invalid token
                        throw new ApiGateway.Errors.UnAuthorizedError(ApiGateway.Errors.ERR_INVALID_TOKEN, null);
                    } else {
                        // No token. Throw an error or do nothing if anonymous access is allowed.
                        // throw new E.UnAuthorizedError(E.ERR_NO_TOKEN);
                        return null;
                    }
                },

                /**
                 * Authorize the request. Check that the authenticated user has right to access the resource.
                 *
                 * PLEASE NOTE, IT'S JUST AN EXAMPLE IMPLEMENTATION. DO NOT USE IN PRODUCTION!
                 */
                authorize(ctx: Context<null, Meta>, route: Route, req: IncomingRequest) {
                    // Get the authenticated user.
                    const { user } = ctx.meta;

                    //check if the action has an openapi.security filled
                    const openApiSecurityConfigured = typeof req.$action.openapi == 'object' && !!req.$action.openapi?.security?.length;

                    if (!user && openApiSecurityConfigured) {
                        throw new ApiGateway.Errors.UnAuthorizedError('NO_RIGHTS', null);
                    }
                }
            }
        });
    }
}

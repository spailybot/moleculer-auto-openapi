import type { Context } from 'moleculer';
import { Service, ServiceBroker } from 'moleculer';
import type { IncomingRequest, Route } from 'moleculer-web';
import ApiGateway from 'moleculer-web';
import type { ApiRouteOpenApi, ApiSettingsOpenApi, ApiSettingsSchemaOpenApi } from '@spailybot/moleculer-auto-openapi';
import { OpenAPIV3_1 } from 'openapi-types';
import * as jose from 'jose';
import crypto, { KeyObject } from 'crypto';
import { IUser } from './objects/IUser.js';

interface Meta {
    userAgent?: string | null | undefined;
    user?: IUser | undefined | null;
}

export default class ApiService extends Service<ApiSettingsSchemaOpenApi> {
    private jwsPublicKey?: KeyObject;

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
                        path: '/oauth2',
                        whitelist: ['oauth2.*'],
                        autoAliases: true,
                        bodyParsers: {
                            //swagger oauth2 will need urlencoded
                            urlencoded: true,
                            json: true
                        }
                    },
                    {
                        path: '/admin',
                        whitelist: ['admin.*'],
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
                authenticate: async (ctx: Context, route: Route, req: IncomingRequest): Promise<Meta['user']> => {
                    return this.handleAuthentication(req);
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
                    const openApiSecurityNeeded = typeof req.$action.openapi == 'object' && !!req.$action.openapi?.security;

                    if (!user && openApiSecurityNeeded) {
                        throw new ApiGateway.Errors.UnAuthorizedError('NO_RIGHTS', null);
                    }
                }
            },
            events: {
                'oauth2.publicKey.generated': (publicKey: string) => {
                    this.logger.info('receive a new public key to authenticate');
                    this.jwsPublicKey = crypto.createPublicKey(publicKey);
                }
            }
        });
    }

    private async handleAuthentication(req: IncomingRequest): Promise<Meta['user']> {
        const securityNeeded = typeof req.$action.openapi == 'object' && req.$action.openapi?.security;

        if (!securityNeeded) {
            return null;
        }

        const userAuthentication = await this.handleSecuritys(securityNeeded, req);

        if (!userAuthentication) {
            throw new ApiGateway.Errors.UnAuthorizedError(ApiGateway.Errors.ERR_INVALID_TOKEN, null);
        }

        return userAuthentication;
    }

    /**
     * The `securityRequirement` is designed to handle multiple security combinations.
     * Security combinations are configurations where at least one configuration needs to be valid for the operation to function.
     * Each combination is processed in order and stops at the first successful match.
     */
    private async handleSecuritys(
        securityNeeded: Array<OpenAPIV3_1.SecurityRequirementObject>,
        req: IncomingRequest
    ): Promise<Meta['user']> {
        for (const security of securityNeeded) {
            const resSecurity = await this.handleSecurity(security, req);
            if (resSecurity) {
                return resSecurity;
            }
        }

        return null;
    }

    private async handleSecurity(security: OpenAPIV3_1.SecurityRequirementObject, req: IncomingRequest): Promise<Meta['user']> {
        // Read the token from header
        const authorization = req.headers.authorization;
        let user: Meta['user'];
        const authorizationSplitted = authorization?.split(' ');
        for (const securityKey in security) {
            const scopes = security[securityKey];

            switch (securityKey) {
                case 'myAuth':
                    if (
                        !authorizationSplitted ||
                        authorizationSplitted[0]?.toLowerCase() != 'bearer' ||
                        authorizationSplitted[1] != '123456'
                    ) {
                        return null;
                    }

                    user = { ...user, user: { id: 1, name: 'John Doe' } };
                case 'OAuth2':
                    if (!this.jwsPublicKey || !authorizationSplitted || authorizationSplitted[0]?.toLowerCase() != 'bearer') {
                        return null;
                    }

                    const { payload } = await jose.jwtVerify<IUser>(authorizationSplitted[1], this.jwsPublicKey, {
                        issuer: 'urn:example:issuer',
                        audience: 'urn:example:audience'
                    });

                    //check the scopes
                    const payloadScopes = payload.scope?.split(' ');
                    const missedScopes = scopes.some((scope) => !payloadScopes?.includes(scope));
                    if (missedScopes) {
                        return null;
                    }

                    return payload;
                default:
                    return null;
            }
        }
    }
}

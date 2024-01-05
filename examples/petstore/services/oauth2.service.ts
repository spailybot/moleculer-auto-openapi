import Moleculer, { Context, Service, ServiceBroker, ServiceSettingSchema } from 'moleculer';
import { MoleculerWebTypes } from '@spailybot/moleculer-auto-openapi';
import { RuleString } from 'fastest-validator';
import { OpenAPIV3_1 } from 'openapi-types';
import crypto, { KeyObject } from 'crypto';
import path from 'path';
import fs from 'fs';
import * as jose from 'jose';
import { JWTPayload } from 'jose';
import { promisify } from 'util';
import { MoleculerWebMetas } from './objects/commons.js';
import { IUser } from './objects/IUser.js';
import MoleculerError = Moleculer.Errors.MoleculerError;

export default class Oauth2Service extends Service<ServiceSettingSchema & MoleculerWebTypes.RestServiceSettings> {
    private privateKey?: KeyObject;
    private publicKey?: KeyObject;

    constructor(broker: ServiceBroker) {
        super(broker);

        this.parseServiceSchema({
            name: 'oauth2',
            settings: {
                rest: '/',
                openapi: {
                    tags: [
                        {
                            name: 'OAuth2',
                            description:
                                'this endpoints allow you to use this server with oauth2 authentication, use it with the swagger "Authorize" button',
                            externalDocs: {
                                url: 'https://www.digitalocean.com/community/tutorials/an-introduction-to-oauth-2',
                                description: 'DigitalOcean Introduction to OAuth2'
                            }
                        },
                        'OAuth2'
                    ],
                    components: {
                        securitySchemes: {
                            OAuth2: {
                                type: 'oauth2',
                                description: 'this authentication is a demo . No clients credentials needed',
                                flows: {
                                    authorizationCode: {
                                        authorizationUrl: '/oauth2/authorize',
                                        tokenUrl: '/oauth2/token',
                                        scopes: {
                                            write_user: 'write your user',
                                            write_pets: 'modify pets'
                                        }
                                    }
                                }
                            } as OpenAPIV3_1.SecuritySchemeObject
                        }
                    }
                }
            },
            actions: {
                authorize: {
                    params: {
                        client_id: 'string',
                        redirect_uri: 'string',
                        response_type: 'string',
                        state: 'string|optional',
                        scope: 'string|optional'
                    },
                    rest: {
                        path: '/authorize',
                        method: 'GET'
                    },
                    openapi: {
                        description: 'Endpoint that will generate an authorization code to oauth2 flow',
                        responses: {
                            '200': false,
                            '301': {
                                description: 'redirection to the redirect_url'
                            }
                        }
                    },
                    handler(
                        ctx: Context<
                            {
                                client_id: string;
                                redirect_uri: string;
                                response_type: string;
                                state?: string;
                                scope?: string;
                            },
                            MoleculerWebMetas
                        >
                    ) {
                        // in real world, this URL will be a webpage, or something to authenticate the user, and return a code linked to this user (used on the token endpoint)

                        const { client_id, redirect_uri, response_type, scope } = ctx.params;

                        this.logger.info(`receive an oauth2 request on scope : ${scope}`);

                        const url = new URL(redirect_uri, 'http://localhost:3000');
                        url.searchParams.set('code', 'fake-code');
                        url.searchParams.set('state', ctx.params.state ?? '');

                        ctx.meta.$location = url.toString();
                        ctx.meta.$statusCode = 301;
                    }
                },
                token: {
                    rest: 'POST /token',
                    params: {
                        grant_type: {
                            type: 'string'
                        } as RuleString,
                        code: {
                            type: 'string'
                        } as RuleString
                    },
                    openapi: {
                        response: {
                            description: '',
                            content: {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        access_token: {
                                            type: 'string'
                                        },
                                        expires_in: {
                                            type: 'number'
                                        },
                                        token_type: {
                                            type: 'string'
                                        }
                                    }
                                }
                            }
                        }
                    },
                    handler: async (ctx) => {
                        const { grant_type, code } = ctx.params;

                        if (!this.privateKey) {
                            throw new MoleculerError('bad initialization');
                        }

                        if (grant_type !== 'authorization_code' || !code) {
                            throw new MoleculerError('Invalid grant_type or code.', 400, 'INVALID_REQUEST');
                        }

                        const expires_in = 12 * 3600;

                        //define the scopes the user can access .
                        const scope = 'write_user write_pets';

                        const token: JWTPayload & IUser = {
                            'urn:example:claim': true,
                            user: { id: 2, name: 'John Doe 2' },
                            scope
                        };

                        const access_token = await new jose.SignJWT(token)
                            .setProtectedHeader({
                                alg: 'RS512',
                                typ: 'JWT'
                            })
                            .setIssuedAt()
                            .setSubject('openapi-tests')
                            // name of your company
                            .setIssuer('urn:example:issuer')
                            // name of the company that will use this token (can be you)
                            .setAudience('urn:example:audience')
                            .setExpirationTime(new Date(Date.now() + expires_in * 1000))
                            .sign(this.privateKey);

                        return {
                            access_token,
                            expires_in,
                            token_type: 'bearer',
                            scope
                        };
                    }
                }
            },
            started: async () => {
                const pkgPath = process.env.npm_package_json;

                let rsaPath = pkgPath ? path.dirname(pkgPath) : __dirname;

                const { privateKey, publicKey } = await this.getKeys(rsaPath);
                this.privateKey = privateKey;
                this.publicKey = publicKey;
            }
        });
    }

    /**
     * get keys from local file system, or generate them .
     *
     * @param keysDirectory
     * @private
     */
    private async getKeys(keysDirectory: string): Promise<{ privateKey: KeyObject; publicKey: KeyObject }> {
        this.logger.debug(`check for RSA keys to sign JWS in ${keysDirectory}`);

        const privateKeyPath = path.join(keysDirectory, 'jws.pem');
        const publicKeyPath = path.join(keysDirectory, 'jws_pub.pem');

        if (fs.existsSync(privateKeyPath) && fs.existsSync(publicKeyPath)) {
            this.logger.debug('keys exists');

            const [privateKeyString, publicKeyString] = await Promise.all([
                fs.promises.readFile(privateKeyPath, 'utf-8'),
                fs.promises.readFile(publicKeyPath, 'utf-8')
            ]);

            const privateKey = crypto.createPrivateKey(privateKeyString);

            const derivedPublicKey = crypto.createPublicKey(privateKey.export({ format: 'pem', type: 'pkcs1' }));
            if (derivedPublicKey.export({ format: 'pem', type: 'pkcs1' }) === publicKeyString) {
                this.logger.info('keys are valid');

                const publicKey = crypto.createPublicKey(publicKeyString);
                await this.broker.broadcast('oauth2.publicKey.generated', publicKeyString);

                return { privateKey, publicKey };
            }
        }

        this.logger.debug("keys doesn't exists");

        const { privateKey, publicKey } = await promisify(crypto.generateKeyPair)('rsa', {
            modulusLength: 2048
        });

        this.logger.debug(`keys generated`);

        const privateKeyString = privateKey.export({
            type: 'pkcs8',
            format: 'pem'
        });
        const publicKeyString = publicKey.export({
            type: 'spki',
            format: 'pem'
        });

        await Promise.all([fs.promises.writeFile(privateKeyPath, privateKeyString), fs.promises.writeFile(publicKeyPath, publicKeyString)]);
        this.logger.debug(`keys written for the next time`);

        await this.broker.broadcast('oauth2.publicKey.generated', publicKeyString);
        return { privateKey, publicKey };
    }
}

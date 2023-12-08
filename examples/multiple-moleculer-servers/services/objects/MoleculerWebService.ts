import type { Context, ServiceSchema } from 'moleculer';
import { Service, ServiceBroker } from 'moleculer';
import type { IncomingRequest, Route } from 'moleculer-web';
import ApiGateway from 'moleculer-web';
import type { ApiSettingsSchemaOpenApi, ApiSettingsOpenApi, ApiRouteOpenApi } from '@spailybot/moleculer-auto-openapi';
import { OpenAPIV3_1 } from 'openapi-types';
import { MoleculerWebTypes } from '@spailybot/moleculer-auto-openapi';

interface Meta {
    userAgent?: string | null | undefined;
    user?: object | null | undefined;
}

export interface IWebServiceSettings extends ApiSettingsSchemaOpenApi {}

export default class MoleculerWebService extends Service<IWebServiceSettings> {
    public constructor(
        public broker: ServiceBroker,
        schemaMod: ServiceSchema<IWebServiceSettings>
    ) {
        super(broker);

        if (!schemaMod.settings?.port || !schemaMod.name) {
            throw new Error('bad initialization');
        }

        this.parseServiceSchema({
            name: schemaMod.name,
            mixins: [ApiGateway],
            settings: {
                ...schemaMod.settings,
                assets: {
                    folder: 'public'
                },
                cors: {
                    methods: ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT'],
                    origin: '*'
                },
                openapi: {
                    server: {
                        url: `http://127.0.0.1:${schemaMod.settings.port}`,
                        description: `the server with name ${schemaMod.name}`
                    }
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
                        path: '/creator',
                        whitelist: ['server-creator.*'],
                        autoAliases: true,
                        bodyParsers: {
                            urlencoded: true,
                            json: true,
                            text: true
                        }
                    }
                ]
            }
        });
    }
}

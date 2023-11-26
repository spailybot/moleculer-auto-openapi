import * as moleculerWeb from 'moleculer-web';
import { ServiceSchema } from 'moleculer';
import type { ApiSettingsSchemaOpenApi } from '../../../src/index.js';
import { ApiRouteSchema } from 'moleculer-web';

const ApiGateway = moleculerWeb.default;

export const ApiService = {
    name: 'api',
    mixins: [ApiGateway],
    // version: 1,
    settings: {
        port: 0,
        path: '/api',
        routes: []
    },
    actions: {
        health: (ctx) => ctx.call('$node.health')
    }
} as ServiceSchema<ApiSettingsSchemaOpenApi>;

export const getApiService = (routes: Array<ApiRouteSchema> = []): ServiceSchema<ApiSettingsSchemaOpenApi> => {
    return {
        ...ApiService,
        settings: {
            ...ApiService.settings,
            routes: [...ApiService.settings?.routes, ...routes]
        }
    } as ServiceSchema<ApiSettingsSchemaOpenApi>;
};

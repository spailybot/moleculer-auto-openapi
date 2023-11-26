import Openapi from '../../../src/index.js';
import type { OpenApiMixinSettings } from '../../../src/index.js';

export const OpenapiService = {
    name: 'openapi',
    mixins: [Openapi],
    settings: {
        openapi: {
            info: {
                description: 'Foo',
                title: 'Bar'
            }
        },
        skipUnresolvedActions: false
    } as OpenApiMixinSettings
};

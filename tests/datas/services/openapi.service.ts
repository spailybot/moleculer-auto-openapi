import type { OpenApiMixinSettings } from '../../../src/index.js';
import Openapi from '../../../src/index.js';
import { RestServiceSettings } from '../../../src/types/moleculer-web.js';

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
        skipUnresolvedActions: true,
        rest: '/'
    } as OpenApiMixinSettings & RestServiceSettings,
    events: {
        // Disable the throttle on the regeneration event so the cache
        // invalidation stays deterministic in tests.
        '$api.aliases.regenerated': {
            throttle: 0
        }
    }
};

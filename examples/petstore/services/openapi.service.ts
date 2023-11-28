import { type MoleculerWebTypes, OpenApiMixin, type OpenApiMixinSettings } from '@spailybot/moleculer-auto-openapi';
import { Service, type ServiceBroker } from 'moleculer';

/**
 * MoleculerWebTypes are typings created from moleculer-web to enhance included typings; their use is totally optional.
 */

export default class OpenApiService extends Service<OpenApiMixinSettings & MoleculerWebTypes.RestServiceSettings> {
    public constructor(public broker: ServiceBroker) {
        super(broker);

        this.parseServiceSchema({
            name: 'openapi',
            mixins: [OpenApiMixin],
            settings: {
                rest: '/',
                schemaPath: '/openapi/openapi.json',
                openapi: {
                    info: {
                        title: 'My API',
                        version: '0.0.1'
                    },
                    components: {
                        //declare security scheme
                        securitySchemes: {
                            myAuth: {
                                type: 'http',
                                scheme: 'bearer'
                            }
                        }
                    }
                }
            }
        });
    }
}

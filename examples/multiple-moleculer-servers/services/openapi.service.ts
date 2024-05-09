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
                openApiPaths: {
                    schemaPath: '/openapi/openapi.json'
                },
                openapi: {
                    info: {
                        title: process.env.npm_package_name ? `${process.env.npm_package_name} API` : 'My API',
                        version: process.env.npm_package_version ? `${process.env.npm_package_version}` : '0.0.1'
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
                },
                skipUnresolvedActions: true
            }
        });
    }
}

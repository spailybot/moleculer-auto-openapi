import {
    type addMappersFn,
    type Alias,
    type filterAliasesFn,
    type Mapper,
    type MoleculerWebTypes,
    type OA_GENERATE_DOCS_INPUT,
    OpenApiMixin,
    type OpenApiMixinSettings,
    type RuleToSchemaFunction,
    type SchemaToRules
} from '@spailybot/moleculer-auto-openapi';
import { Context, Service, type ServiceBroker, ServiceMethods } from 'moleculer';
import { RuleCustom } from 'fastest-validator';

/**
 * MoleculerWebTypes are typings created from moleculer-web to enhance included typings; their use is totally optional.
 */
export default class OpenApiService extends Service<OpenApiMixinSettings & MoleculerWebTypes.RestServiceSettings> {
    public constructor(public broker: ServiceBroker) {
        super(broker);

        const APP_NAME = process.env.npm_package_name ? `${process.env.npm_package_name} API` : 'My API';

        this.parseServiceSchema({
            name: 'openapi',
            mixins: [OpenApiMixin],
            settings: {
                rest: '/',
                openapi: {
                    info: {
                        title: APP_NAME,
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
                skipUnresolvedActions: true,
                UIOauthOptions: {
                    appName: APP_NAME,
                    clientId: 'myClientId',
                    clientSecret: 'myClientSecret'
                }
            },
            methods: {
                filterAliases: (ctx: Context<OA_GENERATE_DOCS_INPUT & { admin?: string }>, aliases: Array<Alias>): Array<Alias> => {
                    return aliases.filter((alias) =>
                        ctx.params?.admin !== undefined ? alias.service?.name === 'admin' : alias.service?.name !== 'admin'
                    );
                },
                addMappers: (
                    getSchemaObjectFromRule: RuleToSchemaFunction,
                    getSchemaObjectFromSchema: SchemaToRules
                ): Record<string, Mapper<RuleCustom>> => {
                    return {
                        even: (rule) => {
                            return {
                                type: 'number',
                                examples: [2, 4, 6, 8, 10]
                            };
                        }
                    };
                }
            } as ServiceMethods & { filterAliases: filterAliasesFn; addMappers: addMappersFn }
        });
    }
}

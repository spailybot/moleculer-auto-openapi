import { type MoleculerWebTypes, OpenApiMixin, type OpenApiMixinSettings } from '@spailybot/moleculer-auto-openapi';
import {Context, Service, ServiceMethods, type ServiceBroker } from 'moleculer';
import {filterAliasesFn, OA_GENERATE_DOCS_INPUT} from "../../../src/index.js";
import {Alias} from "../../../src/objects/Alias.js";

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
                openApiPaths: '',
                rest: '/',
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
            },
            methods: {
                filterAliases: (ctx: Context<OA_GENERATE_DOCS_INPUT & {admin?:string}>, aliases: Array<Alias>): Array<Alias> => {
                    return aliases.filter(alias => ctx.params?.admin !== undefined ? alias.service?.name === "admin" : alias.service?.name !== "admin")
                }
            } as ServiceMethods & { filterAliases: filterAliasesFn },
        });
    }
}

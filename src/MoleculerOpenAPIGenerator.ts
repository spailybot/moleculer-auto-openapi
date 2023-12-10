import type { Context, LoggerInstance, Service, ServiceBroker, ServiceSchema } from 'moleculer';
import Moleculer from 'moleculer';
import {
    ApiSettingsSchemaOpenApi,
    ECacheMode,
    FastestValidatorType,
    filterAliasesFn,
    OA_GENERATE_DOCS_INPUT,
    OA_GENERATE_DOCS_OUTPUT,
    OpenApiMixinSettings
} from './types/index.js';
import type { ApiSettingsSchema } from 'moleculer-web';
import type { ExcludeRequiredProps } from './types/utils.js';
import { moleculerOpenAPITypes } from './moleculer.js';
import { MoleculerWebRoutesParser } from './MoleculerWebRoutesParser/MoleculerWebRoutesParser.js';
import { Alias } from './objects/Alias.js';
import { OpenApiGenerator } from './OpenApiGenerator.js';
import { DEFAULT_CONTENT_TYPE, DEFAULT_MULTI_PART_FIELD_NAME } from './constants.js';
import MoleculerError = Moleculer.Errors.MoleculerError;

export const defaultSettings: Required<ExcludeRequiredProps<Omit<OpenApiMixinSettings, 'assetsPath' | 'schemaPath' | 'openApiPaths'>>> &
    Partial<OpenApiMixinSettings> = {
    onlyLocal: false, // build schema from only local services
    // commonPathItemObjectResponses: {
    //     200: {
    //         $ref: '#/components/responses/ReturnedData'
    //     },
    //     401: {
    //         $ref: '#/components/responses/UnauthorizedError'
    //     },
    //     422: {
    //         $ref: '#/components/responses/ValidationError'
    //     },
    //     default: {
    //         $ref: '#/components/responses/ServerError'
    //     }
    // },
    //TODO ?
    // requestBodyAndResponseBodyAreSameOnMethods: [
    //     /* 'post',
    //     'patch',
    //     'put', */
    // ],
    // requestBodyAndResponseBodyAreSameDescription:
    //     'The answer may vary slightly from what is indicated here. Contain id and/or other additional attributes.',
    openapi: {
        info: {
            description: '',
            version: '0.0.1',
            title: 'Api docs'
        },
        tags: [],
        paths: {},
        components: {
            schemas: moleculerOpenAPITypes.schemas,
            securitySchemes: {},
            responses: moleculerOpenAPITypes.responses
        },
        responses: {
            200: {
                $ref: '#/components/responses/ReturnedData'
            },
            401: {
                $ref: '#/components/responses/UnauthorizedError'
            },
            422: {
                $ref: '#/components/responses/ValidationError'
            },
            default: {
                $ref: '#/components/responses/ServerError'
            }
        }
    },
    cacheOpenApi: true,
    skipUnresolvedActions: true,
    cacheMode: ECacheMode.NEXT_CALL,
    summaryTemplate: '{{summary}}\n            ({{action}}) {{autoAlias}}',
    returnAssetsAsStream: true,
    defaultResponseContentType: DEFAULT_CONTENT_TYPE,
    multiPartFileFieldName: DEFAULT_MULTI_PART_FIELD_NAME,
    addServiceNameToTags: false,
    UIOptions: {}
};

export class MoleculerOpenAPIGenerator {
    private readonly broker: ServiceBroker;

    private readonly settings: OpenApiMixinSettings;
    private readonly logger: LoggerInstance;
    private validator: FastestValidatorType;

    constructor(broker: ServiceBroker, settings: OpenApiMixinSettings) {
        this.broker = broker;
        const validator = this.broker.validator as unknown as { validator: any };
        if (validator.constructor.name != 'FastestValidator' && validator.validator) {
            throw new Error('only fastest validator is allowed');
        }

        this.logger = this.broker.getLogger('moleculer-openapi-generator');
        this.validator = validator.validator;

        this.settings = {
            ...defaultSettings,
            ...settings
        };
    }

    private fetchServicesWithActions(ctx: Context, withActions = true, onlyLocal = this.settings.onlyLocal): Promise<Array<Service>> {
        return ctx.call('$node.services', {
            withActions,
            onlyLocal: onlyLocal ?? false
        });
    }

    private async mapAliases(ctx: Context, services: Array<ServiceSchema<ApiSettingsSchema>>): Promise<Array<Alias>> {
        this.logger.debug(`mapAliases()`);
        //only moleculer-web service
        const apiServices = services.filter((service) => service?.settings?.routes) as Array<ServiceSchema<ApiSettingsSchemaOpenApi>>;

        this.logger.debug(`mapAliases() : ${apiServices?.length ?? 0} moleculer-web services found`);
        if (!apiServices?.length) {
            throw new MoleculerError('fail to identify service hosting moleculer-web');
        }

        const routesParser = new MoleculerWebRoutesParser(this.logger);

        return (
            await Promise.all(
                apiServices.map(async (svc) => await routesParser.parse(ctx, svc, this.settings.skipUnresolvedActions ?? true, services))
            )
        ).flat();
    }

    public async getAliases(ctx: Context): Promise<Array<Alias>> {
        const services = await this.fetchServicesWithActions(ctx);

        return this.mapAliases(ctx, services);
    }

    public async generateSchema(
        ctx: Context<OA_GENERATE_DOCS_INPUT>,
        { filterAliasesFn }: { filterAliasesFn: filterAliasesFn }
    ): Promise<OA_GENERATE_DOCS_OUTPUT> {
        //TODO allow to pass version from ctx ?
        // const { version } = ctx.params;
        const version = '3.1';

        const aliases = await filterAliasesFn(ctx, await this.getAliases(ctx));

        return new OpenApiGenerator(this.logger, this.validator, JSON.parse(JSON.stringify(this.settings.openapi))).generate(
            version,
            aliases
        );
    }
}

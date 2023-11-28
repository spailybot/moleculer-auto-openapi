import type { Context, LoggerInstance, Service, ServiceBroker, ServiceSchema } from 'moleculer';
import Moleculer from 'moleculer';
import type { OpenAPIV3_1 as OA3_1 } from 'openapi-types';
import type { FastestValidatorType, OpenApiMixinSettings } from './types/index.js';
import { ApiSettingsSchemaOpenApi, ECacheMode } from './types/index.js';
import { moleculerOpenAPITypes } from './moleculer.js';
import { ApiSettingsSchema } from 'moleculer-web';
import { MoleculerWebRoutesParser } from './MoleculerWebRoutesParser/MoleculerWebRoutesParser.js';
import { Alias } from './objects/Alias.js';
import { OpenApiGenerator } from './OpenApiGenerator.js';
import { ExcludeRequiredProps } from './types/utils.js';
import MoleculerError = Moleculer.Errors.MoleculerError;
import { DEFAULT_CONTENT_TYPE, DEFAULT_MULTI_PART_FIELD_NAME, OpenApiVersionsSupported } from './constants.js';

export const defaultSettings: Required<ExcludeRequiredProps<OpenApiMixinSettings>> & Partial<OpenApiMixinSettings> = {
    onlyLocal: false, // build schema from only local services
    assetsPath: '//unpkg.com/swagger-ui-dist',
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
    multiPartFileFieldName: DEFAULT_MULTI_PART_FIELD_NAME
};

export type OA_GENERATE_DOCS_INPUT = {
    /**
     * maybe a future option ?
     * @hidden
     */
    version?: OpenApiVersionsSupported;
};
export type OA_GENERATE_DOCS_OUTPUT = OA3_1.Document;

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

    private async getAliases(ctx: Context, services: Array<ServiceSchema<ApiSettingsSchema>>): Promise<Array<Alias>> {
        this.logger.debug(`getAliases()`);
        //only moleculer-web service
        const apiServices = services.filter((service) => service?.settings?.routes) as Array<ServiceSchema<ApiSettingsSchemaOpenApi>>;

        this.logger.debug(`getAliases() : ${apiServices?.length ?? 0} moleculer-web services found`);
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

    public async generateSchema(ctx: Context<OA_GENERATE_DOCS_INPUT>): Promise<OA_GENERATE_DOCS_OUTPUT> {
        //TODO allow to pass version from ctx ?
        // const { version } = ctx.params;
        const version = '3.1';

        const services = await this.fetchServicesWithActions(ctx);

        const aliases = await this.getAliases(ctx, services);

        return new OpenApiGenerator(this.logger, this.validator, JSON.parse(JSON.stringify(this.settings.openapi))).generate(
            version,
            aliases
        );
    }
}

import type {
    default as FastestValidatorDefault,
    RuleAny,
    RuleArray,
    RuleBoolean,
    RuleClass,
    RuleCurrency,
    RuleCustom,
    RuleDate,
    RuleEmail,
    RuleEnum,
    RuleEqual,
    RuleForbidden,
    RuleFunction,
    RuleLuhn,
    RuleMac,
    RuleMulti,
    RuleNumber,
    RuleObject,
    RuleRecord,
    RuleString,
    RuleURL,
    RuleUUID,
    ValidationRule,
    ValidationRuleName,
    ValidationRuleObject,
    ValidationSchema
} from 'fastest-validator';
import { OpenAPIV3 as OA3, OpenAPIV3_1 as OA3_1 } from 'openapi-types';
import { ApiRouteSchema, ApiSettingsSchema } from 'moleculer-web';
import { openApiVersionsSupported } from '../commons.js';
import { AliasRouteSchema } from './moleculer-web.js';

export type tSystemParams = {
    description?: string;
    optional?: boolean;
};

export type ValidationRuleMapping = {
    [K in ValidationRuleName]: K extends 'any'
        ? RuleAny
        : K extends 'array'
        ? RuleArray
        : K extends 'boolean'
        ? RuleBoolean
        : K extends 'class'
        ? RuleClass
        : K extends 'currency'
        ? RuleCurrency
        : K extends 'custom'
        ? RuleCustom
        : K extends 'date'
        ? RuleDate
        : K extends 'email'
        ? RuleEmail
        : K extends 'enum'
        ? RuleEnum
        : K extends 'equal'
        ? RuleEqual
        : K extends 'forbidden'
        ? RuleForbidden
        : K extends 'function'
        ? RuleFunction
        : K extends 'luhn'
        ? RuleLuhn
        : K extends 'mac'
        ? RuleMac
        : K extends 'multi'
        ? RuleMulti
        : K extends 'number'
        ? RuleNumber
        : K extends 'object'
        ? RuleObject
        : K extends 'record'
        ? RuleRecord
        : K extends 'string'
        ? RuleString
        : K extends 'url'
        ? RuleURL
        : K extends 'uuid'
        ? RuleUUID
        : never;
};

export type Mapper<Rule extends RuleCustom> = (rule: Rule, schema?: ObjectRules) => OA3_1.SchemaObject;

export type Mappers = {
    [K in keyof ValidationRuleMapping]: Mapper<ValidationRuleMapping[K]>;
};

export type RuleToSchemaFunction = (
    pRule: ValidationRule,
    parentProperties?: Partial<ValidationRuleObject>
) => OA3_1.SchemaObject | undefined;
export type SchemaToRules = (schema: ValidationSchema) => Record<string, OA3_1.SchemaObject>;

export type ObjectRules = ValidationSchema & Record<string, ValidationRule>;

export type FastestValidatorType = FastestValidatorDefault.default;

export type actionOpenApiResponse = Omit<OA3_1.ResponseObject, 'content'> & { content?: OA3_1.MediaTypeObject; type?: string };

export interface ActionOpenApi {
    tags?: Array<string>;
    components?: OA3_1.ComponentsObject;
    responses?: OA3_1.ComponentsObject['responses'];
    response?: OA3_1.MediaTypeObject | actionOpenApiResponse;
    description?: OA3_1.OperationObject['description'];
    externalDocs?: OA3_1.OperationObject['externalDocs'];
    operationId?: OA3_1.OperationObject['operationId'];
    summary?: OA3_1.OperationObject['summary'];
    servers?: OA3_1.OperationObject['servers'];
}

export interface ApiSettingsSchemaOpenApi extends ApiSettingsSchema {
    routes?: Array<ApiRouteSchema>;
    openapi?: OA3_1.Document;
}

//TODO
export interface AliasRouteOpenApi extends ApiRouteOpenApi {}

export interface AliasRouteSchemaOpenApi extends AliasRouteSchema {
    openapi?: AliasRouteOpenApi;
}

//TODO
export interface ApiRouteOpenApi {
    tags?: Array<string>;
    components?: OA3_1.ComponentsObject;
    responses?: OA3_1.ComponentsObject['responses'];
}

declare module 'moleculer' {
    interface ActionSchema {
        openapi?: ActionOpenApi;
    }
}

declare module 'moleculer-web' {
    interface ApiRouteSchema {
        openapi?: ApiRouteOpenApi;
    }
}

export interface FVOASchemaMetaKeys {}
export interface FVOARuleMetaKeys {
    in: 'body' | 'query';
}

declare module 'fastest-validator' {
    interface ValidationSchemaMetaKeys {
        $$oa?: FVOASchemaMetaKeys;
    }
    interface RuleCustom {
        $$oa?: FVOARuleMetaKeys;
    }
}

export type cleanAlias = string | Array<string> | AliasRouteSchema;

export type OpenApiMixinSettings = {
    onlyLocal: boolean;
    schemaPath: string;
    uiPath: string;
    assetsPath: string;
    commonPathItemObjectResponses: OA3_1.ResponsesObject & OA3.ResponsesObject;
    requestBodyAndResponseBodyAreSameOnMethods: Array<OA3_1.HttpMethods>;
    requestBodyAndResponseBodyAreSameDescription: string;
    openapi: OA3_1.Document & { openapi: `${openApiVersionsSupported}${string}` };
    /**
     * allow to skip unresolved actions
     */
    skipUnresolvedActions: boolean;
    /**
     * allow to clear the cache when the routes are reloaded (else, they will be cleared when cache expire)
     * this doesn't work without cacheOpenApi = true
     */
    clearCacheOnRoutesGenerated: boolean;
    /**
     * add the openAPI to cache
     */
    cacheOpenApi: boolean;
    /**
     * summary template
     * use variable between double accolades : {{summary}}
     * @var string summary : the actual summary
     * @var string action : the action name
     * @var string autoAlias : print [autoAlias] if an auto alias
     *
     */
    summaryTemplate: string;
    /**
     * return assets as a stream else as a buffer ?
     * @default true
     */
    returnAssetsAsStream: boolean;
    /**
     * set the default response content-type, used by "response", can be overridden with parameter "response.type" on action/route level
     *
     * @default application/json
     */
    defaultResponseContentType: string;
    /**
     * the name of the field holding the file (only important in documentation, change it if it collides with one of your fields)
     *
     * @default file
     */
    multiPartFileFieldName: string;
};

export { ApiRouteSchema };

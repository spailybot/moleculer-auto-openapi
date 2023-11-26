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
import { OpenAPIV3_1 as OA3_1 } from 'openapi-types';
import { ApiRouteSchema, ApiSettingsSchema } from 'moleculer-web';
import { AliasRouteSchema } from './moleculer-web.js';

export type tSystemParams = {
    description?: string;
    optional?: boolean;
};

/**
 * map a Fastest-Validator rule with its type
 * @internal
 */
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
/**
 * a way to get the type of the fastestValidator object
 */
export type FastestValidatorType = FastestValidatorDefault.default;

/**
 * describe an openapi response .
 * by default it use default content type {@link OpenApiMixinSettings.defaultResponseContentType}
 */
export type actionOpenApiResponse = Omit<OA3_1.ResponseObject, 'content'> & { content?: OA3_1.MediaTypeObject; type?: string };

export type openApiTag = string | OA3_1.TagObject | null;

export interface ActionOpenApi extends commonOpenApi {
    /**
     * can be used to fastly declare the 200 answer
     * can be directly a {@link https://spec.openapis.org/oas/v3.1.0#media-type-object | Media Type Object} so it will reuse the default contentType
     * or an object specifying the type and the media
     */
    response?: OA3_1.MediaTypeObject | actionOpenApiResponse;
    /**
     * allow to bypass the generation from params . Specify it yourself
     */
    requestBody?: OA3_1.RequestBodyObject;
    /**
     * allow to bypass the query generation from params . Specify it yourself
     */
    queryParameters?: Array<Omit<OA3_1.ParameterObject, 'in'>>;
    /**
     * allow to bypass the query generation from params . Specify it yourself
     */
    pathParameters?: Array<Omit<OA3_1.ParameterObject, 'in'>>;
    /**
     * add a description to this operation
     */
    description?: string;
    /**
     * add an external documentation to this operation
     */
    externalDocs?: OA3_1.ExternalDocumentationObject;
    /**
     * add an operation id to this operation
     */
    operationId?: string;
    /**
     * add a summary to this operation
     */
    summary?: string;
    /**
     * add a list of servers to this operation
     */
    servers?: Array<OA3_1.ServerObject>;
}

/**
 * allow the value to be false, to refuse the merge from the parent
 *
 * @typeParam T - the Record where all keys can be falsifiable
 * @example
 * type myType = {
 *   foo: string;
 *   bar: string;
 * }
 *
 * type myFalsifiableType = OptionalOrFalse<myType>;
 * myFalsifiableType = {
 *     foo?: string | false;
 *     bar?: string | false;
 * }
 *
 */
export type OptionalOrFalse<T> = {
    [P in keyof T]?: false | T[P];
};

/**
 * use {@link OptionalOrFalse} on all keys
 *
 * @typeParam T - the Record where all sub keys can be falsifiable
 *
 * @example
 * type myType = {
 *     foo: {
 *       foo: string;
 *       bar: string;
 *     }
 * }
 *
 * type myFalsifiableType = SubOptionalOrFalse<myType>;
 * /**
 *   myFalsifiableType = {
 *     foo: {
 *       foo?: string | false;
 *       bar?: string | false;
 *     }
 * }
 */
export type SubOptionalOrFalse<T> = {
    [P in keyof T]?: OptionalOrFalse<T[P]>;
};

export interface commonOpenApi {
    /**
     * Allow to define tags of the {@link https://spec.openapis.org/oas/v3.1.0#operation-object|Operation}
     * - Use a tagObject to define it ( follow by his name to use it )
     * - use null to remove all tags added previously (by merge from other levels)
     * - use a string to use a tag
     *
     * tags are unique in all the openApi, and identified by his name .
     * Defining two times the same tag will merge them
     *
     * @example
     * // setting tags to all children
     * {
     *  tags: ['tags1', 'tags2']
     * }
     *
     * @example
     * // remove parents tags, and set tags to children
     * {
     *  tags: [null, 'tags3', 'tags4']
     * }
     *
     * @example
     * // add tag with description, and use it on children
     * {
     *  tags: [
     *      {
     *         name: "tags1";
     *         description: "this is the first example tag";
     *         externalDocs: "https://doc.example.com/tags/tags1";
     *      },
     *      'tags1'
     *  ]
     * }
     *
     */
    tags?: Array<openApiTag>;
    components?: SubOptionalOrFalse<OA3_1.ComponentsObject>;
    /**
     * specify all responses of the operation .
     * Merged by levels
     */
    responses?: OA3_1.ResponsesObject;
}

export type openApiServiceOpenApi = Omit<OA3_1.Document, 'info' | 'openapi' | keyof commonOpenApi> & {
    info?: OA3_1.InfoObject;
} & commonOpenApi;

export interface ApiSettingsOpenApi extends commonOpenApi {
    server?: OA3_1.ServerObject;
}

export interface ApiSettingsSchemaOpenApi extends ApiSettingsSchema {
    routes?: Array<ApiRouteSchema>;
    openapi?: ApiSettingsOpenApi;
}

//TODO
export interface AliasRouteOpenApi extends ActionOpenApi {}

export interface AliasRouteSchemaOpenApi extends AliasRouteSchema {
    openapi?: AliasRouteOpenApi;
}

//TODO
export interface ApiRouteOpenApi extends commonOpenApi {}

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

export interface FVOASchemaMetaKeys {
    description?: string;
    summary?: string;
}
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

export type OpenApiMixinSettings = {
    /**
     * map only local services ?
     */
    onlyLocal: boolean;
    /**
     * path to openapi.json / to the openapi generation action
     */
    schemaPath: string;
    uiPath: string;
    assetsPath: string;
    /**
     * Configure the base of the openApi Document . {@link https://spec.openapis.org/oas/v3.1.0#openapi-object | documentation}
     */
    openapi: openApiServiceOpenApi;
    /**
     * allow to skip unresolved actions
     *
     * @default true
     */
    skipUnresolvedActions: boolean;
    /**
     * allow to clear the cache when the routes are reloaded (else, they will be cleared when cache expire)
     * this doesn't work without cacheOpenApi = true
     */
    clearCacheOnRoutesGenerated: boolean;
    /**
     * add the openAPI to cache
     * If no cacher is available, the openApi will not be cached
     *
     * @default true
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

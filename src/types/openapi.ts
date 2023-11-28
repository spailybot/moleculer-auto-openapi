import { OpenAPIV3_1 as OA3_1 } from 'openapi-types';
import { ApiRouteSchema, ApiSettingsSchema } from 'moleculer-web';
import { AliasRouteSchema } from './moleculer-web.js';
import { OpenApiDefined, SubOptionalOrFalse } from './utils.js';
import { ActionSchema, ServiceSettingSchema } from 'moleculer';

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
    /**
     * set this endpoint as deprecated
     */
    deprecated?: boolean;
    /**
     * specify the security needed to call this endpoint
     */
    security?: Array<OA3_1.SecurityRequirementObject>;
}

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

export type openApiServiceOpenApi = Omit<OA3_1.Document, 'openapi' | keyof commonOpenApi> & commonOpenApi;

export interface ApiSettingsOpenApi extends commonOpenApi {
    server?: OA3_1.ServerObject;
}

export interface ApiSettingsSchemaOpenApi extends ApiSettingsSchema {
    routes?: Array<ApiRouteSchema>;
    openapi?: ApiSettingsOpenApi;
}

//TODO
export interface AliasRouteOpenApi extends ActionOpenApi {}

/**
 * moleculer-web AliasRouteSchema is a type, so not extendable
 *
 * @example
 * //you can use this in your aliases
 * {
 *   aliases: {
 *     'POST go': {} as AliasRouteSchemaOpenApi
 *   }
 * }
 */
export interface AliasRouteSchemaOpenApi extends AliasRouteSchema {
    openapi?: AliasRouteOpenApi | false;
}

//TODO
export interface ApiRouteOpenApi extends commonOpenApi {}

declare module 'moleculer' {
    interface ActionSchema {
        openapi?: ActionOpenApi | false;
    }

    interface ServiceSettingSchema {
        openapi?: ActionOpenApi | false;
    }
}

declare module 'moleculer-web' {
    interface ApiRouteSchema {
        openapi?: ApiRouteOpenApi | false;
    }
}

export type definedApiRouteSchema = OpenApiDefined<ApiRouteSchema>;
export type definedServiceSettingSchema = OpenApiDefined<ServiceSettingSchema>;
export type definedActionSchema = OpenApiDefined<ActionSchema>;
export type definedAliasRouteSchemaOpenApi = OpenApiDefined<AliasRouteSchemaOpenApi>;

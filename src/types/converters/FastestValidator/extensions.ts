import type { OpenAPIV3_1 } from 'openapi-types';

/**
 * These keys can be utilized at the root level of the fastest validator schema within the $$oa meta parameters.
 *
 * @example
 *
{
    $$oa: {
        description: "my description",
        summary: "my summary",
        externalDocs: { url: "https://example.com" }
    },
    $$strict: true,
    foo: "string",
    //the rest of your schema
}
 */
export interface FVOASchemaMetaKeys extends Omit<OpenAPIV3_1.RequestBodyObject, 'content'> {
    // allow to set the description of the requestBody
    description?: string;
    // allow to set the summary of the requestBody
    summary?: string;
    [key: string]: any;
}

/**
 * These keys can be put to use within the rule set of the fastest validator schema, under the $$oa meta parameters.
 *
 * For object rules (rules extracted as a schema component), the `summary` key is emitted as the
 * `summary` field on the `$ref` to the component, while `title` is emitted on the component schema
 * itself (`components.schemas[...].title`).
 *
 * @example
 {
     $$strict: true,
     foo: {
         $$oa: {
             in: 'body';
             description: "rule description";
             summary: "deprecated rule summary";
             deprecated: true;
             example: "foo"
         },
         type: "string"
     },
     //the rest of your schema
 }
 */
export interface FVOARuleMetaKeys extends Omit<OpenAPIV3_1.SchemaObject, 'type' | 'required' | 'examples'> {
    // allow to choose where this key need to be passed ? in url query ? or in body ?
    in?: 'body' | 'query';
    // add a description to this field
    description?: string;
    // add a summary to this field
    summary?: string;
    // is this field deprecated ?
    deprecated?: boolean;
    // allow to set a non-optional field on multipart/stream action
    optional?: boolean;
    // reference to another schema or parameter component
    $ref?: string;
    // parameter serialization style
    style?: string;
    // parameter explode setting
    explode?: boolean;
    // parameter allowEmptyValue setting
    allowEmptyValue?: boolean;
    // parameter allowReserved setting
    allowReserved?: boolean;
    // parameter example value
    example?: any;
    // parameter examples map
    examples?: { [media: string]: OpenAPIV3_1.ExampleObject | OpenAPIV3_1.ReferenceObject };
    // override parameter required setting
    required?: boolean;
    [key: string]: any;
}

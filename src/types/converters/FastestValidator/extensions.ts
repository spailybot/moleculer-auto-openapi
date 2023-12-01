/**
 * These keys can be utilized at the root level of the fastest validator schema within the $$oa meta parameters.
 *
 * @example
 *
{
    $$oa: {
        description: "my description",
        summary: "my summary"
    },
    $$strict: true,
    foo: "string",
    //the rest of your schema
}
 */
export interface FVOASchemaMetaKeys {
    // allow to set the description of the requestBody
    description?: string;
    // allow to set the summary of the requestBody
    summary?: string;
}

/**
 * These keys can be put to use within the rule set of the fastest validator schema, under the $$oa meta parameters.
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
         },
         type: "string"
     },
     //the rest of your schema
 }
 */
export interface FVOARuleMetaKeys {
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
}

/**
 * These keys can be utilized at the root level of the fastest validator schema within the $$oa meta parameters.
 *
 * @example
 * {
 *     $$oa: {
 *         description: "my description",
 *         summary: "my summary"
 *     },
 *     //the rest of your schema
 *     $$strict: true
 *     foo: "string"
 * }
 */
export interface FVOASchemaMetaKeys {
    description?: string;
    summary?: string;
}
/**
 * These keys can be put to use within the rule set of the fastest validator schema, under the $$oa meta parameters.
 *
 * @example
 * {
 *     //the rest of your schema
 *     $$strict: true
 *     foo: {
 *         $$oa: {
 *             in: 'body';
 *             description: "rule description";
 *             summary: "deprecated rule summary";
 *             deprecated: true;
 *         },
 *         type: "string"
 *     }
 * }
 */
export interface FVOARuleMetaKeys {
    in?: 'body' | 'query';
    description?: string;
    summary?: string;
    deprecated?: boolean;
}

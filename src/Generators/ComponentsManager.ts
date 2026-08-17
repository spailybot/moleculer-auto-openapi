import type { OpenAPIV3_1 } from 'openapi-types';
import type { LoggerInstance } from 'moleculer';
import type { FastestValidatorConverter } from '../Converters/FastestValidatorConverter.js';
import { EOAExtensions, multiOAProperties } from '../constants.js';
import type { OptionalOrFalse, SubOptionalOrFalse } from '../types/utils.js';
import type { tSystemParams } from '../types/index.js';

export class ComponentsManager {
    public components: OpenAPIV3_1.ComponentsObject = {
        schemas: {}
    };

    constructor(
        private readonly logger: LoggerInstance,
        private readonly converter: FastestValidatorConverter
    ) {}

    public isReferenceObject(component: any): component is OpenAPIV3_1.ReferenceObject {
        return !!(component as OpenAPIV3_1.ReferenceObject)?.$ref;
    }

    public getComponent(component: OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.SchemaObject): OpenAPIV3_1.SchemaObject {
        if (!this.isReferenceObject(component)) {
            return component;
        }

        const refComponent = this.getComponentByRef<OpenAPIV3_1.SchemaObject>(component.$ref);
        if (!refComponent) {
            throw new Error(`fail to get component "${component.$ref}"`);
        }
        return refComponent;
    }

    public getComponentByRef<T>(path: string): T | undefined {
        if (!path.startsWith('#/components/')) {
            return undefined;
        }

        // Strip '#' and 'components' — this.components is already the components object
        const pathSegments = path.split('/').filter((segment) => segment !== '' && segment !== '#' && segment !== 'components');

        if (pathSegments.length < 1 || !Object.keys(this.components).includes(pathSegments[0])) {
            return undefined;
        }

        return pathSegments.reduce((currentObject: Record<string, any> | undefined, segment) => {
            return currentObject && Object.prototype.hasOwnProperty.call(currentObject, segment) ? currentObject[segment] : undefined;
        }, this.components) as unknown as T;
    }

    public createSchemaComponentFromObject(
        schemeName: string,
        obj: Record<string, OpenAPIV3_1.SchemaObject>,
        customProperties: { default?: any; title?: string } = {}
    ): OpenAPIV3_1.ReferenceObject {
        if (!this.components.schemas) {
            this.components.schemas = {};
        }

        const required: Array<string> = [];
        const properties = Object.fromEntries(
            Object.entries(obj).map(([fieldName, rule]: [string, OpenAPIV3_1.SchemaObject]) => {
                const nextSchemeName = `${schemeName}.${fieldName}`;
                if (rule[EOAExtensions.optional] !== true) {
                    required.push(fieldName);
                }

                return [fieldName, this.createSchemaPartFromRule(nextSchemeName, rule)];
            })
        );

        if (this.components.schemas[schemeName]) {
            this.logger.warn(`Generator - schema ${schemeName} already exist and will be overwrite`);
        }

        this.components.schemas[schemeName] = {
            title: customProperties.title,
            type: 'object',
            properties,
            required: required.length > 0 ? required : undefined,
            default: customProperties.default
        };

        return {
            $ref: `#/components/schemas/${schemeName}`
        };
    }

    public createSchemaPartFromRule(
        nextSchemeName: string,
        rule: OpenAPIV3_1.SchemaObject
    ): OpenAPIV3_1.SchemaObject | OpenAPIV3_1.ReferenceObject {
        const systemParams: tSystemParams = this.extractSystemParams(rule as Record<string, unknown>);

        rule.description = systemParams.description ?? rule.description;
        rule.deprecated = systemParams.deprecated ?? rule.deprecated;

        if (rule.type === 'object' && rule.properties) {
            // `summary` is a valid sibling of a `$ref` (Reference Object) in OpenAPI 3.1, while
            // `title` is a JSON Schema keyword and therefore belongs to the component itself.
            const summary = systemParams.summary;
            return {
                ...(summary !== undefined ? { summary } : {}),
                deprecated: rule.deprecated,
                description: rule.description,
                ...this.createSchemaComponentFromObject(nextSchemeName, rule.properties, {
                    default: rule.default,
                    title: rule.title
                })
            };
        }

        if (rule.type === 'array' && rule.items) {
            return {
                ...rule,
                items: this.createSchemaPartFromRule(nextSchemeName, rule.items as OpenAPIV3_1.SchemaObject)
            };
        }

        if (multiOAProperties.some((property) => rule[property])) {
            let i = 0;
            multiOAProperties.forEach((property) => {
                if (!rule[property]) {
                    return;
                }

                rule[property] = (rule[property] as Array<OpenAPIV3_1.SchemaObject>).map((schema) => {
                    if (schema.type !== 'object') {
                        return schema;
                    }

                    const schemeName = `${nextSchemeName}.${i++}`;

                    return this.createSchemaPartFromRule(schemeName, schema);
                });
            });
        }

        return rule;
    }

    public extractSystemParams(obj: Record<string, unknown> = {}): tSystemParams {
        return {
            optional: obj?.[EOAExtensions.optional] as boolean,
            description: obj?.['description'] as string,
            summary: obj?.['summary'] as string,
            deprecated: obj?.['deprecated'] as boolean
        };
    }

    public removeExtensions<T>(obj: T): T {
        if (Array.isArray(obj)) {
            return obj.map((item) => this.removeExtensions(item)) as T;
        }

        if (typeof obj === 'object' && obj !== null) {
            Object.values(EOAExtensions).forEach((extension) => {
                delete (obj as Record<string, unknown>)[extension];
            });

            return Object.fromEntries(
                Object.entries(obj as Record<string, unknown>).map(([k, v]) => {
                    return [k, this.removeExtensions(v)];
                })
            ) as T;
        }

        return obj;
    }

    public cleanComponents(components: SubOptionalOrFalse<OpenAPIV3_1.ComponentsObject> = {}): OpenAPIV3_1.ComponentsObject {
        return Object.fromEntries(
            Object.entries(components).map(([k, v]: [string, OptionalOrFalse<OpenAPIV3_1.ComponentsObject>]) => [
                k,
                Object.fromEntries(
                    Object.entries((v || {}) as Record<string, unknown>)
                        .map(([key, value]) => (value === false ? undefined : [key, value]))
                        .filter(Boolean) as Array<[string, unknown]>
                )
            ])
        );
    }

    public mergeComponents(c1: OpenAPIV3_1.ComponentsObject, c2: OpenAPIV3_1.ComponentsObject): OpenAPIV3_1.ComponentsObject {
        const result = { ...c1 } as Record<string, unknown>;

        for (const [key, value] of Object.entries(c2)) {
            const valueRecord = value as Record<string, unknown>;
            // Skip empty component sections (preserves previous behaviour)
            if (!Object.keys(valueRecord).length) {
                continue;
            }

            result[key] = {
                ...(result[key] as Record<string, unknown>),
                ...valueRecord
            };
        }

        return result as OpenAPIV3_1.ComponentsObject;
    }
}

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
            throw new Error(`fail to get component "${component.$ref}`);
        }
        return refComponent;
    }

    public getComponentByRef<T>(path: string): T | undefined {
        const pathSegments = path.split('/').filter((segment) => segment !== '');

        if (
            pathSegments.length < 4 ||
            pathSegments[0] !== '#' ||
            pathSegments[1] !== 'components' ||
            !Object.keys(this.components).includes(pathSegments[2])
        ) {
            return undefined;
        }

        return pathSegments.slice(2).reduce((currentObject: Record<string, any> | undefined, segment) => {
            return currentObject && currentObject.hasOwnProperty(segment) ? currentObject[segment] : undefined;
        }, this.components) as unknown as T;
    }

    public _createSchemaComponentFromObject(
        schemeName: string,
        obj: Record<string, OpenAPIV3_1.SchemaObject>,
        customProperties: { default?: any } = {}
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

                return [fieldName, this._createSchemaPartFromRule(nextSchemeName, rule)];
            })
        );

        if (this.components.schemas[schemeName]) {
            this.logger.warn(`Generator - schema ${schemeName} already exist and will be overwrite`);
        }

        this.components.schemas[schemeName] = {
            type: 'object',
            properties,
            required: required.length > 0 ? required : undefined,
            default: customProperties.default
        };

        return {
            $ref: `#/components/schemas/${schemeName}`
        };
    }

    public _createSchemaPartFromRule(
        nextSchemeName: string,
        rule: OpenAPIV3_1.SchemaObject
    ): OpenAPIV3_1.SchemaObject | OpenAPIV3_1.ReferenceObject {
        const systemParams: tSystemParams = this.extractSystemParams(rule as Record<string, unknown>);

        rule.description = systemParams.description ?? rule.description;
        rule.title = systemParams.summary ?? rule.title;
        rule.deprecated = systemParams.deprecated ?? rule.deprecated;

        if (rule.type === 'object' && rule.properties) {
            return {
                summary: rule.title,
                deprecated: rule.deprecated,
                description: rule.description,
                ...this._createSchemaComponentFromObject(nextSchemeName, rule.properties, { default: rule.default })
            };
        }

        if (rule.type === 'array' && rule.items) {
            return {
                ...rule,
                items: this._createSchemaPartFromRule(nextSchemeName, rule.items as OpenAPIV3_1.SchemaObject)
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

                    return this._createSchemaPartFromRule(schemeName, schema);
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
                    // @ts-ignore
                    Object.entries(v)
                        .map(([key, value]) => (value === false ? undefined : [key, value]))
                        .filter(Boolean)
                )
            ])
        );
    }

    public mergeComponents(c1: OpenAPIV3_1.ComponentsObject, c2: OpenAPIV3_1.ComponentsObject): OpenAPIV3_1.ComponentsObject {
        const result = { ...c1 } as Record<string, unknown>;

        for (const [key, value] of Object.entries(c2)) {
            result[key] = {
                ...(result[key] as Record<string, unknown>),
                ...(value as Record<string, unknown>)
            };
        }

        return result as OpenAPIV3_1.ComponentsObject;
    }
}

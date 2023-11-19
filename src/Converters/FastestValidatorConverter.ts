import { FastestValidatorType, Mappers, ObjectRules } from '../types/types.js';
import { getFastestValidatorMappers } from '../mappers.js';
import { ValidationRule, ValidationRuleName, ValidationRuleObject, ValidationSchema, ValidationSchemaMetaKeys } from 'fastest-validator';
import { OpenAPIV3_1 as OA3_1 } from 'openapi-types';
import { EOAExtensions } from '../commons.js';

export class FastestValidatorConverter {
    private readonly mappers: Mappers;

    constructor(private readonly validator: FastestValidatorType) {
        this.mappers = getFastestValidatorMappers({
            getSchemaObjectFromSchema: (...args) => this.getSchemaObjectFromSchema(...args),
            getSchemaObjectFromRule: (...args) => this.getSchemaObjectFromRule(...args)
        });
    }

    public getValidationRules(schema: ValidationSchema): Record<string, ValidationRule> {
        return Object.fromEntries(Object.entries(schema).filter(([k]) => !k.startsWith('$$')) as Array<[string, ValidationRule]>);
    }

    public getMetas(schema: ValidationSchema): ValidationSchemaMetaKeys {
        return Object.fromEntries(Object.entries(schema).filter(([k]) => k.startsWith('$$')));
    }

    public getSchemaObjectFromSchema(schema: ValidationSchema): Record<string, OA3_1.SchemaObject> {
        // if (schema.$$root !== true) {
        return Object.fromEntries(
            Object.entries(this.getValidationRules(schema)).map(([k, v]) => [k, this.getSchemaObjectFromRule(v, undefined, schema)])
        );
        // }

        // delete schema.$$root;
        //
        // return { [ROOT_PROPERTY]: this.getSchemaObjectFromRule(schema as ValidationRule) };
    }

    public getSchemaObjectFromRootSchema(schema: ValidationSchema): OA3_1.SchemaObject {
        if (schema.$$root !== true) {
            throw new Error('this function only support $$root objects');
        }

        delete schema.$$root;

        return this.getSchemaObjectFromRule(schema as ValidationRule);
    }

    public getSchemaObjectFromRule(
        pRule: ValidationRule,
        parentProperties?: Partial<ValidationRuleObject>,
        parentSchema?: ObjectRules
    ): OA3_1.SchemaObject | undefined {
        if (!this.validator || !this.mappers?.string) {
            throw new Error(`bad initialisation . validator ? ${!!this.validator} | string mapper ${!!this.mappers?.string}`);
        }

        //extract known params extensions
        const extensions = (
            [
                {
                    property: '$$t',
                    extension: EOAExtensions.description
                }
            ] as Array<{ property: string; extension: EOAExtensions }>
        ).map(({ property, extension }) => {
            const currentRule = pRule as Record<string, string>;
            const value = (pRule as Record<string, string>)?.[property];

            delete currentRule?.[property];

            return [extension, value];
        });

        const baseRule = this.validator.getRuleFromSchema(pRule as Record<string, string>)?.schema as ValidationRuleObject;
        const rule = {
            ...parentProperties,
            ...baseRule
        };

        const typeMapper: (rule: unknown, parentSchema: unknown) => OA3_1.SchemaObject =
            this.mappers[rule.type as ValidationRuleName] || this.mappers.string; // Utilise le mapper pour string par défaut
        const schema = typeMapper(rule, parentSchema);

        if (!schema) {
            return undefined;
        }

        if (rule.optional) {
            schema[EOAExtensions.optional] = true;
        }

        extensions.forEach(([k, v]) => {
            schema[k] = v;
        });

        return schema;
    }
}

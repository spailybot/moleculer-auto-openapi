import { FastestValidatorType, FVOARuleMetaKeys, Mappers, ObjectRules } from '../types/index.js';
import { getFastestValidatorMappers } from '../mappers.js';
import { ValidationRule, ValidationRuleName, ValidationRuleObject, ValidationSchema, ValidationSchemaMetaKeys } from 'fastest-validator';
import { OpenAPIV3_1 as OA3_1 } from 'openapi-types';
import { EOAExtensions } from '../commons.js';
import { IConverter } from './IConverter.js';

export class FastestValidatorConverter implements IConverter {
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
        const extensions: Array<[string, string | boolean]> =
            Array.isArray(pRule) || typeof pRule !== 'object' || !pRule.$$oa
                ? []
                : (
                      [
                          {
                              property: 'description',
                              extension: EOAExtensions.description
                          },
                          {
                              property: 'summary',
                              extension: EOAExtensions.summary
                          },
                          {
                              property: 'deprecated',
                              extension: EOAExtensions.deprecated
                          }
                      ] as Array<{ property: keyof FVOARuleMetaKeys; extension: EOAExtensions }>
                  ).map(({ property, extension }) => {
                      const value = pRule.$$oa[property];

                      delete pRule.$$oa[property];

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

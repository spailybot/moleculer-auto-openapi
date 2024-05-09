import {
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
    ValidationRuleName
} from 'fastest-validator';
import { FVOARuleMetaKeys, FVOASchemaMetaKeys } from './extensions.js';

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

/**
 * a way to get the type of the fastestValidator object
 */
// @ts-ignore
export type FastestValidatorType = FastestValidatorDefault.default;

declare module 'fastest-validator' {
    interface ValidationSchemaMetaKeys {
        $$oa?: FVOASchemaMetaKeys;
    }
    interface RuleCustom {
        $$oa?: FVOARuleMetaKeys;
    }
}

export * from './extensions.js';

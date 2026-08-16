import FastestValidator from 'fastest-validator';
import type { FastestValidatorType } from '../../src/types/converters/FastestValidator/index.js';

export function createFastestValidator(): FastestValidatorType {
    return new (FastestValidator as unknown as new () => FastestValidatorType)();
}

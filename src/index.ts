/*
 * Inspired by https://github.com/grinat/moleculer-auto-openapi
 */

/// <reference types="openapi-types" />

import { openApiVersionsSupported } from './commons.js';
import { mixin } from './mixin.js';
import type { OA_GENERATE_DOCS_INPUT, OA_GENERATE_DOCS_OUTPUT } from './MoleculerOpenAPIGenerator.js';
import type * as MoleculerWebTypes from './types/moleculer-web.js';

export * from './types/index.js';

/**
 * Use the import you prefer
 */
export default mixin;
export { mixin };
export const OpenApiMixin = mixin;

export { OA_GENERATE_DOCS_INPUT, OA_GENERATE_DOCS_OUTPUT, openApiVersionsSupported, MoleculerWebTypes };

/*
 * Inspired by https://github.com/grinat/moleculer-auto-openapi
 */

/// <reference types="openapi-types" />

import { OPENAPI_VERSIONS_SUPPORTED } from './constants.js';
import { mixin } from './mixin.js';
import type { ServiceSchema } from 'moleculer';
import type { OpenApiMixinSettings } from './types/index.js';
import { Alias } from './objects/Alias.js';
import { Route } from './objects/Route.js';
import { PathAction } from './objects/PathAction.js';
import { HTTP_METHODS, rawHttpMethod, JOKER_METHOD } from './constants.js';
import type * as MoleculerWebTypes from './types/moleculer-web.js';
import { OA_GENERATE_DOCS_INPUT, OA_GENERATE_DOCS_OUTPUT } from './types/openapi.js';
import Converters from './Converters/index.js';

export * from './types/index.js';

/**
 * Use the import you prefer
 */
export default mixin;
export { mixin };
export const OpenApiMixin: ServiceSchema<OpenApiMixinSettings> = mixin as any;

export {
    OA_GENERATE_DOCS_INPUT,
    OA_GENERATE_DOCS_OUTPUT,
    OPENAPI_VERSIONS_SUPPORTED,
    MoleculerWebTypes,
    Alias,
    Route,
    HTTP_METHODS,
    PathAction,
    rawHttpMethod,
    JOKER_METHOD,
    Converters
};

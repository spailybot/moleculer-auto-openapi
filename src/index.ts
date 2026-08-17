/*
 * Inspired by https://github.com/grinat/moleculer-auto-openapi
 */

/// <reference types="openapi-types" />

import { OPENAPI_VERSIONS_SUPPORTED } from './constants.js';
import { mixin } from './mixin.js';
import { Alias } from './objects/Alias.js';
import { Route } from './objects/Route.js';
import { PathAction } from './objects/PathAction.js';
import { HTTP_METHODS, rawHttpMethod, JOKER_METHOD } from './constants.js';
import type * as MoleculerWebTypes from './types/moleculer-web.js';
import { OA_GENERATE_DOCS_INPUT, OA_GENERATE_DOCS_OUTPUT } from './types/openapi.js';
import Converters from './Converters/index.js';
import type { ServiceSchema } from 'moleculer';

export * from './types/index.js';

/**
 * Use the import you prefer
 *
 * The mixin is exposed with Moleculer's default `ServiceSchema` shape so it can be
 * dropped into `mixins`. Moleculer types `mixins` as `Partial<ServiceSchema>` with the
 * default settings generic, which cannot express a mixin carrying custom settings typing.
 * The stricter typing is available as `OpenApiMixinServiceSchema`.
 */
export const OpenApiMixin: ServiceSchema = mixin as unknown as ServiceSchema;
export default OpenApiMixin;
export { OpenApiMixin as mixin };
export type { OpenApiMixinServiceSchema } from './mixin.js';

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

import { AliasRouteSchemaOpenApi, ApiRouteSchema } from '../types/index.js';
import { Alias } from './Alias.js';
import { AliasRouteSchema, ApiSchemaAlias } from '../types/moleculer-web.js';
import { Route } from './Route.js';
import { LoggerInstance } from 'moleculer';
import { isRawHttpMethodFromMWeb } from '../commons.js';
import { HTTP_METHODS, JOKER_METHOD, OA_NAME_REGEXP, REST_METHOD } from '../constants.js';

export class AliasCreator {
    constructor(
        private readonly logger: LoggerInstance,
        private readonly route: Route,
        private readonly aliases: ApiRouteSchema['aliases'] = {},
        private readonly skipUnresolvedActions: boolean = true
    ) {}

    public getAliases(): Array<Alias> {
        return Object.entries(this.aliases ?? {}).flatMap(([name, config]) => {
            const splitName = name.trim().split(/\s+/);
            const defaultPath = splitName.length === 1 ? splitName[0] : splitName[1];
            const defaultMethod = splitName.length > 1 ? splitName[0].toLowerCase() : JOKER_METHOD;

            if (!isRawHttpMethodFromMWeb(defaultMethod)) {
                this.logger.warn(`"${defaultMethod}" is not a valid http method`);
                return [];
            }

            const aliasInformations = this.extractAliasInformation(defaultPath, defaultMethod, config);

            if (!aliasInformations) {
                this.logger.warn(`alias "${name}" from route "${this.route.path}" is skipped`);
                const skippedInfo: AliasRouteSchemaOpenApi = {
                    method: defaultMethod,
                    path: defaultPath,
                    openapi: false
                };
                return this.getSubAliases(skippedInfo).map((a) => {
                    const skippedAlias = new Alias(a, this.route);
                    skippedAlias.skipped = true;
                    return skippedAlias;
                });
            }

            if (aliasInformations.action && !aliasInformations.action.match(OA_NAME_REGEXP)) {
                this.logger.error(
                    `alias "${name}" from route "${this.route.path}" can't be added to openapi . because the name "${
                        aliasInformations.action
                    }" need to match pattern ${OA_NAME_REGEXP.toString()}`
                );
                return this.getSubAliases(aliasInformations).map((a) => {
                    const skippedAlias = new Alias(a, this.route);
                    skippedAlias.skipped = true;
                    return skippedAlias;
                });
            }

            return this.getSubAliases(aliasInformations).map((alias) => new Alias(alias, this.route));
        });
    }

    private extractAliasInformation(
        defaultPath: string,
        defaultMethod: string,
        infos: ApiSchemaAlias
    ): AliasRouteSchemaOpenApi | undefined {
        const isAliasRouteSchema = (v: unknown): v is AliasRouteSchemaOpenApi =>
            !!v &&
            typeof v === 'object' &&
            !Array.isArray(v) &&
            (['action', 'handler', 'openapi', 'type', 'method', 'path'] as Array<keyof AliasRouteSchema>).some(
                (property) => property in (v as AliasRouteSchema)
            );

        if (isAliasRouteSchema(infos)) {
            const res: AliasRouteSchemaOpenApi = {
                ...infos,
                path: infos.path ?? defaultPath,
                method: infos.method ? infos.method.toLowerCase() : defaultMethod
            };

            if (!res.actionType && res.action?.includes(':')) {
                const [actionType, action] = res.action.split(':');
                res.type = actionType;
                res.action = action;
            }

            if (!isRawHttpMethodFromMWeb(res.method!)) {
                this.logger.warn(`"${res.method}" is not a valid http method`);
                return undefined;
            }

            // If no action and no openapi metadata are provided, and skipUnresolvedActions is true, mark as skipped
            if (!res.action && res.openapi === undefined && this.skipUnresolvedActions) {
                res.openapi = false;
            }

            return res;
        }

        if (Array.isArray(infos)) {
            const tmpAction: string | undefined = infos.reduce((info, currentInfo) => {
                /**
                 * do same logic as moleculer-web
                 * https://github.com/moleculerjs/moleculer-web/blob/master/src/alias.js#L63
                 * loop on each item of the array, use string as a configuration, replace previous one
                 */
                if (!currentInfo || typeof currentInfo !== 'string') {
                    return info;
                }

                return currentInfo;
            }, undefined);

            if (!tmpAction && this.skipUnresolvedActions) {
                return undefined;
            }

            const res: AliasRouteSchemaOpenApi = {
                action: tmpAction,
                path: defaultPath,
                method: defaultMethod
            };

            if (!res.actionType && res.action?.includes(':')) {
                const [actionType, action] = res.action.split(':');
                res.type = actionType;
                res.action = action;
            }

            return res;
        }

        if (typeof infos === 'string') {
            const res: AliasRouteSchemaOpenApi = {
                action: infos,
                path: defaultPath,
                method: defaultMethod
            };

            if (!res.actionType && res.action?.includes(':')) {
                const [actionType, action] = res.action.split(':');
                res.type = actionType;
                res.action = action;
            }

            return res;
        }

        if (this.skipUnresolvedActions) {
            return undefined;
        }

        return {
            action: undefined,
            path: defaultPath,
            method: defaultMethod
        };
    }

    private getSubAliases(alias: AliasRouteSchemaOpenApi): Array<AliasRouteSchemaOpenApi> {
        if (alias.method !== REST_METHOD) {
            return [alias];
        }

        const actionName = alias.action;
        const actions: Record<string, { method: HTTP_METHODS; action: string; path: string }> = {
            list: { method: HTTP_METHODS.GET, action: `${actionName}.list`, path: `${alias.path}` },
            get: { method: HTTP_METHODS.GET, action: `${actionName}.get`, path: `${alias.path}/:id` },
            create: { method: HTTP_METHODS.POST, action: `${actionName}.create`, path: `${alias.path}` },
            update: { method: HTTP_METHODS.PUT, action: `${actionName}.update`, path: `${alias.path}/:id` },
            patch: { method: HTTP_METHODS.PATCH, action: `${actionName}.patch`, path: `${alias.path}/:id` },
            remove: { method: HTTP_METHODS.DELETE, action: `${actionName}.remove`, path: `${alias.path}/:id` }
        };

        return Object.entries(actions)
            .filter(([key]) => (alias.only ? alias.only.includes(key) : true) && (alias.except ? !alias.except.includes(key) : true))
            .map(([, v]) => ({ ...alias, ...v }));
    }
}

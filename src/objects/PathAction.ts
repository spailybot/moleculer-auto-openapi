import { Alias } from './Alias.js';
import { DEFAULT_CONTENT_TYPE, HTTP_METHODS } from '../commons.js';
import { ActionOpenApi } from '../types/types.js';
import { ActionSchema } from 'moleculer';
import { OpenApiMerger } from '../OpenApiMerger.js';

export class PathAction {
    public actionType?: string;
    public path: string;
    public method: HTTP_METHODS;
    public action?: ActionSchema;
    public actionName: string;
    public openapi?: ActionOpenApi;

    private alias: Alias;

    constructor(alias: Alias, method: HTTP_METHODS, action: ActionSchema) {
        this.alias = alias;
        this.actionType = alias.type;
        this.path = alias.path;
        this.method = method;

        if (action) {
            this.setAction(action);
        }
    }

    public setAction(action: ActionSchema): void {
        this.action = action;
        //use openapi from action, or from openapi
        this.openapi = OpenApiMerger.mergeActionAndAliasOpenApi(
            this.action.openapi,
            this.alias?.openapi,
            this.alias.route.service.settings.defaultResponseContentType ?? DEFAULT_CONTENT_TYPE
        );
    }
}

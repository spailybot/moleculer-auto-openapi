import { Alias } from './Alias.js';
import { HTTP_METHODS } from '../commons.js';
import { ActionSchema } from 'moleculer';

export class PathAction {
    public actionType?: string;
    public path: string;
    public method: HTTP_METHODS;
    public action?: ActionSchema;
    public actionName: string;

    public get fullPath(): string {
        return this.alias.fullPath;
    }

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
    }
}

import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import { LoggerInstance } from 'moleculer';
import { Route } from '../src/objects/Route.js';
import { AliasRouteSchema, ApiSchemaAlias } from '../src/types/moleculer-web.js';
import { AliasCreator } from '../src/objects/AliasCreator.js';

describe('AliasCreator', () => {
    const logger = {
        warn: console.warn,
        error: console.error
    } as LoggerInstance;

    const fakeFn = jest.fn();
    const aliases: Record<string, ApiSchemaAlias> = {
        add: 'math.add',
        'GET hello': 'test.hello',
        'POST   /hello': 'test.greeter',
        'GET 	greeter/:name': 'test.greeter',
        'POST 	greeting/:name': 'test.greeter',
        custompath: {
            action: 'test.greeter',
            path: 'testPath'
        },
        'GET custom': fakeFn,
        'GET /middleware': [fakeFn, fakeFn, 'test.greeter'],
        'GET /wrong-middleware': [fakeFn],
        'REST posts': 'posts'
    } as const;

    const aliasesResult: Record<keyof typeof aliases, AliasRouteSchema> = {
        // base
        add: {
            action: 'math.add',
            path: '/add',
            method: '*'
        },
        // method in name
        'GET hello': {
            action: 'test.hello',
            path: '/hello',
            method: 'get'
        },
        // multiple spaces
        'POST   /hello': {
            action: 'test.greeter',
            path: '/hello',
            method: 'post'
        },
        // with parameters
        'GET 	greeter/:name': {
            action: 'test.greeter',
            method: 'get',
            path: '/greeter/:name'
        },
        'POST 	greeting/:name': {
            action: 'test.greeter',
            method: 'post',
            path: '/greeting/:name'
        },
        //set path in parameters
        custompath: {
            action: 'test.greeter',
            method: '*',
            path: '/testPath'
        },
        //skip custom function
        'GET custom': {
            action: null,
            method: 'get',
            path: '/custom'
        },
        //take information from last middleware
        'GET /middleware': {
            action: 'test.greeter',
            method: 'get',
            path: '/middleware'
        },
        //handle array without action
        'GET /wrong-middleware': {
            action: null,
            method: 'get',
            path: '/wrong-middleware'
        },
        //rest method
        'REST posts': {
            action: 'posts',
            method: 'rest',
            path: '/posts'
        }
    };

    describe('with skipUnResolved true', () => {
        it.each<[string, ApiSchemaAlias, AliasRouteSchema | undefined]>(Object.entries(aliases).map(([k, v]) => [k, v, aliasesResult[k]]))(
            `test alias %s with skipUnResolved`,
            (aliasName, alias, result) => {
                const route = new Route(logger, {
                    path: '/'
                });

                const aliases = new AliasCreator(logger, route, { [aliasName]: alias }, true).getAliases();
                const resAlias = aliases[0];

                if (resAlias === undefined) {
                    expect(result?.action === null).toBeTruthy();
                } else {
                    expect(JSON.parse(JSON.stringify(resAlias))).toStrictEqual(result);
                }
            }
        );
    });

    describe('with skipUnResolved false', () => {
        it.each<[string, ApiSchemaAlias, AliasRouteSchema | undefined]>(Object.entries(aliases).map(([k, v]) => [k, v, aliasesResult[k]]))(
            `test alias %s with skipUnResolved false`,
            (aliasName, alias, result) => {
                const route = new Route(logger, {
                    path: '/'
                });

                const aliases = new AliasCreator(logger, route, { [aliasName]: alias }, false).getAliases();
                const resAlias = aliases[0];

                expect(JSON.parse(JSON.stringify(resAlias))).toStrictEqual(result);
            }
        );
    });
});

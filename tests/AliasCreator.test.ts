import { describe, expect, it, vi } from 'vitest';
import { LoggerInstance, Service } from 'moleculer';
import { Route } from '../src/objects/Route.js';
import { AliasRouteSchema, ApiSchemaAlias } from '../src/types/moleculer-web.js';
import { AliasCreator } from '../src/objects/AliasCreator.js';
import { ApiSettingsSchemaOpenApi, OpenApiMixinSettings } from '../src/index.js';

describe('AliasCreator', () => {
    const logger = {
        warn: console.warn,
        error: console.error
    } as LoggerInstance;

    const fakeFn = vi.fn();
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
        'GET /middleware': [fakeFn, fakeFn, 'test.greeter1', 'test.greeter', fakeFn],
        'GET /wrong-middleware': [fakeFn],
        'REST posts': 'posts',
        'GET /raw-disabled': {
            handler: fakeFn,
            openapi: false
        },
        'GET /raw-auto-skip': {
            handler: fakeFn
        },
        'GET /raw-documented': {
            handler: fakeFn,
            openapi: {
                summary: 'SSE Stream'
            }
        }
    } as const;

    const aliasesResult: Record<keyof typeof aliases, Array<AliasRouteSchema>> = {
        // base
        add: [
            {
                action: 'math.add',
                path: '/add',
                method: '*'
            }
        ],
        // method in name
        'GET hello': [
            {
                action: 'test.hello',
                path: '/hello',
                method: 'get'
            }
        ],
        // multiple spaces
        'POST   /hello': [
            {
                action: 'test.greeter',
                path: '/hello',
                method: 'post'
            }
        ],
        // with parameters
        'GET 	greeter/:name': [
            {
                action: 'test.greeter',
                method: 'get',
                path: '/greeter/:name'
            }
        ],
        'POST 	greeting/:name': [
            {
                action: 'test.greeter',
                method: 'post',
                path: '/greeting/:name'
            }
        ],
        //set path in parameters
        custompath: [
            {
                action: 'test.greeter',
                method: '*',
                path: '/testPath'
            }
        ],
        //skip custom function
        'GET custom': [
            {
                method: 'get',
                path: '/custom'
            }
        ],
        //take information from last string
        'GET /middleware': [
            {
                action: 'test.greeter',
                method: 'get',
                path: '/middleware'
            }
        ],
        //handle array without action
        'GET /wrong-middleware': [
            {
                method: 'get',
                path: '/wrong-middleware'
            }
        ],
        //rest method
        'REST posts': [
            {
                action: 'posts.list',
                method: 'get',
                path: '/posts'
            },
            {
                action: 'posts.get',
                method: 'get',
                path: '/posts/:id'
            },
            {
                action: 'posts.create',
                method: 'post',
                path: '/posts'
            },
            {
                action: 'posts.update',
                method: 'put',
                path: '/posts/:id'
            },
            {
                action: 'posts.patch',
                method: 'patch',
                path: '/posts/:id'
            },
            {
                action: 'posts.remove',
                method: 'delete',
                path: '/posts/:id'
            }
        ],
        'GET /raw-disabled': [
            {
                method: 'get',
                path: '/raw-disabled'
            }
        ],
        'GET /raw-auto-skip': [
            {
                method: 'get',
                path: '/raw-auto-skip'
            }
        ],
        'GET /raw-documented': [
            {
                method: 'get',
                path: '/raw-documented',
                openapi: {
                    summary: 'SSE Stream'
                }
            }
        ]
    };

    const service = {} as Service<OpenApiMixinSettings>;
    const fakeService = {} as Service<ApiSettingsSchemaOpenApi>;

    describe('with skipUnResolved true', () => {
        it.each<[string, ApiSchemaAlias, Array<AliasRouteSchema>]>(Object.entries(aliases).map(([k, v]) => [k, v, aliasesResult[k]]))(
            `test alias %s with skipUnResolved`,
            (aliasName, alias, result) => {
                const route = new Route(
                    logger,
                    {
                        path: '/'
                    },
                    fakeService,
                    service
                );

                // @ts-ignore
                const aliases = new AliasCreator(logger, route, { [aliasName]: alias }, true).getAliases();

                expect(JSON.parse(JSON.stringify(aliases))).toStrictEqual(expect.arrayContaining(result.map(x => expect.objectContaining(x))));
            }
        );

        it('marks raw handlers without openapi or with openapi: false as skipped', () => {
            const route = new Route(logger, { path: '/' }, fakeService, service);
            const creator = new AliasCreator(
                logger,
                route,
                {
                    'GET /custom': fakeFn,
                    'GET /raw-disabled': { handler: fakeFn, openapi: false },
                    'GET /raw-auto-skip': { handler: fakeFn },
                    'GET /raw-documented': { handler: fakeFn, openapi: { summary: 'SSE Stream' } }
                },
                true
            );
            const res = creator.getAliases();

            const customAlias = res.find((a) => a.path === '/custom');
            expect(customAlias?.skipped).toBe(true);

            const disabledAlias = res.find((a) => a.path === '/raw-disabled');
            expect(disabledAlias?.skipped).toBe(true);

            const autoSkipAlias = res.find((a) => a.path === '/raw-auto-skip');
            expect(autoSkipAlias?.skipped).toBe(true);

            const documentedAlias = res.find((a) => a.path === '/raw-documented');
            expect(documentedAlias?.skipped).toBe(false);
            expect(documentedAlias?.openapi).toEqual({ summary: 'SSE Stream' });
        });
    });

    describe('with skipUnResolved false', () => {
        it.each<[string, ApiSchemaAlias, AliasRouteSchema | undefined]>(Object.entries(aliases).map(([k, v]) => [k, v, aliasesResult[k]]))(
            `test alias %s with skipUnResolved false`,
            (aliasName, alias, result) => {
                const route = new Route(
                    logger,
                    {
                        path: '/'
                    },
                    fakeService,
                    service,
                    false
                );

                // @ts-ignore
                const aliases = new AliasCreator(logger, route, { [aliasName]: alias }, false).getAliases();

                expect(JSON.parse(JSON.stringify(aliases))).toStrictEqual(expect.arrayContaining(result?.map(x => expect.objectContaining(x)) || []));
            }
        );
    });
});

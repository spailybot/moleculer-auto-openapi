import { describe, expect, it } from 'vitest';
import { mixin } from '../../src/mixin.js';
import { ServiceBroker } from 'moleculer';
import { OpenapiService } from '../datas/services/openapi.service.js';
import { setupBroker } from './commons.js';
import { routes } from '../datas/routes.js';

describe('cache.enabled context binding', () => {
    const generateDocsAction = mixin.actions?.generateDocs as any;
    const cacheConfig = generateDocsAction?.cache;

    it('should be defined as a function on generateDocs action', () => {
        expect(cacheConfig).toBeDefined();
        expect(typeof cacheConfig.enabled).toBe('function');
    });

    it('should return true when this is undefined (no context)', () => {
        const enabledFn = cacheConfig.enabled;
        expect(enabledFn.call(undefined)).toBe(true);
    });

    it('should return true when this has no settings property (e.g. Cacher context)', () => {
        const enabledFn = cacheConfig.enabled;
        const fakeCacherContext = { name: 'RedisCacher', opts: {} };
        expect(enabledFn.call(fakeCacherContext)).toBe(true);
    });

    it('should return true when settings.cacheOpenApi is undefined', () => {
        const enabledFn = cacheConfig.enabled;
        const serviceContext = { settings: {} };
        expect(enabledFn.call(serviceContext)).toBe(true);
    });

    it('should return true when settings.cacheOpenApi is true', () => {
        const enabledFn = cacheConfig.enabled;
        const serviceContext = { settings: { cacheOpenApi: true } };
        expect(enabledFn.call(serviceContext)).toBe(true);
    });

    it('should return false when settings.cacheOpenApi is explicitly false', () => {
        const enabledFn = cacheConfig.enabled;
        const serviceContext = { settings: { cacheOpenApi: false } };
        expect(enabledFn.call(serviceContext)).toBe(false);
    });

    describe('integration with active Cacher in ServiceBroker', () => {
        it('should generate docs and cache response without throwing TypeError', async () => {
            const broker = new ServiceBroker({
                logger: false,
                cacher: 'Memory'
            });

            try {
                await setupBroker(broker, undefined, [routes.base]);

                // First call populates cache
                const doc1 = await broker.call(`${OpenapiService.name}.generateDocs`);
                expect(doc1).toBeDefined();
                expect((doc1 as any).openapi).toBe('3.1.0');

                // Second call retrieves from cache
                const doc2 = await broker.call(`${OpenapiService.name}.generateDocs`);
                expect(doc2).toEqual(doc1);
            } finally {
                await broker.stop();
            }
        });

        it('should clean all cached versions of generateDocs when routes are regenerated', async () => {
            const broker = new ServiceBroker({
                logger: false,
                cacher: 'Memory'
            });

            try {
                await setupBroker(broker, undefined, [routes.base]);

                const cacheKeys = [
                    `${OpenapiService.name}.generateDocs`,
                    `${OpenapiService.name}.generateDocs|3.1.0`,
                    `${OpenapiService.name}.generateDocs|3.1`
                ];

                // Populate the cache with the keys used by the generateDocs keygen
                for (const key of cacheKeys) {
                    await broker.cacher!.set(key, { openapi: '3.1.0' });
                }
                expect((broker.cacher as any).cache.size).toBe(cacheKeys.length);

                // Emit the event that triggers the cache cleanup
                await broker.emit('$api.aliases.regenerated');

                // All cached versions must be removed
                expect((broker.cacher as any).cache.size).toBe(0);
            } finally {
                await broker.stop();
            }
        });
    });
});

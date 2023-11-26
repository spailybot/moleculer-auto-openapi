import * as url from 'url';
import { ServiceBroker } from 'moleculer';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import * as fs from 'fs';

import * as path from 'path';
import { OpenapiService } from '../datas/services/openapi.service.js';
import { Readable } from 'stream';
import { routes } from '../datas/routes.js';
import { registerSchemaValidation, setupBroker } from './commons.js';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

describe("Test 'openapi' mixin", () => {
    const broker = new ServiceBroker({
        logger: false,
        cacher: 'memory'
    });

    beforeAll(async () => {
        await setupBroker(broker, undefined, [routes.base]);
    });

    afterAll(() => broker.stop());

    registerSchemaValidation(broker);

    it('generate schema json file', async () => {
        expect.assertions(1);

        const doc = await broker.call(`${OpenapiService.name}.generateDocs`);

        const expectedJSONPath = path.join(__dirname, '..', 'datas', 'expectedSchema.json');
        const expectedSchema = JSON.parse(fs.readFileSync(expectedJSONPath).toString());

        // @ts-ignore
        const json = JSON.stringify(doc, ' ', 2);
        fs.writeFileSync(path.join(path.dirname(expectedJSONPath), 'receivedSchema.json'), json);

        // check json https://editor.swagger.io/
        //console.log(JSON.stringify(json, null, ""));
        expect(JSON.parse(json)).toEqual(expectedSchema);
    });

    it('Asset is returned as a stream', async () => {
        const file = 'swagger-ui-bundle.js.map';
        const swaggerPath = (await import('swagger-ui-dist')).getAbsoluteFSPath();

        const stream = await broker.call<Readable, { file: string }>(`${OpenapiService.name}.assets`, { file });

        const expected = fs.readFileSync(path.join(swaggerPath, file)).toString();

        let buffer = '';
        for await (const chunk of stream) {
            buffer += chunk;
        }

        expect(stream).toBeInstanceOf(fs.ReadStream);
        expect(buffer).toEqual(expected);
    });
});

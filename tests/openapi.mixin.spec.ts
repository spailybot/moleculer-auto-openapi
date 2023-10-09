import { ApiService } from './datas/services/api.service.js';
import url from 'url';
import { ServiceBroker } from 'moleculer';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import fs from 'fs';

import path from 'path';
import { Validator } from '@seriousme/openapi-schema-validator';
import { testMappersService } from './datas/services/test-mappers.service';
import { OpenapiService } from './datas/services/openapi.service.js';
import { SomeService } from './datas/services/some.service.js';
import { openApiVersionsSupported } from '../src/commons.js';
import { OA_GENERATE_DOCS_INPUT, OA_GENERATE_DOCS_OUTPUT } from '../src/MoleculerOpenAPIGenerator.js';
import { Readable, Stream } from 'stream';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

describe("Test 'openapi' mixin", () => {
    const broker = new ServiceBroker({
        logger: false,
        cacher: 'memory'
    });
    broker.createService(testMappersService);
    broker.createService(SomeService);
    broker.createService(OpenapiService);
    broker.createService(ApiService);

    beforeAll(async () => {
        await broker.start();

        await broker.waitForServices([testMappersService.name, OpenapiService.name, ApiService.name]);
    });

    afterAll(() => broker.stop());

    describe('schema validation', () => {
        it.each<openApiVersionsSupported>(['3.1'])(`generate a valid openapi %s documentation`, async (OAVersion) => {
            expect(Validator.supportedVersions.has(OAVersion));

            const json = await broker.call<OA_GENERATE_DOCS_OUTPUT, OA_GENERATE_DOCS_INPUT>(`${OpenapiService.name}.generateDocs`, {
                version: OAVersion as openApiVersionsSupported
            });
            const validator = new Validator();
            const res = await validator.validate(json);

            expect(res.errors).toBeUndefined();
            expect(res.valid).toBeTruthy();
        });
    });

    it('generate schema json file', async () => {
        expect.assertions(1);

        const json = await broker.call(`${OpenapiService.name}.generateDocs`);

        const expectedJSONPath = path.join(__dirname, 'datas', 'expectedSchema.json');
        const expectedSchema = JSON.parse(fs.readFileSync(expectedJSONPath).toString());

        // @ts-ignore
        fs.writeFileSync(path.join(path.dirname(expectedJSONPath), 'receivedSchema.json'), JSON.stringify(json, ' ', 2));

        // check json https://editor.swagger.io/
        //console.log(JSON.stringify(json, null, ""));
        expect(json).toMatchObject(expectedSchema);
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

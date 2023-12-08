import { ServiceSchema } from 'moleculer';

export const EdgeService: ServiceSchema = {
    name: 'edge',
    settings: {
        openapi: {
            tags: ['edge']
        }
    },
    actions: {
        named: {
            rest: 'GET /named',
            name: "I'm Heisenberg",
            handler() {}
        }
    }
};

import { ServiceSchema } from 'moleculer';

export const FalseService: ServiceSchema = {
    name: 'false',
    settings: {
        openapi: false
    },
    actions: {
        action: {
            name: `you can't see me`,
            openapi: false,
            handler: () => {}
        }
    }
};

import { ServiceSchema } from 'moleculer';

export const FalseService: ServiceSchema = {
    name: 'false',
    settings: {
        openapi: false
    },
    actions: {
        hidden: {
            openapi: false,
            handler: () => {}
        }
    }
};

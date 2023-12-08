import { ServiceSchema } from 'moleculer';

export const MergeBySvcService: ServiceSchema = {
    name: 'merge-service',
    //version: 2,

    settings: {
        rest: 'mergeByService/',
        openapi: {
            components: {
                schemas: {
                    ServiceLevelComponent: {
                        type: 'object',
                        properties: {
                            _id: {
                                type: 'integer',
                                format: 'int64'
                            }
                        }
                    }
                }
            },
            responses: {
                '403': {
                    description: 'service response'
                }
            },
            deprecated: true
        }
    },

    actions: {
        action: {
            openapi: {
                components: {
                    schemas: {
                        ActionLevelComponent: {
                            type: 'object',
                            properties: {
                                _id: {
                                    type: 'integer',
                                    format: 'int64'
                                }
                            }
                        }
                    }
                },
                responses: {
                    '404': {
                        description: 'action response'
                    }
                },
                response: {
                    description: 'action success response'
                }
            },
            handler(ctx) {}
        }
    },

    methods: {}
};

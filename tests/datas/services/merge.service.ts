import { ServiceSchema } from 'moleculer';

export const MergeService: ServiceSchema = {
    name: 'merge',
    //version: 2,

    settings: {
        rest: 'merge/',
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
            }
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
        },
        mergeNoResponse: {
            openapi: {
                responses: {
                    //remove route and alias responses . But keep the service one
                    '401': false,
                    '402': false
                }
            },
            handler: () => {}
        }
    },

    methods: {}
};

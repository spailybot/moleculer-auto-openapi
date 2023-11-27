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
                    },
                    RouteLevelErasedByServiceComponent: {
                        type: 'object',
                        properties: {
                            service: {
                                type: 'integer',
                                format: 'int64'
                            }
                        }
                    }
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
                        },
                        RouteLevelErasedByActionComponent: {
                            type: 'object',
                            properties: {
                                action: {
                                    type: 'integer',
                                    format: 'int64'
                                }
                            }
                        }
                    }
                }
            },
            handler(ctx) {}
        }
    },

    methods: {}
};

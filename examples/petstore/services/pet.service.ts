import { Context, Service, ServiceBroker, ServiceSettingSchema } from 'moleculer';
import { ActionOpenApi, MoleculerWebTypes } from '@spailybot/moleculer-auto-openapi';
import { IPet } from './objects/IPet';
import { generatePets } from './objects/commons';
import { RuleNumber } from 'fastest-validator';

const fakePets: Array<IPet> = generatePets(20);

export default class PetService extends Service<ServiceSettingSchema & MoleculerWebTypes.RestServiceSettings> {
    constructor(broker: ServiceBroker) {
        super(broker);

        this.parseServiceSchema({
            name: 'pet',
            settings: {
                openapi: {
                    tags: [
                        // null tell to remove previous tags added
                        null,
                        // Object, allow to describe a tag
                        {
                            name: 'Pet',
                            description: 'Endpoints linked with pet management'
                        },
                        // string will set the tags for children
                        'Pet'
                    ],
                    components: {
                        schemas: {
                            Pet: {
                                required: ['name', 'photoUrls'],
                                type: 'object',
                                properties: {
                                    id: {
                                        type: 'integer',
                                        format: 'int64',
                                        example: 10
                                    },
                                    name: {
                                        type: 'string',
                                        example: 'doggie'
                                    },
                                    category: {
                                        $ref: '#/components/schemas/Category'
                                    },
                                    photoUrls: {
                                        type: 'array',
                                        xml: {
                                            wrapped: true
                                        },
                                        items: {
                                            type: 'string',
                                            xml: {
                                                name: 'photoUrl'
                                            }
                                        }
                                    },
                                    tags: {
                                        type: 'array',
                                        xml: {
                                            wrapped: true
                                        },
                                        items: {
                                            $ref: '#/components/schemas/Tag'
                                        }
                                    },
                                    status: {
                                        type: 'string',
                                        description: 'pet status in the store',
                                        enum: ['available', 'pending', 'sold']
                                    }
                                }
                            },
                            Tag: {
                                type: 'object',
                                properties: {
                                    id: {
                                        type: 'integer',
                                        format: 'int64'
                                    },
                                    name: {
                                        type: 'string'
                                    }
                                }
                            },
                            Category: {
                                type: 'object',
                                properties: {
                                    id: {
                                        type: 'integer',
                                        format: 'int64',
                                        example: 1
                                    },
                                    name: {
                                        type: 'string',
                                        example: 'Dogs'
                                    }
                                }
                            }
                        }
                    }
                },
                rest: '/pet'
            },
            actions: {
                update: {
                    rest: 'PUT /',
                    openapi: {
                        summary: 'Update an existing pet',
                        description: 'Update an existing pet by Id',
                        operationId: 'updatePet',
                        security: [
                            {
                                myAuth: []
                            }
                        ]
                    } as ActionOpenApi,
                    params: {
                        id: {
                            type: 'number',
                            optional: true
                        },
                        name: 'string',
                        category: {
                            $$type: 'object|optional',
                            id: 'number|optional',
                            name: 'string|optional'
                        },
                        photoUrls: 'string[]',
                        tags: [
                            {
                                $$type: 'object|optional',
                                id: 'number|optional',
                                name: 'string|optional'
                            }
                        ],
                        status: {
                            $$oa: {
                                description: 'pet status in the store'
                            },
                            type: 'enum',
                            optional: true,
                            values: ['available', 'pending', 'sold']
                        }
                    },
                    handler: (ctx) => {
                        this.logger.info('update pet with : ', ctx.params);
                    }
                },
                list: {
                    rest: 'GET /',
                    openapi: {
                        response: {
                            schema: {
                                type: 'object',
                                properties: {
                                    data: {
                                        type: 'array',
                                        items: {
                                            $ref: '#/components/schemas/Pet'
                                        }
                                    },
                                    current_page: {
                                        type: 'number'
                                    },
                                    per_page: {
                                        type: 'number'
                                    },
                                    total_pages: {
                                        type: 'number'
                                    }
                                }
                            }
                        }
                    },
                    params: {
                        page: {
                            type: 'number',
                            optional: true,
                            default: 0,
                            convert: true
                        } as RuleNumber,
                        per_page: {
                            type: 'number',
                            optional: true,
                            default: 5,
                            convert: true
                        }
                    },
                    handler: (ctx: Context<{ page: number; per_page: number }>) => {
                        const { page, per_page } = ctx.params;

                        const offset = page * per_page;
                        const paginatedItems = fakePets.slice(offset, offset + per_page);
                        return {
                            data: paginatedItems,
                            current_page: page,
                            per_page: per_page,
                            total_pages: Math.ceil(fakePets.length / per_page)
                        };
                    }
                }
            }
        });
    }
}

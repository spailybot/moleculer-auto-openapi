import { Context, Service, ServiceBroker, ServiceSettingSchema } from 'moleculer';
import { ActionOpenApi, MoleculerWebTypes } from '@spailybot/moleculer-auto-openapi';
import { IPet, IPetFilters } from './objects/IPet';
import { generatePets, MoleculerWebMetas } from './objects/commons';
import { RuleArray, RuleMulti, RuleNumber, RuleObject } from 'fastest-validator';
import ApiGateway from 'moleculer-web';
import { EStatus } from './objects/EStatus';
import { ITag } from './objects/ITag';
import { OpenAPIV3_1 } from 'openapi-types';

let fakePets: Array<IPet> = generatePets(5);

export default class PetsService extends Service<ServiceSettingSchema & MoleculerWebTypes.RestServiceSettings> {
    constructor(broker: ServiceBroker) {
        super(broker);

        this.parseServiceSchema({
            name: 'pets',
            settings: {
                openapi: {
                    tags: [
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
                                required: ['id', 'name', 'photoUrls'],
                                type: 'object',
                                properties: {
                                    id: {
                                        type: 'integer',
                                        format: 'int64',
                                        examples: [10]
                                    },
                                    name: {
                                        type: 'string',
                                        examples: ['doggie']
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
                                        examples: [1]
                                    },
                                    name: {
                                        type: 'string',
                                        examples: ['Dogs']
                                    }
                                }
                            }
                        }
                    }
                },
                rest: '/pets'
            },
            actions: {
                update: {
                    rest: 'PUT /:id',
                    openapi: {
                        summary: 'Update an existing pet',
                        description: 'Update an existing pet by Id',
                        operationId: 'updatePet',
                        security: [
                            {
                                myAuth: []
                            }
                        ],
                        response: {
                            schema: {
                                $ref: '#/components/schemas/Pet'
                            }
                        }
                    } as ActionOpenApi,
                    params: {
                        id: {
                            type: 'number',
                            convert: true
                        },
                        name: 'string',
                        category: {
                            $$type: 'object|optional',
                            id: 'number|optional',
                            name: 'string|optional'
                        },
                        photoUrls: [{ type: 'string', optional: true }],
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
                            values: Object.values(EStatus)
                        }
                    },
                    handler: (ctx: Context<IPet>) => {
                        const petParams = ctx.params;
                        const { id } = petParams;

                        const pet = fakePets.find((p) => p.id === id);
                        if (!pet) {
                            throw new ApiGateway.Errors.NotFoundError('pet not found', {
                                id
                            });
                        }

                        // @ts-ignore
                        Object.entries(petParams).forEach(([k, v]) => (pet[k] = v));

                        this.logger.info('update pet with : ', ctx.params);
                    }
                },
                get: {
                    rest: 'GET /:id',
                    openapi: {
                        summary: "Get a pet by it's ID",
                        operationId: 'getPet',
                        response: {
                            schema: {
                                $ref: '#/components/schemas/Pet'
                            }
                        }
                    } as ActionOpenApi,
                    params: {
                        id: {
                            type: 'number',
                            convert: true
                        }
                    },
                    handler: (ctx: Context<IPet>) => {
                        const petParams = ctx.params;
                        const { id } = petParams;

                        const pet = fakePets.find((p) => p.id === id);
                        if (!pet) {
                            throw new ApiGateway.Errors.NotFoundError('pet not found', {
                                id
                            });
                        }

                        // @ts-ignore
                        Object.entries(petParams).forEach(([k, v]) => (pet[k] = v));

                        this.logger.info('update pet with : ', ctx.params);
                    }
                },
                list: {
                    rest: 'GET /',
                    openapi: {
                        summary: 'Pet Listing',
                        description: 'Allow to list all the pets',
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
                        },
                        filters: {
                            type: 'object',
                            optional: true,
                            properties: {
                                id: {
                                    type: 'number',
                                    optional: true,
                                    convert: true
                                },
                                name: 'string|optional',
                                status: {
                                    $$oa: {
                                        description: 'pet status in the store'
                                    },
                                    type: 'enum',
                                    optional: true,
                                    values: Object.values(EStatus)
                                },
                                category: {
                                    type: 'multi',
                                    optional: true,
                                    rules: [
                                        {
                                            type: 'string'
                                        },
                                        {
                                            type: 'number',
                                            convert: true
                                        }
                                    ]
                                } as RuleMulti,
                                tags: {
                                    type: 'multi',
                                    optional: true,
                                    rules: [
                                        {
                                            type: 'number',
                                            convert: true
                                        },
                                        {
                                            type: 'string'
                                        },
                                        {
                                            type: 'array',
                                            items: {
                                                type: 'number',
                                                convert: true
                                            }
                                        } as RuleArray
                                    ]
                                } as RuleMulti
                            },
                            default: {}
                        } as RuleObject
                    },
                    handler: (ctx: Context<{ page: number; per_page: number; filters?: IPetFilters }>) => {
                        const { page, per_page, filters } = ctx.params;

                        let filteredPets = fakePets;
                        if (filters) {
                            this.logger.info('list ask to filter with ', filters);
                            filteredPets = Object.entries(filters).reduce((pets, currentValue) => {
                                const [key, value] = currentValue;
                                if (key === 'tags') {
                                    return pets.filter((p) => p.tags?.some((t) => this.filterByTag(t, value)));
                                }
                                if (key === 'category') {
                                    return pets.filter((p) =>
                                        typeof value === 'number' ? p.category?.id === value : p.category?.name === value
                                    );
                                }

                                // @ts-ignore
                                return pets.filter((p) => p[key] == value);
                            }, filteredPets);
                        }

                        const offset = page * per_page;
                        const paginatedItems = filteredPets.slice(offset, offset + per_page);
                        return {
                            data: paginatedItems,
                            current_page: page,
                            per_page: per_page,
                            total_pages: Math.ceil(filteredPets.length / per_page)
                        };
                    }
                },
                create: {
                    rest: 'POST /',
                    openapi: {
                        security: [
                            {
                                myAuth: []
                            }
                        ],
                        responses: {
                            '200': false,
                            '201': {
                                description: 'created',
                                content: {
                                    'application/json': {
                                        schema: {
                                            $ref: '#/components/schemas/Pet'
                                        }
                                    }
                                }
                            } as OpenAPIV3_1.ResponseObject
                        }
                    } as ActionOpenApi,
                    params: {
                        name: 'string',
                        category: {
                            $$type: 'object|optional',
                            id: 'number|optional',
                            name: 'string|optional'
                        },
                        photoUrls: 'string[]',
                        tags: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: 'number|optional',
                                    name: 'string|optional'
                                }
                            } as RuleObject
                        } as RuleArray,
                        status: {
                            $$oa: {
                                description: 'pet status in the store'
                            },
                            type: 'enum',
                            optional: true,
                            values: ['available', 'pending', 'sold']
                        }
                    },
                    handler: (ctx: Context<IPet, MoleculerWebMetas>) => {
                        this.logger.info('pet created with : ', ctx.params);
                        const pet = ctx.params;
                        pet.id = fakePets.length + 1;

                        fakePets.push(pet);

                        ctx.meta.$statusCode = 201;

                        return pet;
                    }
                },
                delete: {
                    rest: 'DELETE /:id',
                    openapi: {
                        security: [
                            {
                                myAuth: []
                            }
                        ],
                        responses: {
                            '200': false,
                            '204': {
                                description: 'no content'
                            }
                        }
                    } as ActionOpenApi,
                    params: {
                        id: {
                            type: 'number',
                            convert: true
                        }
                    },
                    handler: (ctx: Context<{ id: number }, MoleculerWebMetas>) => {
                        const { id } = ctx.params;
                        this.logger.info(`delete pet id ${id}`);

                        fakePets = fakePets.filter((p) => p.id !== id);

                        ctx.meta.$statusCode = 204;
                        return 'deleted';
                    }
                },
                upload_image: {
                    params: {
                        fieldName: 'string|optional'
                    },
                    handler: (ctx: Context<NodeJS.ReadableStream, MoleculerWebMetas>) => {
                        this.logger.info(`Received an image upload ! `, {
                            $multipart: ctx.meta.$multipart,
                            fieldname: ctx.meta.fieldname,
                            filename: ctx.meta.filename,
                            encoding: ctx.meta.encoding,
                            mimetype: ctx.meta.mimetype,
                            $params: ctx.meta.$params
                        });

                        return new Promise<void>((resolve, reject) => {
                            const fileStream = ctx.params;

                            fileStream.on('error', (err: Error) => {
                                this.logger.info('File error received', err.message);
                                reject(err);
                            });

                            let dataSize = 0;
                            fileStream.on('data', (chunk) => {
                                dataSize += chunk.length;
                                while (fileStream.read() !== null) {
                                    // just read data and nothing to do.
                                }
                            });

                            fileStream.on('end', () => {
                                this.logger.info(`File totally received. Read ${dataSize} bytes`);
                                resolve();
                            });
                        });
                    }
                }
            }
        });
    }

    private filterByTag(tag: ITag, filter: string | number | Array<number | string>): boolean {
        if (Array.isArray(filter)) {
            return filter.some((f) => this.filterByTag(tag, f));
        }

        if (typeof filter === 'number') {
            return tag.id == filter;
        }

        return tag.name == filter;
    }
}

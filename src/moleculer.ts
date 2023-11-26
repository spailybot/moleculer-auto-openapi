import { OpenAPIV3_1 as OA3_1 } from 'openapi-types';

/**
 * schemas
 */

// Standard moleculer schemas
const DbMixinList: OA3_1.SchemaObject = {
    type: 'object',
    properties: {
        rows: {
            type: 'array',
            items: {
                type: 'object'
            }
        },
        totalCount: {
            type: 'number'
        }
    }
};
const DbMixinFindList: OA3_1.SchemaObject = {
    type: 'array',
    items: {
        type: 'object'
    }
};
const Item: OA3_1.SchemaObject = {
    type: 'object'
};
const Error: OA3_1.SchemaObject = {
    type: 'object',
    properties: {
        name: {
            examples: ['InternalServerError'],
            type: 'string',
            description: 'The name of the error'
        },
        message: {
            examples: ['Example'],
            type: 'string',
            description: 'an helping message'
        },
        code: {
            type: 'number',
            description: 'the status code of the error (can be different of the HTTP status code)'
        },
        type: {
            type: 'string',
            description: 'additional information for the error'
        },
        data: {
            type: 'object'
        }
    },
    required: ['name', 'message', 'code']
};

/**
 * RESPONSES
 */
const ServerError: OA3_1.ResponseObject = {
    // extends: 'Error',
    description: 'Server errors: 500, 501, 400, 404 and etc...',
    content: {
        'application/json': {
            schema: {
                allOf: [
                    { $ref: '#/components/schemas/Error' },
                    {
                        examples: [
                            {
                                name: 'InternalServerError',
                                message: 'Internal Server Error',
                                code: 500
                            }
                        ]
                    }
                ]
            }
        }
    }
};

const UnauthorizedError: OA3_1.ResponseObject = {
    description: 'Need auth',
    content: {
        'application/json': {
            schema: {
                allOf: [
                    { $ref: '#/components/schemas/Error' },
                    {
                        type: 'object',
                        examples: [
                            {
                                name: 'UnAuthorizedError',
                                message: 'Unauthorized',
                                code: 401
                            }
                        ]
                    }
                ]
            }
        }
    }
};
const ValidationError: OA3_1.ResponseObject = {
    description: 'Fields invalid',
    content: {
        'application/json': {
            schema: {
                allOf: [
                    { $ref: '#/components/schemas/Error' },
                    {
                        type: 'object',
                        examples: [
                            {
                                name: 'MoleculerClientError',
                                message: 'Error message',
                                code: 422,
                                data: [
                                    { name: 'fieldName', message: 'Field invalid' },
                                    { name: 'arrayField[0].fieldName', message: 'Whats wrong' },
                                    { name: 'object.fieldName', message: 'Whats wrong' }
                                ]
                            }
                        ]
                    }
                ]
            }
        }
    }
};
const ReturnedData: OA3_1.ResponseObject = {
    description: '',
    content: {
        'application/json': {
            schema: {
                oneOf: [
                    {
                        $ref: '#/components/schemas/DbMixinList'
                    },
                    {
                        $ref: '#/components/schemas/DbMixinFindList'
                    },
                    {
                        $ref: '#/components/schemas/Item'
                    }
                ]
            }
        }
    }
};
const FileNotExist: OA3_1.ResponseObject = {
    description: 'File not exist',
    content: {
        'application/json': {
            schema: {
                allOf: [
                    { $ref: '#/components/schemas/Error' },
                    {
                        type: 'object',
                        examples: [
                            {
                                name: 'MoleculerClientError',
                                message: 'File missing in the request',
                                code: 400
                            }
                        ]
                    }
                ]
            }
        }
    }
};
const FileTooBig: OA3_1.ResponseObject = {
    description: 'File too big',
    content: {
        'application/json': {
            schema: {
                allOf: [
                    { $ref: '#/components/schemas/Error' },
                    {
                        type: 'object',
                        examples: [
                            {
                                name: 'PayloadTooLarge',
                                message: 'Payload too large',
                                code: 413,
                                type: 'PAYLOAD_TOO_LARGE',
                                data: {
                                    fieldname: 'file',
                                    filename: '4b2005c0b8.png',
                                    encoding: '7bit',
                                    mimetype: 'image/png'
                                }
                            }
                        ]
                    }
                ]
            }
        }
    }
};

export const schemas = {
    DbMixinList,
    DbMixinFindList,
    Item,
    Error
};

export const responses: Record<string, OA3_1.ResponseObject> = {
    ServerError,
    UnauthorizedError,
    ValidationError,
    ReturnedData,
    FileNotExist,
    FileTooBig
};

export const moleculerOpenAPITypes = {
    schemas,
    responses
};

export enum EOAExtensions {
    optional = 'x-fastest-optional',
    description = 'x-fastest-description'
}

export const openApiVersionsSupported = ['3.1'] as const;
export type openApiVersionsSupported = (typeof openApiVersionsSupported)[number];
export const defaultOpenApiVersion: openApiVersionsSupported = '3.1';

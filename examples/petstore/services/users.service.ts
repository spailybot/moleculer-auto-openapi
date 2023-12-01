import { Context, Service, ServiceBroker } from 'moleculer';
import type { MoleculerWebMetas } from './objects/commons';

export default class UsersService extends Service {
    constructor(broker: ServiceBroker) {
        super(broker);

        this.parseServiceSchema({
            name: 'users',
            actions: {
                upload_avatar: {
                    //upload disallow params because they are replaced by the file
                    handler: (ctx: Context<NodeJS.ReadableStream, MoleculerWebMetas>) => {
                        this.logger.info(`Received an avatar upload ! `, {
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
                },
                get: {
                    handler: (ctx) => {}
                },
                update: {
                    handler: (ctx) => {}
                },
                patch: {
                    handler: (ctx) => {}
                },
                remove: {
                    handler: (ctx) => {}
                },
                list: {
                    handler: (ctx) => {}
                },
                create: {
                    handler: (ctx) => {}
                }
            }
        });
    }
}

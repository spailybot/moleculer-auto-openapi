import { Context, Service, ServiceBroker, ServiceSchema } from 'moleculer';
import findFreePorts from 'find-free-ports';
import MoleculerWebService, { IWebServiceSettings } from './objects/MoleculerWebService.js';
import { RuleNumber, RuleString } from 'fastest-validator';
import ApiGateway from 'moleculer-web';

export default class ServerCreatorService extends Service {
    constructor(broker: ServiceBroker) {
        super(broker);

        this.parseServiceSchema({
            name: 'server-creator',
            settings: {
                rest: '/'
            },
            actions: {
                create: {
                    openapi: {
                        description:
                            'call this action, wait a little, and ask swagger to update the openapi (or refresh) . And you will see a new server available'
                    },
                    rest: 'POST /create',
                    params: {
                        name: {
                            $$oa: {
                                description: 'specify a name for you next server'
                            },
                            type: 'string'
                        } as RuleString,
                        port: {
                            $$oa: {
                                description: 'specify a port for you next server, default to a free port'
                            },
                            optional: true,
                            convert: true,
                            type: 'number'
                        } as RuleNumber
                    },
                    handler: async (ctx: Context<{ name: string; port?: number }>) => {
                        const { name, port } = ctx.params;

                        //check the name
                        if (name === this.name) {
                            throw new ApiGateway.Errors.BadRequestError('NAME_ALREADY_USED', { name });
                        }

                        let ctxAnswer = false;
                        try {
                            await ctx.call(`${name}.listAliases`);
                            ctxAnswer = true;
                        } catch {}

                        if (ctxAnswer) {
                            throw new ApiGateway.Errors.BadRequestError('NAME_ALREADY_USED', { name });
                        }

                        //check the port
                        let foundPort: number;
                        if (port) {
                            if (await findFreePorts.isFreePort(port)) {
                                foundPort = port;
                            } else {
                                throw new ApiGateway.Errors.BadRequestError('PORT_NOT_AVAILABLE', { port });
                            }
                        } else {
                            const portFree = await findFreePorts();
                            if (!portFree.length) {
                                throw new ApiGateway.Errors.BadRequestError('FAILED_TO_FIND_AN_AVAILABLE_PORT', {});
                            }

                            foundPort = portFree[0];
                        }

                        this.broker.createService(MoleculerWebService, {
                            name,
                            settings: {
                                port: foundPort
                            } as IWebServiceSettings,
                            stopped: () => {
                                // this.channelServices.delete(channel._id.toString());
                            }
                        });

                        return {};
                    }
                }
            },
            created: () => {
                this.actions['create']({ name: 'api', port: process.env.PORT != null ? Number(process.env.PORT) : 3000 });
            }
        });
    }
}

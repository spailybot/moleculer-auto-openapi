import { Context, Service, ServiceBroker, ServiceSettingSchema } from 'moleculer';
import { MoleculerWebTypes } from '@spailybot/moleculer-auto-openapi';

export default class HiddenService extends Service<ServiceSettingSchema & MoleculerWebTypes.RestServiceSettings> {
    constructor(broker: ServiceBroker) {
        super(broker);

        this.parseServiceSchema({
            name: 'hidden',
            settings: {
                rest: '/hidden'
            },
            actions: {
                secret: {
                    //with false, this endpoint will not be included in openapi
                    openapi: false,
                    params: {
                        name: 'string|optional'
                    },
                    rest: 'GET /secret',
                    handler: (ctx: Context<{ name?: string }>) => {
                        const { name } = ctx.params;
                        return `hello${name ? ` ${name}` : ''}`;
                    }
                }
            }
        });
    }
}

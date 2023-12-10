import { Context, Service, ServiceBroker } from 'moleculer';
import type { MoleculerWebMetas } from './objects/commons';

export default class AdminService extends Service {
    constructor(broker: ServiceBroker) {
        super(broker);

        this.parseServiceSchema({
            name: 'admin',
            settings: {
              rest: '/'
            },
            actions: {
                action: {
                    rest: 'GET /action',
                    handler: () => {
                    }
                }
            }
        });
    }
}

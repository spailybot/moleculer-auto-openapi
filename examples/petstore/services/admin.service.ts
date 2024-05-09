import { Service, ServiceBroker } from 'moleculer';

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
                    handler: () => {}
                }
            }
        });
    }
}

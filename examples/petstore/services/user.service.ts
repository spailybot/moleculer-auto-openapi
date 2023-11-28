import { Service, ServiceBroker } from 'moleculer';

export default class UserService extends Service {
    constructor(broker: ServiceBroker) {
        super(broker);

        this.parseServiceSchema({
            name: 'user'
        });
    }
}

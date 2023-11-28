import { Service, ServiceBroker, ServiceSettingSchema } from 'moleculer';
import { MoleculerWebTypes } from '@spailybot/moleculer-auto-openapi';

export default class StoreService extends Service<ServiceSettingSchema & MoleculerWebTypes.RestServiceSettings> {
    constructor(broker: ServiceBroker) {
        super(broker);

        this.parseServiceSchema({
            name: 'store',
            settings: {
                rest: '/store'
            }
        });
    }
}

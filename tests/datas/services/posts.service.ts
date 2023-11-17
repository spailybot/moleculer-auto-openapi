export const PostsService = {
    name: 'posts',
    //version: 2,

    settings: {
        rest: 'posts/'
    },

    actions: {
        list: {
            cache: true,
            // rest: 'GET /',
            handler(ctx) {
                // Clone the local list
            }
        },

        get: {
            cache: {
                keys: ['id']
            },
            // rest: 'GET /:id',
            handler(ctx) {}
        },

        feed: {
            // rest: 'GET /feed',
            handler(ctx) {}
        },

        create: {
            // rest: 'POST /',
            handler(ctx) {}
        },

        update: {
            // rest: 'PUT /:id',
            handler(ctx) {}
        },

        remove: {
            // rest: 'DELETE /:id',
            handler(ctx) {}
        }
    },

    methods: {}
};

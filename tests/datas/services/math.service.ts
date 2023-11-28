import { Context, Errors } from 'moleculer';

const MoleculerClientError = Errors.MoleculerClientError;

export const MathService = {
    name: 'math',
    version: 2,
    actions: {
        add(ctx: Context<{ a: number; b: number }>) {
            return Number(ctx.params.a) + Number(ctx.params.b);
        },

        sub(ctx: Context<{ a: number; b: number }>) {
            return Number(ctx.params.a) - Number(ctx.params.b);
        },

        mult: {
            rest: {
                type: 'stream',
                path: '/mult'
            },
            params: {
                a: 'number',
                b: 'number'
            },
            handler(ctx: Context<{ a: number; b: number }>) {
                return Number(ctx.params.a) * Number(ctx.params.b);
            }
        },

        div: {
            params: {
                a: { type: 'number', convert: true },
                b: { type: 'number', convert: true }
            },
            handler(ctx: Context<{ a: number; b: number }>) {
                let a = Number(ctx.params.a);
                let b = Number(ctx.params.b);
                if (b != 0 && !Number.isNaN(b)) return a / b;
                else throw new MoleculerClientError('Divide by zero!', 422, '', ctx.params);
            }
        }
    }
};

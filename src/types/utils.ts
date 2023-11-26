/**
 * allow the value to be false, to refuse the merge from the parent
 *
 * @typeParam T - the Record where all keys can be falsifiable
 * @example
 * type myType = {
 *   foo: string;
 *   bar: string;
 * }
 *
 * type myFalsifiableType = OptionalOrFalse<myType>;
 * myFalsifiableType = {
 *     foo?: string | false;
 *     bar?: string | false;
 * }
 *
 */
export type OptionalOrFalse<T> = {
    [P in keyof T]?: false | T[P];
};

/**
 * use {@link OptionalOrFalse} on all keys
 *
 * @typeParam T - the Record where all sub keys can be falsifiable
 *
 * @example
 * type myType = {
 *     foo: {
 *       foo: string;
 *       bar: string;
 *     }
 * }
 *
 * type myFalsifiableType = SubOptionalOrFalse<myType>;
 * /**
 *   myFalsifiableType = {
 *     foo: {
 *       foo?: string | false;
 *       bar?: string | false;
 *     }
 * }
 */
export type SubOptionalOrFalse<T> = {
    [P in keyof T]?: OptionalOrFalse<T[P]>;
};

type ExcludeFalse<T extends { openapi?: false | any }> = Exclude<T['openapi'], false>;
export type OpenApiDefined<T extends { openapi?: false | any }> = Omit<T, 'openapi'> & { openapi?: ExcludeFalse<T> };

type RequiredKeys<T> = { [K in keyof T]-?: {} extends { [P in K]: T[K] } ? never : K }[keyof T];
type OptionalKeys<T> = { [K in keyof T]-?: {} extends { [P in K]: T[K] } ? K : never }[keyof T];
export type ExcludeOptionalProps<T> = Pick<T, RequiredKeys<T>>;
export type ExcludeRequiredProps<T> = Pick<T, OptionalKeys<T>>;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[P] extends ReadonlyArray<infer U>
    ? ReadonlyArray<DeepPartial<U>>
    : T[P] extends Function
    ? T[P]
    : T[P] extends object
    ? DeepPartial<T[P]>
    : T[P];
};

export type FirstArgument<T> = T extends (arg1: infer U, ...args: any[]) => any ? U : never;

export type WithProperty<T, K extends keyof any> = T extends Record<K, any> ? Pick<T, K> & Partial<T> : never;

export type MakeOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

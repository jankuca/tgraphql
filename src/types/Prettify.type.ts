type Identity<T extends object> = T

export type Prettify<T extends object> = Identity<{
  [k in keyof T]: T[k]
}>

// Flatten intersection types to prevent deep nesting
export type Prettify<T extends object> = T extends infer U ? { [K in keyof U]: U[K] } : never

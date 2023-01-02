import { AnyObjectQueryType, ObjectQueryTypeOf, VariableDescriptor } from '../queries/ObjectQueryType'
import { AnyInputValueType } from './AnyInputValueType.type'
import { InputValue } from './InputValue.type'

type RequiredVariableKeys<
  Variables extends Record<string, VariableDescriptor<{ type: AnyInputValueType; optional: boolean }>>
> = {
  [K in keyof Variables]: Variables[K]['optional'] extends true ? never : K
}[keyof Variables]

export type QueryVariables<Query extends AnyObjectQueryType> = Query extends ObjectQueryTypeOf<
  any,
  infer Variables,
  any
>
  ? {
      [K in Extract<keyof Variables, RequiredVariableKeys<Variables>>]: InputValue<Variables[K]['type']>
    } & {
      [K in Exclude<keyof Variables, RequiredVariableKeys<Variables>>]?: InputValue<Variables[K]['type']>
    }
  : never

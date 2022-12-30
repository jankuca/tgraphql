import assertNever from 'assert-never'

type ScalarType = 'ID' | 'String' | 'Int' | 'Float' | 'Bool'

abstract class NamedType<Name extends string> {
  typename: Name
  constructor(typename: Name) {
    this.typename = typename
  }
}

class ObjectType<
  Name extends string,
  S extends Record<string, { type: AnyType; optional: boolean; params: AnyParamObjectType | null }>
> extends NamedType<Name> {
  schema: S
  constructor(typename: Name, schema: S) {
    super(typename)
    this.schema = schema
  }

  field<K extends string, T extends AnyType>(
    key: K,
    type: T
  ): ObjectType<Name, S & { [k in K]: { type: T; optional: false; params: AnyParamObjectType | null } }> {
    return new ObjectType(this.typename, {
      ...this.schema,
      [key]: { type, optional: false, params: null },
    })
  }

  paramField<K extends string, Params extends ParamObjectType<Record<string, any>>, T extends AnyType>(
    key: K,
    paramBuilder: (params: ParamObjectType<Record<never, any>>) => Params,
    type: T
  ): ObjectType<Name, S & { [k in K]: { type: T; optional: false; params: Params } }> {
    return new ObjectType(this.typename, {
      ...this.schema,
      [key]: { type, optional: false, params: paramBuilder(new ParamObjectType({})) },
    })
  }

  optionalField<K extends string, T extends AnyType>(
    key: K,
    type: T
  ): ObjectType<Name, S & { [k in K]: { type: T; optional: true; params: AnyParamObjectType | null } }> {
    return new ObjectType(this.typename, {
      ...this.schema,
      [key]: { type, optional: true, params: null },
    })
  }

  listField<K extends string, Ts extends [AnyType] | [AnyType, null]>(
    key: K,
    itemTypes: Ts
  ): ObjectType<Name, S & { [k in K]: { type: Ts; optional: false; params: AnyParamObjectType | null } }> {
    return new ObjectType(this.typename, {
      ...this.schema,
      [key]: { type: itemTypes, optional: false, params: null },
    })
  }

  listParamField<
    K extends string,
    Params extends ParamObjectType<Record<string, any>>,
    Ts extends [AnyType] | [AnyType, null]
  >(
    key: K,
    paramBuilder: (params: ParamObjectType<Record<never, any>>) => Params,
    itemTypes: Ts
  ): ObjectType<Name, S & { [k in K]: { type: Ts; optional: false; params: Params } }> {
    return new ObjectType(this.typename, {
      ...this.schema,
      [key]: { type: itemTypes, optional: false, params: paramBuilder(new ParamObjectType({})) },
    })
  }

  optionalListField<K extends string, Ts extends [AnyType] | [AnyType, null]>(
    key: K,
    itemTypes: Ts
  ): ObjectType<Name, S & { [k in K]: { type: Ts; optional: true; params: AnyParamObjectType | null } }> {
    return new ObjectType(this.typename, {
      ...this.schema,
      [key]: { type: itemTypes, optional: true, params: null },
    })
  }
}

class InputObjectType<
  Name extends string,
  S extends Record<string, { type: AnyInputFieldType; optional: boolean }>
> extends NamedType<Name> {
  schema: S
  constructor(typename: Name, schema: S) {
    super(typename)
    this.schema = schema
  }

  field<K extends string, T extends AnyInputFieldType>(
    key: K,
    type: T
  ): InputObjectType<Name, S & { [k in K]: { type: T; optional: false } }> {
    return new InputObjectType(this.typename, {
      ...this.schema,
      [key]: { type, optional: false },
    })
  }

  optionalField<K extends string, T extends AnyInputFieldType>(
    key: K,
    type: T
  ): InputObjectType<Name, S & { [k in K]: { type: T; optional: true } }> {
    return new InputObjectType(this.typename, {
      ...this.schema,
      [key]: { type, optional: true },
    })
  }

  listField<K extends string, Ts extends [AnyInputFieldType] | [AnyInputFieldType, null]>(
    key: K,
    itemTypes: Ts
  ): InputObjectType<Name, S & { [k in K]: { type: Ts; optional: false } }> {
    return new InputObjectType(this.typename, {
      ...this.schema,
      [key]: { type: itemTypes, optional: false },
    })
  }

  optionalListField<K extends string, Ts extends [AnyInputFieldType] | [AnyInputFieldType, null]>(
    key: K,
    itemTypes: Ts
  ): InputObjectType<Name, S & { [k in K]: { type: Ts; optional: true } }> {
    return new InputObjectType(this.typename, {
      ...this.schema,
      [key]: { type: itemTypes, optional: true },
    })
  }
}

class ParamObjectType<S extends Record<string, ParamDescriptor<{ type: AnyParamType; optional: boolean }>>> {
  schema: S
  constructor(schema: S) {
    this.schema = schema
  }
  field<K extends string, T extends AnyParamType>(
    key: K,
    type: T
  ): ParamObjectType<S & { [k in K]: ParamDescriptor<{ type: T; optional: false }> }> {
    return new ParamObjectType({
      ...this.schema,
      [key]: { type, optional: false, defaultValue: null },
    })
  }
  optionalField<K extends string, T extends AnyParamType>(
    key: K,
    type: T,
    defaultValue: ParamValue<T>
  ): ParamObjectType<S & { [k in K]: ParamDescriptor<{ type: T; optional: true }> }> {
    return new ParamObjectType({
      ...this.schema,
      [key]: { type, optional: true, defaultValue },
    })
  }
  listField<K extends string, Ts extends [AnyParamType] | [AnyParamType, null]>(
    key: K,
    itemTypes: Ts
  ): ParamObjectType<S & { [k in K]: ParamDescriptor<{ type: Ts; optional: false }> }> {
    return new ParamObjectType({
      ...this.schema,
      [key]: { type: itemTypes, optional: false, defaultValue: null },
    })
  }
  optionalListField<K extends string, Ts extends [AnyParamType] | [AnyParamType, null]>(
    key: K,
    itemTypes: Ts,
    defaultValue: ParamValue<Ts>
  ): ParamObjectType<S & { [k in K]: ParamDescriptor<{ type: Ts; optional: true }> }> {
    return new ParamObjectType({
      ...this.schema,
      [key]: { type: itemTypes, optional: true, defaultValue },
    })
  }
}

class EnumValueType<S extends string> {
  enumTypeName: string
  value: S
  constructor(enumTypeName: string, value: S) {
    this.enumTypeName = enumTypeName
    this.value = value
  }
}

class EnumType<Name extends string, Vs extends ReadonlyArray<string>> extends NamedType<Name> {
  values: Array<EnumValueType<Vs[number]>>
  constructor(typename: Name, values: Vs) {
    super(typename)
    this.values = values.map((value) => new EnumValueType(typename, value))
  }
}

class UnionType<Name extends string, Ts extends ReadonlyArray<AnyObjectType>> extends NamedType<Name> {
  types: Ts
  constructor(typename: Name, types: Ts) {
    super(typename)
    this.types = types
  }
}

type AnyParamObjectType = ParamObjectType<Record<string, ParamDescriptor<{ type: AnyParamType; optional: boolean }>>>

type AnyInputFieldType =
  | ScalarType
  | EnumType<string, ReadonlyArray<string>>
  | EnumValueType<string>
  | InputObjectType<string, Record<string, { type: AnyInputFieldType; optional: boolean }>>
  | [AnyInputFieldType]
  | [AnyInputFieldType, null]

type AnyInputValueType =
  | ScalarType
  | EnumValueType<string>
  | InputObjectType<string, Record<string, { type: AnyInputFieldType; optional: boolean }>>

type AnyParamInputType =
  | string
  | number
  | boolean
  | EnumValueType<string>
  | VariableInput<string>
  | InputObjectType<string, Record<string, { type: AnyInputFieldType; optional: boolean }>>

export function objectType<Name extends string>(typename: Name) {
  return new ObjectType(typename, {})
}
export function inputType<Name extends string>(typename: Name) {
  return new InputObjectType(typename, {})
}
export function enumType<Name extends string, S extends ReadonlyArray<string>>(typename: Name, ...values: S) {
  return new EnumType(typename, values)
}
export function unionType<Name extends string, S extends ReadonlyArray<AnyObjectType>>(typename: Name, ...values: S) {
  return new UnionType(typename, values)
}

type AnyType =
  | ObjectType<string, Record<string, { type: AnyType; optional: boolean; params: AnyParamObjectType | null }>>
  | EnumType<string, ReadonlyArray<string>>
  | UnionType<string, ReadonlyArray<AnyObjectType>>
  | ScalarType
  | EnumValueType<string>
  | [AnyType]
  | [AnyType, null]
  | string
  | number

type ObjectValue<S extends Record<string, { type: AnyType; optional: boolean; params: AnyParamObjectType | null }>> = {
  [key in keyof S]: S[key]['optional'] extends true ? Value<S[key]['type']> | null : Value<S[key]['type']>
}

type InputObjectValue<S extends Record<string, { type: AnyInputFieldType; optional: boolean }>> = {
  [key in keyof S]: S[key]['optional'] extends true ? InputValue<S[key]['type']> | null : InputValue<S[key]['type']>
}

type Value<T extends AnyType> = T extends [infer I extends AnyType, null]
  ? Array<Value<I>>
  : T extends [infer I extends AnyType]
  ? Array<Value<I>>
  : T extends EnumType<string, infer I>
  ? I[number]
  : T extends UnionType<string, infer I extends ReadonlyArray<AnyObjectType>>
  ? Value<I[number]>
  : T extends EnumValueType<infer I>
  ? I
  : T extends InputObjectType<string, infer I>
  ? InputObjectValue<I>
  : T extends ObjectType<string, infer I>
  ? ObjectValue<I>
  : T extends 'Int'
  ? number
  : T extends 'Bool'
  ? boolean
  : T extends ScalarType
  ? string
  : T

type InputValue<T extends AnyInputValueType | AnyInputFieldType> = T extends EnumType<string, infer I>
  ? I[number]
  : T extends EnumValueType<infer I>
  ? I
  : T extends 'Int'
  ? number
  : T extends 'Bool'
  ? boolean
  : T extends ScalarType
  ? string
  : T

type ParamValue<T extends AnyParamType> = T extends [infer I extends AnyParamType, null]
  ? Array<ParamValue<I>>
  : T extends [infer I extends AnyParamType]
  ? Array<ParamValue<I>>
  : T extends EnumValueType<infer I>
  ? I
  : T extends 'Int'
  ? number
  : T extends 'Bool'
  ? boolean
  : T extends ScalarType
  ? string
  : T

type VariableDescriptor<T extends { type: AnyInputValueType; optional: boolean }> = {
  type: T['type']
  optional: T['optional']
  defaultValue: true extends T['optional'] ? any : InputValue<T['type']>
}

type AnyParamType =
  | ScalarType
  | EnumValueType<string>
  | InputObjectType<string, Record<string, { type: AnyInputFieldType; optional: boolean }>>
  | [AnyParamType]
  | [AnyParamType, null]

type ParamDescriptor<T extends { type: AnyParamType; optional: boolean }> = {
  type: T['type']
  optional: T['optional']
  defaultValue: true extends T['optional'] ? any : ParamValue<T['type']>
}

type VariableValues<T extends Record<string, VariableDescriptor<{ type: AnyInputValueType; optional: boolean }>>> = {
  [key in keyof T]: InputValue<T[key]['type']>
}

type RequiredParamKeys<P extends AnyParamObjectType> = P extends ParamObjectType<infer T>
  ? {
      [key in keyof T]: T[key]['optional'] extends true ? never : key
    }[keyof T]
  : never

type ParamValues<P extends AnyParamObjectType> = P extends ParamObjectType<infer T>
  ? {
      [key in keyof T]: ParamValue<T[key]['type']>
    }
  : never

type Resolver<T extends AnyType> = T extends [infer I extends AnyType, null]
  ? () => Array<Value<I> | null>
  : T extends [infer I extends AnyType]
  ? () => Array<Value<I>>
  : T extends EnumType<string, infer I>
  ? () => I[number]
  : T extends UnionType<string, infer I extends ReadonlyArray<AnyObjectType>>
  ? () => Resolver<I[number]>
  : T extends EnumValueType<infer I>
  ? () => I
  : T extends ObjectType<string, infer I>
  ? { [key in keyof I]: () => I[key]['optional'] extends true ? Value<I[key]['type']> | null : Value<I[key]['type']> }
  : T extends ScalarType
  ? () => string
  : T

export type SchemaResolvers<Q extends ObjectType<'Query', any>> = { Query: Resolver<Q> }

export function generateSchemaString(rootType: AnyType): string {
  const { hoisted } = generateSchemaPart(rootType)
  return Object.values(hoisted).join('\n\n')
}

function generateSchemaFieldParamStringPart<P extends AnyParamObjectType>(params: P): string {
  const paramEntries = Object.entries(params.schema)
  if (paramEntries.length === 0) {
    return ''
  }

  return [
    '(',
    paramEntries
      .map(
        ([key, fieldDesc]) =>
          `${key}: ${generateSchemaPart(fieldDesc.type).inline}${fieldDesc.optional ? '' : '!'}${
            fieldDesc.optional ? ` = ${generateSchemaPart(fieldDesc.defaultValue).inline}` : ''
          }`
      )
      .join(', '),
    ')',
  ].join('')
}

function generateSchemaPart(type: AnyType | AnyInputValueType | AnyInputFieldType | AnyParamType): {
  hoisted: Record<string, string>
  inline: string
} {
  if (Array.isArray(type)) {
    const { hoisted, inline } = generateSchemaPart(type[0])
    return { hoisted, inline: `[${inline}${type[1] === null ? '' : '!'}]` }
  }

  if (type instanceof EnumValueType) {
    return { hoisted: {}, inline: type.value }
  }

  if (type instanceof EnumType) {
    return {
      hoisted: {
        [type.typename]: [
          `enum ${type.typename} {`,
          ...type.values.map((enumValue) => `  ${enumValue.value}`),
          '}',
        ].join('\n'),
      },
      inline: type.typename,
    }
  }

  if (type instanceof UnionType) {
    const hoisted: Record<string, string> = {}
    const names: Array<string> = []

    type.types.forEach((unionType) => {
      const { hoisted: hoistedParts, inline } = generateSchemaPart(unionType)
      Object.assign(hoisted, hoistedParts)
      names.push(inline)
    })

    hoisted[type.typename] = `union ${type.typename} = ${names.join(' | ')}`

    return { hoisted, inline: type.typename }
  }

  if (type instanceof ObjectType) {
    const hoisted: Record<string, string> = {}
    const schemaStringParts: Array<string> = [`type ${type.typename} {`]

    Object.entries(type.schema).forEach(([key, fieldDesc]) => {
      const { hoisted: hoistedParts, inline } = generateSchemaPart(fieldDesc.type)
      Object.assign(hoisted, hoistedParts)
      schemaStringParts.push(
        `  ${key}${fieldDesc.params ? generateSchemaFieldParamStringPart(fieldDesc.params) : ''}: ${inline}${
          fieldDesc.optional ? '' : '!'
        }`
      )
    })
    schemaStringParts.push('}')
    hoisted[type.typename] = schemaStringParts.join('\n')

    return { hoisted, inline: type.typename }
  }

  if (type instanceof InputObjectType) {
    const hoisted: Record<string, string> = {}
    const schemaStringParts: Array<string> = [`input ${type.typename} {`]

    Object.entries(type.schema).forEach(([key, fieldDesc]) => {
      const { hoisted: hoistedParts, inline } = generateSchemaPart(fieldDesc.type)
      Object.assign(hoisted, hoistedParts)
      schemaStringParts.push(`  ${key}: ${inline}${fieldDesc.optional ? '' : '!'}`)
    })
    schemaStringParts.push('}')
    hoisted[type.typename] = schemaStringParts.join('\n')

    return { hoisted, inline: type.typename }
  }

  // ScalarType
  if (type === 'String' || type === 'Int' || type === 'Float' || type === 'Bool' || type === 'ID') {
    return { hoisted: {}, inline: type }
  }

  if (typeof type === 'string') {
    return { hoisted: {}, inline: `"${String(type).replace(/"/g, '\\"')}"` }
  }
  if (typeof type === 'number') {
    return { hoisted: {}, inline: String(type) }
  }

  assertNever(type)
}

function generateParamInputString(type: AnyParamInputType): string {
  if (type instanceof EnumValueType || type instanceof InputObjectType) {
    return generateSchemaPart(type).inline
  }

  if (type instanceof VariableInput) {
    return `$${type.name}`
  }

  if (typeof type === 'string') {
    return `"${String(type).replace(/"/g, '\\"')}"`
  }

  if (typeof type === 'number') {
    return String(type)
  }

  if (typeof type === 'boolean') {
    return String(type)
  }

  assertNever(type)
}

// Queries

class ScalarQueryType<ResolverType extends AnyType> {
  resolverType: ResolverType
  constructor(resolverType: ResolverType) {
    this.resolverType = resolverType
  }
}

class UnionQueryType<
  ResolverType extends AnyUnionType,
  UnionQueries extends Record<UnionTypeNames<ResolverType>, AnyObjectQueryType>
> {
  resolverTypeUnion: ResolverType
  queries: UnionQueries
  constructor(resolverType: ResolverType, queries: UnionQueries) {
    this.resolverTypeUnion = resolverType
    this.queries = queries
  }
}

type AnyUnionType = UnionType<string, ReadonlyArray<AnyObjectType>>
type AnyObjectType = ObjectType<
  string,
  Record<string, { type: AnyType; optional: boolean; params: AnyParamObjectType | null }>
>
type AnyObjectListType = [AnyObjectType] | [AnyObjectType, null]

type AnyScalarType = Exclude<AnyType, AnyObjectType | [...any]>
type AnyScalarListType = [AnyScalarType] | [AnyScalarType, null]
type AnyUnionListType = [AnyUnionType] | [AnyUnionType, null]

type AnyObjectQueryType = ObjectQueryType<
  AnyObjectType,
  Record<string, VariableDescriptor<{ type: AnyInputValueType; optional: boolean }>>,
  Record<string, { query: AnyQueryType; paramInputs: Record<string, AnyParamInputType> }>,
  Record<string, { key: string; type: AnyScalarType; optional: boolean; params: AnyParamObjectType | null }>,
  Record<string, { key: string; type: AnyScalarListType; optional: boolean; params: AnyParamObjectType | null }>,
  Record<string, { key: string; type: AnyObjectType; optional: boolean; params: AnyParamObjectType | null }>,
  Record<string, { key: string; type: AnyObjectListType; optional: boolean; params: AnyParamObjectType | null }>,
  Record<string, { key: string; type: AnyUnionType; optional: boolean; params: AnyParamObjectType | null }>,
  Record<string, { key: string; type: AnyUnionListType; optional: boolean; params: AnyParamObjectType | null }>
>
type AnyUnionQueryType = UnionQueryType<AnyUnionType, Record<string, AnyObjectQueryType>>
type AnyNodeQueryType = AnyObjectQueryType | ScalarQueryType<AnyType> | AnyUnionQueryType
type AnyQueryType = AnyNodeQueryType | [AnyNodeQueryType] | [AnyNodeQueryType, null]

type FilterScalarResolvers<
  Schema extends Record<string, { type: AnyType; optional: boolean; params: AnyParamObjectType | null }>
> = {
  [K in Extract<keyof Schema, string>]: Schema[K]['type'] extends AnyObjectType
    ? never
    : Schema[K]['type'] extends AnyUnionType
    ? never
    : Schema[K]['type'] extends [...any]
    ? never
    : { key: K; type: Schema[K]['type']; optional: Schema[K]['optional']; params: Schema[K]['params'] }
}

type ScalarResolvers<ResolverType extends AnyObjectType> = {
  [key in FilterScalarResolvers<ResolverType['schema']>[keyof FilterScalarResolvers<
    ResolverType['schema']
  >]['key']]: FilterScalarResolvers<ResolverType['schema']>[key]
}

type FilterObjectResolvers<
  Schema extends Record<string, { type: AnyType; optional: boolean; params: AnyParamObjectType | null }>
> = {
  [K in Extract<keyof Schema, string>]: Schema[K]['type'] extends AnyObjectType
    ? { key: K; type: Schema[K]['type']; optional: Schema[K]['optional']; params: Schema[K]['params'] }
    : never
}

type ObjectResolvers<ResolverType extends AnyObjectType> = {
  [key in FilterObjectResolvers<ResolverType['schema']>[keyof FilterObjectResolvers<
    ResolverType['schema']
  >]['key']]: FilterObjectResolvers<ResolverType['schema']>[key]
}

type FilterUnionResolvers<
  Schema extends Record<string, { type: AnyType; optional: boolean; params: AnyParamObjectType | null }>
> = {
  [K in Extract<keyof Schema, string>]: Schema[K]['type'] extends AnyUnionType
    ? { key: K; type: Schema[K]['type']; optional: Schema[K]['optional']; params: Schema[K]['params'] }
    : never
}

type UnionResolvers<ResolverType extends AnyObjectType> = {
  [key in FilterUnionResolvers<ResolverType['schema']>[keyof FilterUnionResolvers<
    ResolverType['schema']
  >]['key']]: FilterUnionResolvers<ResolverType['schema']>[key]
}

type FilterScalarListResolvers<
  Schema extends Record<string, { type: AnyType; optional: boolean; params: AnyParamObjectType | null }>
> = {
  [K in Extract<keyof Schema, string>]: Schema[K]['type'] extends [...any]
    ? Schema[K]['type'] extends AnyObjectListType
      ? never
      : { key: K; type: Schema[K]['type']; optional: Schema[K]['optional']; params: Schema[K]['params'] }
    : never
}

type ScalarListResolvers<ResolverType extends AnyObjectType> = {
  [key in FilterScalarListResolvers<ResolverType['schema']>[keyof FilterScalarListResolvers<
    ResolverType['schema']
  >]['key']]: FilterScalarListResolvers<ResolverType['schema']>[key]
}

type FilterObjectListResolvers<
  Schema extends Record<string, { type: AnyType; optional: boolean; params: AnyParamObjectType | null }>
> = {
  [K in Extract<keyof Schema, string>]: Schema[K]['type'] extends AnyObjectListType
    ? { key: K; type: Schema[K]['type']; optional: Schema[K]['optional']; params: Schema[K]['params'] }
    : never
}

type ObjectListResolvers<ResolverType extends AnyObjectType> = {
  [key in FilterObjectListResolvers<ResolverType['schema']>[keyof FilterObjectListResolvers<
    ResolverType['schema']
  >]['key']]: FilterObjectListResolvers<ResolverType['schema']>[key]
}

type FilterUnionListResolvers<
  Schema extends Record<string, { type: AnyType; optional: boolean; params: AnyParamObjectType | null }>
> = {
  [K in Extract<keyof Schema, string>]: Schema[K]['type'] extends AnyUnionListType
    ? { key: K; type: Schema[K]['type']; optional: Schema[K]['optional']; params: Schema[K]['params'] }
    : never
}

type UnionListResolvers<ResolverType extends AnyObjectType> = {
  [key in FilterUnionListResolvers<ResolverType['schema']>[keyof FilterUnionListResolvers<
    ResolverType['schema']
  >]['key']]: FilterUnionListResolvers<ResolverType['schema']>[key]
}

type UnionTypeNames<U extends AnyUnionType> = U['types'][number]['typename']

type UnionTypeByName<U extends AnyUnionType, T extends UnionTypeNames<U>> = Extract<U['types'][number], { typename: T }>

type UnionSubqueries<U extends AnyUnionType, Factories extends UnionSubqueryFactories<U, any>> = {
  [T in UnionTypeNames<U>]: ReturnType<Factories[T]>
}

type UnionSubqueryFactories<
  U extends AnyUnionType,
  Variables extends Record<string, VariableDescriptor<{ type: AnyInputValueType; optional: boolean }>>
> = {
  [T in UnionTypeNames<U>]: (
    subquery: ObjectQueryTypeOf<UnionTypeByName<U, T>, Variables>
  ) => ObjectQueryTypeOf<
    UnionTypeByName<U, T>,
    Variables,
    Record<string, { query: AnyQueryType; paramInputs: Record<string, AnyParamInputType> }>
  >
}

type ParamVariables<
  Param,
  Variables extends Record<string, VariableDescriptor<{ type: AnyInputValueType; optional: boolean }>>
> = {
  [V in Extract<keyof VariableValues<Variables>, string>]: VariableValues<Variables>[V] extends Param
    ? VariableInput<V>
    : never
}[Extract<keyof VariableValues<Variables>, string>]

type VariableFieldParams<
  Field extends { params: AnyParamObjectType | null },
  Variables extends Record<string, VariableDescriptor<{ type: AnyInputValueType; optional: boolean }>>
> = Field['params'] extends AnyParamObjectType
  ? Pick<
      {
        [K in keyof ParamValues<Field['params']>]:
          | ParamValues<Field['params']>[K]
          | ParamVariables<ParamValues<Field['params']>[K], Variables>
      },
      RequiredParamKeys<Field['params']>
    > &
      Omit<
        {
          [K in keyof ParamValues<Field['params']>]?:
            | ParamValues<Field['params']>[K]
            | ParamVariables<ParamValues<Field['params']>[K], Variables>
        },
        RequiredParamKeys<Field['params']>
      >
  : Record<never, any>

type ObjectQueryTypeOf<
  ResolverType extends AnyObjectType,
  Variables extends Record<string, VariableDescriptor<{ type: AnyInputValueType; optional: boolean }>>,
  QuerySchema extends Record<string, { query: AnyQueryType; paramInputs: Record<string, AnyParamInputType> }> = Record<
    never,
    any
  >
> = ObjectQueryType<
  ResolverType,
  Variables,
  QuerySchema,
  ScalarResolvers<ResolverType>,
  ScalarListResolvers<ResolverType>,
  ObjectResolvers<ResolverType>,
  ObjectListResolvers<ResolverType>,
  UnionResolvers<ResolverType>,
  UnionListResolvers<ResolverType>
>

class ObjectQueryType<
  ResolverType extends AnyObjectType,
  Variables extends Record<string, VariableDescriptor<{ type: AnyInputValueType; optional: boolean }>>,
  QuerySchema extends Record<string, { query: AnyQueryType; paramInputs: Record<string, AnyParamInputType> }>,
  Fields extends ScalarResolvers<ResolverType>,
  ListFields extends ScalarListResolvers<ResolverType>,
  ObjectFields extends ObjectResolvers<ResolverType>,
  ObjectListFields extends ObjectListResolvers<ResolverType>,
  UnionFields extends UnionResolvers<ResolverType>,
  UnionListFields extends UnionListResolvers<ResolverType>
> {
  resolverType: ResolverType
  schema: QuerySchema
  variables: Variables

  constructor(resolverType: ResolverType, schema: QuerySchema, variables: Variables) {
    this.resolverType = resolverType
    this.schema = schema
    this.variables = variables
  }

  field<
    K extends Extract<keyof ObjectListFields, string>,
    SubquerySchema extends Record<string, { query: AnyQueryType; paramInputs: Record<string, AnyParamInputType> }>,
    ListSubquery extends ObjectQueryTypeOf<ObjectListFields[K]['type'][0], Variables, SubquerySchema>
  >(
    key: K,
    makeSubquery: (subquery: ObjectQueryTypeOf<ObjectListFields[K]['type'][0], Variables>) => ListSubquery
  ): ObjectQueryTypeOf<
    ResolverType,
    Variables,
    QuerySchema & { [key in K]: { query: [ListSubquery]; paramInputs: Record<never, any> } }
  >

  field<
    K extends Extract<keyof ObjectFields, string>,
    SubquerySchema extends Record<string, { query: AnyQueryType; paramInputs: Record<string, AnyParamInputType> }>,
    ObjectSubquery extends ObjectQueryTypeOf<ObjectFields[K]['type'], Variables, SubquerySchema>
  >(
    key: K,
    makeSubquery: (subquery: ObjectQueryTypeOf<ObjectFields[K]['type'], Variables>) => ObjectSubquery
  ): ObjectQueryTypeOf<
    ResolverType,
    Variables,
    QuerySchema & { [key in K]: { query: ObjectSubquery; paramInputs: Record<never, any> } }
  >

  field<
    K extends Extract<keyof UnionListFields, string>,
    Union extends UnionListFields[K]['type'][0],
    SubqueryFactories extends UnionSubqueryFactories<Union, Variables>
  >(
    key: K,
    makeSubqueries: SubqueryFactories
  ): ObjectQueryTypeOf<
    ResolverType,
    Variables,
    QuerySchema & {
      [key in K]: {
        query: [UnionQueryType<Union, UnionSubqueries<Union, SubqueryFactories>>]
        paramInputs: Record<never, any>
      }
    }
  >

  field<
    K extends Extract<keyof UnionFields, string>,
    Union extends UnionFields[K]['type'],
    SubqueryFactories extends UnionSubqueryFactories<Union, Variables>
  >(
    key: K,
    makeSubqueries: SubqueryFactories
  ): ObjectQueryTypeOf<
    ResolverType,
    Variables,
    QuerySchema & {
      [key in K]: {
        query: UnionQueryType<Union, UnionSubqueries<Union, SubqueryFactories>>
        paramInputs: Record<never, any>
      }
    }
  >

  field<K extends Extract<keyof ListFields, string>>(
    key: K,
    makeSubquery?: undefined
  ): ObjectQueryTypeOf<
    ResolverType,
    Variables,
    QuerySchema & {
      [key in K]: { query: [ScalarQueryType<ListFields[K]['type'][0]>]; paramInputs: Record<never, any> }
    }
  >

  field<K extends Extract<keyof Fields, string>>(
    key: K,
    makeSubquery?: undefined
  ): ObjectQueryTypeOf<
    ResolverType,
    Variables,
    QuerySchema & { [key in K]: { query: ScalarQueryType<Fields[K]['type']>; paramInputs: Record<never, any> } }
  >

  field(key: Extract<keyof ResolverType['schema'], string>, makeSubquery: any): any {
    const schema = this.resolverType.schema
    const fieldDesc = schema[key]
    if (!fieldDesc) throw new Error(`Field ${key} does not exist`)

    const fieldType = fieldDesc.type

    if (Array.isArray(fieldType)) {
      return fieldType[0] instanceof ObjectType
        ? this._objectListField(key, makeSubquery)
        : fieldType[0] instanceof UnionType
        ? this._unionListField(key, makeSubquery)
        : this._scalarListField(key)
    }

    return fieldType instanceof ObjectType
      ? this._objectField(key, makeSubquery)
      : fieldType instanceof UnionType
      ? this._unionField(key, makeSubquery)
      : this._scalarField(key)
  }

  _scalarField<K extends Extract<keyof Fields, string>>(key: K) {
    const schema = this.resolverType.schema as Fields
    const fieldDesc = schema[key]

    const nextQueryType: ObjectQueryTypeOf<
      ResolverType,
      Variables,
      QuerySchema & {
        [key in K]: { query: ScalarQueryType<Fields[K]['type']>; paramInputs: Record<never, any> }
      }
    > = new ObjectQueryType(
      this.resolverType,
      {
        ...this.schema,
        [key]: { query: new ScalarQueryType(fieldDesc.type), paramInputs: {} },
      },
      this.variables
    )

    return nextQueryType
  }

  scalarParamField<K extends Extract<keyof Fields, string>, Params extends VariableFieldParams<Fields[K], Variables>>(
    key: K,
    paramInputs: Params
  ) {
    const schema = this.resolverType.schema as Fields
    const fieldDesc = schema[key]

    const nextQueryType: ObjectQueryTypeOf<
      ResolverType,
      Variables,
      QuerySchema & {
        [key in K]: { query: ScalarQueryType<Fields[K]['type']>; paramInputs: Params }
      }
    > = new ObjectQueryType(
      this.resolverType,
      {
        ...this.schema,
        [key]: { query: new ScalarQueryType(fieldDesc.type), paramInputs },
      },
      this.variables
    )

    return nextQueryType
  }

  _scalarListField<K extends Extract<keyof ListFields, string>>(key: K) {
    const schema = this.resolverType.schema as ListFields
    const fieldDesc = schema[key]

    const nextQueryType: ObjectQueryTypeOf<
      ResolverType,
      Variables,
      QuerySchema & {
        [key in K]: { query: [ScalarQueryType<ListFields[K]['type']>]; paramInputs: Record<never, any> }
      }
    > = new ObjectQueryType(
      this.resolverType,
      {
        ...this.schema,
        [key]: { query: [new ScalarQueryType(fieldDesc.type)], paramInputs: {} },
      },
      this.variables
    )

    return nextQueryType
  }

  _objectField<
    K extends Extract<keyof ObjectFields, string>,
    SubquerySchema extends Record<string, { query: AnyQueryType; paramInputs: Record<string, AnyParamInputType> }>,
    Subquery extends ObjectQueryTypeOf<ObjectFields[K]['type'], Variables, SubquerySchema>
  >(key: K, makeSubquery: (subquery: ObjectQueryTypeOf<ObjectFields[K]['type'], Variables>) => Subquery) {
    const schema = this.resolverType.schema as ObjectFields
    const fieldDesc = schema[key]

    const emptySubquery = new ObjectQueryType(fieldDesc.type, {}, this.variables)
    const subquery = makeSubquery(emptySubquery)

    const nextQueryType: ObjectQueryTypeOf<
      ResolverType,
      Variables,
      QuerySchema & {
        [key in K]: { query: Subquery; paramInputs: Record<never, any> }
      }
    > = new ObjectQueryType(
      this.resolverType,
      {
        ...this.schema,
        [key]: { query: subquery, paramInputs: {} },
      },
      this.variables
    )

    return nextQueryType
  }

  _objectListField<
    K extends Extract<keyof ObjectListFields, string>,
    SubquerySchema extends Record<string, { query: AnyQueryType; paramInputs: Record<string, AnyParamInputType> }>,
    Subquery extends ObjectQueryTypeOf<ObjectListFields[K]['type'][0], Variables, SubquerySchema>
  >(key: K, makeSubquery: (subquery: ObjectQueryTypeOf<ObjectListFields[K]['type'][0], Variables>) => Subquery) {
    const schema = this.resolverType.schema as ObjectListFields
    const fieldDesc = schema[key]

    const emptySubquery = new ObjectQueryType(fieldDesc.type[0], {}, this.variables)
    const subquery = makeSubquery(emptySubquery)

    const nextQueryType: ObjectQueryTypeOf<
      ResolverType,
      Variables,
      QuerySchema & {
        [key in K]: { query: [Subquery]; paramInputs: Record<never, any> }
      }
    > = new ObjectQueryType(
      this.resolverType,
      {
        ...this.schema,
        [key]: { query: [subquery], paramInputs: {} },
      },
      this.variables
    )

    return nextQueryType
  }

  paramField<
    K extends Extract<keyof ObjectFields, string>,
    Params extends VariableFieldParams<ObjectFields[K], Variables>,
    SubquerySchema extends Record<string, { query: AnyQueryType; paramInputs: Record<never, any> }>,
    Subquery extends ObjectQueryTypeOf<ObjectFields[K]['type'], Variables, SubquerySchema>
  >(
    key: K,
    paramInputs: Params,
    makeSubquery: (subquery: ObjectQueryTypeOf<ObjectFields[K]['type'], Variables>) => Subquery
  ) {
    const schema = this.resolverType.schema as ObjectFields
    const fieldDesc = schema[key]

    const emptySubquery = new ObjectQueryType(fieldDesc.type, {}, this.variables)
    const subquery = makeSubquery(emptySubquery)

    const nextQueryType: ObjectQueryTypeOf<
      ResolverType,
      Variables,
      QuerySchema & {
        [key in K]: { query: Subquery; paramInputs: Params }
      }
    > = new ObjectQueryType(
      this.resolverType,
      {
        ...this.schema,
        [key]: { query: subquery, paramInputs },
      },
      this.variables
    )

    return nextQueryType
  }

  listParamField<
    K extends Extract<keyof ObjectListFields, string>,
    Params extends VariableFieldParams<ObjectListFields[K], Variables>,
    SubquerySchema extends Record<string, { query: AnyQueryType; paramInputs: Record<never, any> }>,
    Subquery extends ObjectQueryTypeOf<ObjectListFields[K]['type'][0], Variables, SubquerySchema>
  >(
    key: K,
    paramInputs: Params,
    makeSubquery: (subquery: ObjectQueryTypeOf<ObjectListFields[K]['type'][0], Variables>) => Subquery
  ) {
    const schema = this.resolverType.schema as ObjectListFields
    const fieldDesc = schema[key]

    const emptySubquery = new ObjectQueryType(fieldDesc.type[0], {}, this.variables)
    const subquery = makeSubquery(emptySubquery)

    const nextQueryType: ObjectQueryTypeOf<
      ResolverType,
      Variables,
      QuerySchema & {
        [key in K]: { query: [Subquery]; paramInputs: Params }
      }
    > = new ObjectQueryType(
      this.resolverType,
      {
        ...this.schema,
        [key]: { query: [subquery], paramInputs },
      },
      this.variables
    )

    return nextQueryType
  }

  _unionField<
    K extends Extract<keyof UnionFields, string>,
    Union extends UnionFields[K]['type'],
    SubqueryFactories extends UnionSubqueryFactories<Union, Variables>
  >(key: K, makeSubqueries: SubqueryFactories) {
    const schema = this.resolverType.schema as UnionFields
    const fieldDesc = schema[key]

    const types = fieldDesc.type.types as Union['types']

    const unionQuery = new UnionQueryType(
      fieldDesc.type,
      Object.fromEntries(
        types.map((objectType) => {
          const emptySubquery = new ObjectQueryType(objectType, {}, this.variables)
          const makeSubquery = makeSubqueries[objectType.typename as UnionTypeNames<Union>]
          if (!makeSubquery) throw new Error(`Missing subquery for union type ${objectType.typename}`)
          // @ts-expect-error
          return [objectType.typename, makeSubquery(emptySubquery)]
        })
      ) as UnionSubqueries<Union, SubqueryFactories>
    )

    // @ts-expect-error
    const nextQueryType: ObjectQueryTypeOf<
      ResolverType,
      Variables,
      QuerySchema & {
        [key in K]: {
          query: UnionQueryType<Union, UnionSubqueries<Union, SubqueryFactories>>
          paramInputs: Record<never, any>
        }
      }
    > = new ObjectQueryType(
      this.resolverType,
      {
        ...this.schema,
        [key]: { query: unionQuery, paramInputs: {} },
      },
      this.variables
    )

    return nextQueryType
  }

  _unionListField<
    K extends Extract<keyof UnionListFields, string>,
    Union extends UnionListFields[K]['type'][0],
    SubqueryFactories extends UnionSubqueryFactories<Union, Variables>
  >(key: K, makeSubqueries: SubqueryFactories) {
    const schema = this.resolverType.schema as UnionListFields
    const fieldDesc = schema[key]

    const types = fieldDesc.type[0].types as Union['types']

    const unionQuery = new UnionQueryType(
      fieldDesc.type[0],
      Object.fromEntries(
        types.map((objectType) => {
          const emptySubquery = new ObjectQueryType(objectType, {}, this.variables)
          const makeSubquery = makeSubqueries[objectType.typename as UnionTypeNames<Union>]
          if (!makeSubquery) throw new Error(`Missing subquery for union type ${objectType.typename}`)
          // @ts-expect-error
          return [objectType.typename, makeSubquery(emptySubquery)]
        })
      ) as UnionSubqueries<Union, SubqueryFactories>
    )

    // @ts-expect-error
    const nextQueryType: ObjectQueryTypeOf<
      ResolverType,
      Variables,
      QuerySchema & {
        [key in K]: {
          query: [UnionQueryType<Union, UnionSubqueries<Union, SubqueryFactories>>]
          paramInputs: Record<never, any>
        }
      }
    > = new ObjectQueryType(
      this.resolverType,
      {
        ...this.schema,
        [key]: { query: [unionQuery], paramInputs: {} },
      },
      this.variables
    )

    return nextQueryType
  }

  variable<K extends string, T extends AnyInputValueType>(key: K, type: T) {
    const nextQueryType: ObjectQueryTypeOf<
      ResolverType,
      Variables & { [key in K]: { type: T; optional: false; defaultValue: null } },
      QuerySchema
    > = new ObjectQueryType(this.resolverType, this.schema, {
      ...this.variables,
      [key]: { type, optional: false, defaultValue: null },
    })

    return nextQueryType
  }

  optionalVariable<K extends string, T extends AnyInputValueType>(key: K, type: T, defaultValue: InputValue<T>) {
    const nextQueryType: ObjectQueryTypeOf<
      ResolverType,
      Variables & { [key in K]: { type: T; optional: true; defaultValue: InputValue<T> } },
      QuerySchema
    > = new ObjectQueryType(this.resolverType, this.schema, {
      ...this.variables,
      [key]: { type, optional: true, defaultValue },
    })

    return nextQueryType
  }
}

class VariableInput<Name extends string> {
  name: Name
  constructor(name: Name) {
    this.name = name
  }
}

export function queryType<Query extends AnyObjectType>(query: Query) {
  return new ObjectQueryType(query, {}, {})
}

export function variable<Name extends string>(name: Name) {
  return new VariableInput(name)
}

export function generateQueryString<Q extends AnyObjectQueryType>(
  queryType: Q,
  op: 'query' | 'mutation' | 'subscription'
): string {
  return [op, generateQueryVariableString(queryType), generateQueryStringPart(queryType)].filter(Boolean).join(' ')
}

function generateQueryVariableString<Q extends AnyObjectQueryType>(queryType: Q): string {
  const variableEntries = Object.entries(queryType.variables)
  if (variableEntries.length === 0) {
    return ''
  }

  return [
    '(',
    variableEntries
      .map(
        ([key, fieldDesc]) =>
          `$${key}: ${generateSchemaPart(fieldDesc.type).inline}${fieldDesc.optional ? '' : '!'}${
            fieldDesc.optional ? ' = ' + generateParamInputString(fieldDesc.defaultValue) : ''
          }`
      )
      .join(', '),
    ')',
  ].join('')
}

function generateQueryFieldParamInputStringPart<P extends Record<string, AnyParamInputType>>(paramInputs: P): string {
  const paramInputEntries = Object.entries(paramInputs)
  if (paramInputEntries.length === 0) {
    return ''
  }

  return [
    '(',
    paramInputEntries
      .map(
        ([key, fieldDesc]) =>
          `${key}: ${fieldDesc instanceof VariableInput ? `$${fieldDesc.name}` : generateParamInputString(fieldDesc)}`
      )
      .join(', '),
    ')',
  ].join('')
}

function generateQueryStringPart<Q extends AnyQueryType>(queryType: Q): string {
  if (Array.isArray(queryType)) {
    return generateQueryStringPart(queryType[0])
  }

  if (queryType instanceof UnionQueryType) {
    const fragments = Object.entries(queryType.queries).map(([typename, subqueryType]) => {
      return [`... on ${typename}`, generateQueryStringPart(subqueryType).trim()].join(' ')
    })

    return ['{', ...fragments.map((fragment) => fragment.replace(/^/gm, '  ')), '}'].join('\n')
  }

  if (queryType instanceof ObjectQueryType) {
    const fields = Object.entries(queryType.schema).map(([key, subqueryType]) => {
      return `${key}${generateQueryFieldParamInputStringPart(subqueryType.paramInputs)} ${generateQueryStringPart(
        subqueryType.query
      )
        .replace(/^/gm, '  ')
        .trim()}`.trim()
    })

    return ['{', ...fields.map((key) => `  ${key}`), '}'].join('\n')
  }

  if (queryType instanceof ScalarQueryType) {
    return ''
  }

  throw new Error('Unknown query')
}

export type QueryResult<Q extends AnyQueryType> = Q extends [infer T extends AnyObjectQueryType]
  ? Array<QueryResult<T>>
  : Q extends [infer T extends AnyUnionQueryType]
  ? Array<QueryResult<T>>
  : Q extends UnionQueryType<any, infer SubQ extends UnionSubqueries<AnyUnionType, any>>
  ? QueryResult<SubQ[keyof SubQ]>
  : Q extends ObjectQueryType<infer ResolverType, any, infer QuerySchema, any, any, any, any, any, any>
  ? {
      [K in keyof QuerySchema]:
        | QueryResult<QuerySchema[K]['query']>
        | (K extends keyof ResolverType['schema']
            ? ResolverType['schema'][K]['optional'] extends true
              ? null
              : never
            : never)
    }
  : Q extends [infer T extends ScalarQueryType<AnyType>]
  ? Array<QueryResult<T>>
  : Q extends ScalarQueryType<infer T>
  ? Value<T>
  : never

export function useQuery<Q extends AnyObjectQueryType>(queryType: Q): { data: QueryResult<Q> } {
  const gql = generateQueryString(queryType, 'query')
  console.log(gql)
  return { data: {} } as any
}

export function mutationType<Mutation extends AnyObjectType>(mutation: Mutation) {
  return new ObjectQueryType(mutation, {}, {})
}

export function useMutation<M extends AnyObjectQueryType>(mutationType: M): { data: QueryResult<M> } {
  const gql = generateQueryString(mutationType, 'mutation')
  console.log(gql)
  return { data: {} } as any
}

export function subscriptionType<Subscription extends AnyObjectType>(subscription: Subscription) {
  return new ObjectQueryType(subscription, {}, {})
}

export function useSubscription<M extends AnyObjectQueryType>(subscriptionType: M): { data: QueryResult<M> } {
  const gql = generateQueryString(subscriptionType, 'subscription')
  console.log(gql)
  return { data: {} } as any
}

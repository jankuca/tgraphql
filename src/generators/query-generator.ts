import assertNever from 'assert-never'

import { EnumValueType } from '../EnumValueType'
import { InputObjectType } from '../inputs/InputObjectType'
import { VariableInput } from '../inputs/VariableInput'
import { AnyObjectFragmentQueryType } from '../queries/ObjectFragmentQueryType'
import { AnyObjectQueryType, AnyParamInputType, ObjectQueryType } from '../queries/ObjectQueryType'
import { ScalarQueryType } from '../queries/ScalarQueryType'
import { UnionQueryType } from '../queries/UnionQueryType'
import { AnyQueryType } from '../types/AnyQueryType.type'
import { generateParamValue, generateSchemaPart } from './schema-generator'

export function generateQueryString<Q extends AnyObjectQueryType>(queryType: Q): string {
  const { hoisted, inline } = generateQueryTypeString(queryType)

  return [
    joinParts(' ', [
      queryType.opType,
      joinParts('', [queryType.name, generateQueryVariableListString(queryType)]),
      inline,
    ]),
    ...Object.values(hoisted),
  ].join('\n\n')
}

function generateQueryVariableListString<Q extends AnyObjectQueryType>(queryType: Q): string {
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
            typeof fieldDesc.defaultValue === 'undefined' ? '' : ' = ' + generateParamValue(fieldDesc.defaultValue)
          }`
      )
      .join(', '),
    ')',
  ].join('')
}

export function generateParamInputString(type: AnyParamInputType): string {
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

function generateQueryFieldParamInputListString<P extends Record<string, AnyParamInputType>>(paramInputs: P): string {
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

function generateQueryTypeString<Q extends AnyQueryType>(
  queryType: Q
): { inline: string; hoisted: Record<string, string> } {
  if (Array.isArray(queryType)) {
    return generateQueryTypeString(queryType[0])
  }

  if (queryType instanceof UnionQueryType) {
    const hoisted = {}

    const unionCases = Object.entries(queryType.queries).map(([typename, subqueryType]) => {
      const { hoisted: hoistedParts, inline } = generateQueryTypeString(subqueryType)
      Object.assign(hoisted, hoistedParts)
      return [`... on ${typename}`, inline.trim()].join(' ')
    })

    return { hoisted, inline: ['{', ...unionCases.map((unionCase) => unionCase.replace(/^/gm, '  ')), '}'].join('\n') }
  }

  if (queryType instanceof ObjectQueryType) {
    return generateObjectQueryTypeString(queryType)
  }

  if (queryType instanceof ScalarQueryType) {
    return { hoisted: {}, inline: '' }
  }

  throw new Error('Unknown query')
}

function generateQueryFragmentTypeString<F extends AnyObjectFragmentQueryType>(
  fragmentType: F
): { inline: string; hoisted: Record<string, string> } {
  const { hoisted, inline } = generateObjectQueryTypeString(fragmentType.query)

  return {
    hoisted: {
      ...hoisted,
      [fragmentType.name]: ['fragment', fragmentType.name, 'on', fragmentType.query.resolverType.typename, inline].join(
        ' '
      ),
    },
    inline: `...${fragmentType.name}`,
  }
}

function generateObjectQueryTypeString<Q extends AnyObjectQueryType>(
  queryType: Q
): { hoisted: Record<string, string>; inline: string } {
  const hoisted = {}

  const fragments = queryType.fragments.map((fragment) => {
    const { hoisted: hoistedParts, inline } = generateQueryFragmentTypeString(fragment)
    Object.assign(hoisted, hoistedParts)
    return inline
  })

  const fields = Object.entries(queryType.schema).map(([key, subqueryType]) => {
    const { hoisted: hoistedParts, inline } = generateQueryTypeString(subqueryType.query)
    Object.assign(hoisted, hoistedParts)

    return `${key}${generateQueryFieldParamInputListString(subqueryType.paramInputs)} ${inline
      .replace(/^/gm, '  ')
      .trim()}`.trim()
  })

  return {
    hoisted,
    inline: ['{', ...fragments, ...fields.map((key) => `  ${key}`), '}'].join('\n'),
  }
}

function joinParts(separator: string, parts: Array<string | null>): string {
  return parts.filter(Boolean).join(separator)
}

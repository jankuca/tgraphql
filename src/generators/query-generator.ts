import assertNever from 'assert-never'

import { EnumValueType } from '../EnumValueType'
import { InputObjectType } from '../inputs/InputObjectType'
import { VariableInput } from '../inputs/VariableInput'
import { AnyObjectQueryType, AnyParamInputType, ObjectQueryType } from '../queries/ObjectQueryType'
import { ScalarQueryType } from '../queries/ScalarQueryType'
import { UnionQueryType } from '../queries/UnionQueryType'
import { AnyQueryType } from '../types/AnyQueryType.type'
import { generateParamValue, generateSchemaPart } from './schema-generator'

export function generateQueryString<Q extends AnyObjectQueryType>(queryType: Q): string {
  return joinParts(' ', [
    queryType.opType,
    joinParts('', [queryType.name, generateQueryVariableListString(queryType)]),
    generateQueryTypeString(queryType),
  ])
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

function generateQueryTypeString<Q extends AnyQueryType>(queryType: Q): string {
  if (Array.isArray(queryType)) {
    return generateQueryTypeString(queryType[0])
  }

  if (queryType instanceof UnionQueryType) {
    const fragments = Object.entries(queryType.queries).map(([typename, subqueryType]) => {
      return [`... on ${typename}`, generateQueryTypeString(subqueryType).trim()].join(' ')
    })

    return ['{', ...fragments.map((fragment) => fragment.replace(/^/gm, '  ')), '}'].join('\n')
  }

  if (queryType instanceof ObjectQueryType) {
    const fields = Object.entries(queryType.schema).map(([key, subqueryType]) => {
      return `${key}${generateQueryFieldParamInputListString(subqueryType.paramInputs)} ${generateQueryTypeString(
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

function joinParts(separator: string, parts: Array<string | null>): string {
  return parts.filter(Boolean).join(separator)
}

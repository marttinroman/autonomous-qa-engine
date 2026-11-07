import type { ErrorObject } from 'ajv';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { parse as parseYaml } from 'yaml';

// Instantiate Ajv with standard production defaults
const ajv = new Ajv({
  allErrors: true,
  strict: false,
  validateFormats: true,
  verbose: true,
});

// Register standard formats (date-time, uuid, email, uri, etc.)
addFormats(ajv);

let openApiSpecCache: Record<string, unknown> | null = null;

function loadOpenApiSpec(): Record<string, unknown> {
  if (openApiSpecCache) {
    return openApiSpecCache;
  }
  const specPath = resolve(process.cwd(), 'tests/schemas/openapi.yaml');
  try {
    const raw = readFileSync(specPath, 'utf-8');
    openApiSpecCache = parseYaml(raw) as Record<string, unknown>;
    return openApiSpecCache;
  }
  catch {
    // Fallback to SRS location if tests/schemas/openapi.yaml is not yet created
    const fallbackPath = resolve(process.cwd(), '.context/SRS/api-contracts.yaml');
    const raw = readFileSync(fallbackPath, 'utf-8');
    openApiSpecCache = parseYaml(raw) as Record<string, unknown>;
    return openApiSpecCache;
  }
}

export interface SchemaValidationResult {
  valid: boolean
  schemaName?: string
  durationMs: number
  errors?: string[]
  rawErrors?: ErrorObject[]
}

/**
 * Resolves a schema object from either a raw JSON Schema or a named OpenAPI component schema.
 */
export function resolveSchema(schemaOrComponentName: object | string): object {
  if (typeof schemaOrComponentName === 'string') {
    const spec = loadOpenApiSpec();
    const components = (spec.components || {}) as {
      schemas?: Record<string, object>
    };
    const schema = components.schemas?.[schemaOrComponentName];
    if (!schema) {
      throw new Error(
        `[schemaValidator] Component schema "${schemaOrComponentName}" not found in OpenAPI spec.`,
      );
    }
    return schema;
  }
  return schemaOrComponentName;
}

/**
 * Validates a payload against an OpenAPI component schema or JSON schema.
 * Benchmark requirement: executes in < 5ms.
 */
export function validateSchema(
  data: unknown,
  schemaOrComponentName: object | string,
  options?: { throwOnError?: boolean },
): SchemaValidationResult {
  const start = performance.now();
  const schema = resolveSchema(schemaOrComponentName);
  const schemaKey
    = typeof schemaOrComponentName === 'string'
      ? schemaOrComponentName
      : JSON.stringify(schema);

  let validate = ajv.getSchema(schemaKey);
  if (!validate) {
    ajv.addSchema(schema, schemaKey);
    validate = ajv.getSchema(schemaKey);
  }

  if (!validate) {
    throw new Error(
      `[schemaValidator] Failed to compile schema: ${typeof schemaOrComponentName === 'string' ? schemaOrComponentName : 'inline'}`,
    );
  }

  const valid = Boolean(validate(data));
  const durationMs = Number((performance.now() - start).toFixed(2));

  let errorMessages: string[] | undefined;
  if (!valid && validate.errors) {
    errorMessages = validate.errors.map(
      err => `${err.instancePath || '/'} ${err.message ?? 'failed schema validation'}`,
    );
  }

  const result: SchemaValidationResult = {
    valid,
    schemaName: typeof schemaOrComponentName === 'string' ? schemaOrComponentName : undefined,
    durationMs,
    errors: errorMessages,
    rawErrors: validate.errors ?? undefined,
  };

  if (!valid && options?.throwOnError) {
    const errorDetails = errorMessages?.join(', ') || 'Unknown schema validation error';
    throw new Error(
      `[Contract Drift Detected] Data failed validation for schema "${result.schemaName || 'inline'}": ${errorDetails}`,
    );
  }

  return result;
}

/**
 * Convenience assertion helper: validates and throws if contract drift occurs.
 */
export function assertSchema(data: unknown, schemaOrComponentName: object | string): void {
  validateSchema(data, schemaOrComponentName, { throwOnError: true });
}

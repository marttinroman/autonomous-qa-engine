import { test } from '@playwright/test';

export interface AtcOptions {
  softFail?: boolean
  severity?: 'blocker' | 'critical' | 'normal' | 'minor' | 'trivial'
  description?: string
}

/**
 * Sanitizes arguments for readable step logs without leaking sensitive information.
 */
function formatArguments(args: unknown[]): string {
  if (args.length === 0) { return ''; }

  const sensitiveKeys = new Set([
    'password',
    'token',
    'secret',
    'authorization',
    'accesstoken',
    'access_token',
  ]);

  const sanitized = args.map((arg) => {
    if (typeof arg === 'string') {
      return arg.length > 80 ? `"${arg.slice(0, 77)}..."` : `"${arg}"`;
    }
    if (typeof arg === 'number' || typeof arg === 'boolean' || arg === null || arg === undefined) {
      return String(arg);
    }
    if (Array.isArray(arg)) {
      return `[Array(${arg.length})]`;
    }
    if (typeof arg === 'object') {
      try {
        const cleanObj: Record<string, unknown> = {};
        const entries = Object.entries(arg as Record<string, unknown>);
        for (const [key, value] of entries.slice(0, 5)) {
          cleanObj[key] = sensitiveKeys.has(key.toLowerCase()) ? '***' : value;
        }
        const str = JSON.stringify(cleanObj);
        return str.length > 120 ? `${str.slice(0, 117)}...}` : str;
      }
      catch {
        return '[Object]';
      }
    }
    return String(arg);
  });

  return sanitized.join(', ');
}

/**
 * TC39 Stage 3 @atc decorator for KATA Acceptance Test Cases.
 * Wraps execution inside test.step() with Jira/Xray traceability.
 */
export function atc(testId: string, options?: AtcOptions) {
  return function <This, Args extends unknown[], Return>(
    originalMethod: (this: This, ...args: Args) => Promise<Return> | Return,
    context: ClassMethodDecoratorContext<
      This,
      (this: This, ...args: Args) => Promise<Return> | Return
    >,
  ) {
    const methodName = String(context.name);

    return async function (this: This, ...args: Args): Promise<Return | undefined> {
      const formattedArgs = formatArguments(args);
      const stepTitle = `ATC [${testId}]: ${methodName}(${formattedArgs})`;

      return test.step(stepTitle, async () => {
        const start = performance.now();
        try {
          const result = await originalMethod.apply(this, args);
          const duration = Math.round(performance.now() - start);
          console.log(`✅ [${testId}] ${methodName} - PASS (${duration}ms)`);
          return result;
        }
        catch (error) {
          const duration = Math.round(performance.now() - start);
          console.error(`❌ [${testId}] ${methodName} - FAIL (${duration}ms)`);

          if (options?.softFail) {
            console.warn(
              `⚠️ Soft-fail enabled for [${testId}]: ${(error as Error).message}`,
            );
            return undefined;
          }
          throw error;
        }
      });
    };
  };
}

/**
 * TC39 Stage 3 @step decorator for read-only helper methods.
 */
export function step<This, Args extends unknown[], Return>(
  originalMethod: (this: This, ...args: Args) => Promise<Return> | Return,
  context: ClassMethodDecoratorContext<
    This,
    (this: This, ...args: Args) => Promise<Return> | Return
  >,
) {
  const methodName = String(context.name);

  return async function (this: This, ...args: Args): Promise<Return> {
    const formattedArgs = formatArguments(args);
    const stepTitle = `${methodName}(${formattedArgs})`;

    return test.step(stepTitle, async () => {
      return originalMethod.apply(this, args);
    });
  };
}

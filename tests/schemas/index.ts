/**
 * OpenAPI Domain Type Aliases
 *
 * Re-exports strongly typed domain interfaces derived directly
 * from .context/SRS/api-contracts.yaml via openapi-typescript.
 */

import type { components } from './api.types';

export type HealthCheckResponse = components['schemas']['HealthCheckResponse'];
export type LoginRequest = components['schemas']['LoginRequest'];
export type LoginResponse = components['schemas']['LoginResponse'];
export type UserProfile = components['schemas']['UserProfile'];
export type RAGQueryRequest = components['schemas']['RAGQueryRequest'];
export type RAGQueryResponse = components['schemas']['RAGQueryResponse'];
export type ContextChunk = components['schemas']['ContextChunk'];
export type SemanticEvaluationRequest = components['schemas']['SemanticEvaluationRequest'];
export type SemanticEvaluationResponse = components['schemas']['SemanticEvaluationResponse'];
export type TestExecutionRecord = components['schemas']['TestExecutionRecord'];
export type TestSuiteRunRequest = components['schemas']['TestSuiteRunRequest'];
export type TestSuiteRunResponse = components['schemas']['TestSuiteRunResponse'];
export type QualityGateStatus = components['schemas']['QualityGateStatus'];
export type ErrorResponse = components['schemas']['ErrorResponse'];

export * from './api.types';

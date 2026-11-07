import 'dotenv/config';

export type Environment = 'local' | 'staging' | 'production';

export interface EnvironmentConfig {
  envName: Environment
  webUrl: string
  apiUrl: string
  userEmail: string
  userPassword?: string
  authToken?: string
  slaP95Ms: number
  slaP99Ms: number
  aiSimilarityThreshold: number
  aiFaithfulnessThreshold: number
  isCi: boolean
}

const activeEnv = (process.env.TEST_ENV || 'local').toLowerCase() as Environment;

const webUrls: Record<Environment, string> = {
  local: process.env.LOCAL_WEB_URL || 'http://localhost:3000',
  staging: process.env.STAGING_WEB_URL || 'https://staging.autonomous-qa.engine',
  production: process.env.PROD_WEB_URL || 'https://autonomous-qa.engine',
};

const apiUrls: Record<Environment, string> = {
  local: process.env.LOCAL_API_URL || 'http://localhost:3000/api/v1',
  staging: process.env.STAGING_API_URL || 'https://staging.autonomous-qa.engine/api/v1',
  production: process.env.PROD_API_URL || 'https://api.autonomous-qa.engine/api/v1',
};

export const config: EnvironmentConfig = {
  envName: activeEnv,
  webUrl: webUrls[activeEnv] || webUrls.local,
  apiUrl: apiUrls[activeEnv] || apiUrls.local,
  userEmail: process.env.TEST_USER_EMAIL || 'alex.sdet@example.com',
  userPassword: process.env.TEST_USER_PASSWORD || 'SecurePassword123!',
  authToken: process.env.TEST_AUTH_TOKEN || '',
  slaP95Ms: Number(process.env.API_SLA_P95_MS || 500),
  slaP99Ms: Number(process.env.API_SLA_P99_MS || 1000),
  aiSimilarityThreshold: Number(process.env.AI_SIMILARITY_THRESHOLD || 0.8),
  aiFaithfulnessThreshold: Number(process.env.AI_FAITHFULNESS_THRESHOLD || 0.85),
  isCi: process.env.CI === 'true',
};

export default config;

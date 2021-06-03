import { IntegrationInvocationConfig } from '@jupiterone/integration-sdk-core';
import { integrationStep } from './steps';
import { validateInvocation } from './validateInvocation';
import { IntegrationConfig } from './types';

export const invocationConfig: IntegrationInvocationConfig<IntegrationConfig> = {
  instanceConfigFields: {
    directoryId: {
      type: 'string',
      mask: true,
    },
    clientId: {
      type: 'string',
    },
    clientSecret: {
      type: 'string',
      mask: true,
    },
  },
  validateInvocation,
  integrationSteps: [integrationStep],
};

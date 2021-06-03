import {
  IntegrationInstanceConfig,
  IntegrationStepExecutionContext,
} from '@jupiterone/integration-sdk-core';

export type IntegrationStepContext = IntegrationStepExecutionContext<
  IntegrationConfig
>;

/**
 * Properties provided by the `IntegrationInstance.config`. Values identifying
 * the Service Principal are included.
 *
 * The Service Principal is used for Microsoft Graph API.
 */
export interface IntegrationConfig extends IntegrationInstanceConfig {
  /**
   * The Service Principal client identifier used to obtain API access tokens.
   */
  clientId: string;

  /**
   * The Service Principal client secret used to obtain API access tokens.
   */
  clientSecret: string;

  /**
   * The domain or tenant ID containing the Service Principal used to obtain API
   * access tokens AND to target for ingesting Microsoft Graph resources.
   *
   * The current expectation is that an App Registration, restricted to the
   * tenant it belongs to, is created in the target tenant, and the target
   * tenant has had an Administrator grant read access to Microsoft Graph
   * resources ingested by the program.
   */
  directoryId: string;
}

export interface DirectoryAudit {
  id: string;
  category: string;
  correlationId: string;
  result: string;
  resultReason: string;
  activityDisplayName: string;
  activityDateTime: string;
  loggedByService: string;
  operationType: string;
  initiatedBy: InitiatedBy;
  targetResources?: TargetResourcesEntity[] | null;
  additionalDetails?: (AdditionalDetailsEntity | null)[] | null;
}

interface InitiatedBy {
  app?: App | null;
  user?: User | null;
}

interface App {
  appId?: null;
  displayName: string;
  servicePrincipalId: string;
  servicePrincipalName?: null;
}

interface User {
  id: string;
  displayName?: null;
  userPrincipalName: string;
  ipAddress: string;
  userType?: null;
}

interface TargetResourcesEntity {
  id: string;
  displayName?: string | null;
  type: string;
  userPrincipalName?: string | null;
  groupType?: string | null;
  modifiedProperties?: (ModifiedPropertiesEntity | null)[] | null;
}

interface ModifiedPropertiesEntity {
  displayName: string;
  oldValue?: string | null;
  newValue?: string | null;
}

interface AdditionalDetailsEntity {
  key: string;
  value: string;
}

import {
  createIntegrationEntity,
  createMappedRelationship,
  IntegrationStepExecutionContext,
  RelationshipClass,
  RelationshipDirection,
  Step,
} from '@jupiterone/integration-sdk-core';
import { AuditLogClient } from '../client';
import { DirectoryAudit, IntegrationConfig } from '../types';

function shouldIngestDirectoryAuditResources(directoryAudit: DirectoryAudit) {
  if (directoryAudit.initiatedBy.app) {
    if (directoryAudit.operationType === 'Assign') {
      // ['Add member to group', 'Add member to role'].includes(directoryAudit.activityDisplayName);
      return true;
    }
  }
  return false;
}

const integrationStep: Step<IntegrationStepExecutionContext<
  IntegrationConfig
>> = {
  id: 'fetch-ad-audit-logs',
  name: 'Fetch AD Audit Logs',
  entities: [
    {
      resourceName: 'Active Directory Audit Log',
      _type: 'azure_ad_audit_event',
      _class: 'Record',
    },
  ],
  relationships: [
    {
      _type: 'azure_service_principal_performed_audit_event',
      sourceType: 'azure_service_principal',
      _class: RelationshipClass.PERFORMED,
      targetType: 'azure_ad_audit_event',
    },
    {
      _type: 'azure_user_performed_audit_event',
      sourceType: 'azure_user',
      _class: RelationshipClass.PERFORMED,
      targetType: 'azure_ad_audit_event',
    },
    {
      _type: 'azure_audit_event_updated_target',
      sourceType: 'azure_ad_audit_event',
      _class: RelationshipClass.UPDATED,
      targetType: 'azure_ad_resource',
    },
  ],
  executionHandler: async ({ logger, jobState, instance }) => {
    const client = new AuditLogClient(logger, instance.config);

    await client.iterateDirectoryAudits(async (directoryAudit) => {
      if (!shouldIngestDirectoryAuditResources(directoryAudit)) return;

      const directoryAuditEntity = await jobState.addEntity(
        createIntegrationEntity({
          entityData: {
            source: directoryAudit,
            assign: {
              _key: directoryAudit.id,
              _type: 'azure_ad_audit_event',
              _class: 'Record',
              name: directoryAudit.id,
              id: directoryAudit.id,
              category: directoryAudit.category,
              correlationId: directoryAudit.correlationId,
              result: directoryAudit.result,
              resultReason: directoryAudit.resultReason,
              activityDisplayName: directoryAudit.activityDisplayName,
              activityDateTime: directoryAudit.activityDateTime,
              loggedByService: directoryAudit.loggedByService,
              operationType: directoryAudit.operationType,
            },
          },
        }),
      );

      if (directoryAudit.initiatedBy.app) {
        const app = directoryAudit.initiatedBy.app;
        await jobState.addRelationship(
          createMappedRelationship({
            source: directoryAuditEntity,
            _class: RelationshipClass.PERFORMED,
            target: {
              _type: 'azure_service_principal',
              _key: app.servicePrincipalId,
              appId: app.appId,
              displayName: app.displayName ?? undefined,
              servicePrincipalId: app.servicePrincipalId,
              servicePrincipalName: app.servicePrincipalName,
            },
            targetFilterKeys: [['_key']],
            relationshipDirection: RelationshipDirection.REVERSE,
          }),
        );
      }

      if (directoryAudit.initiatedBy.user) {
        const user = directoryAudit.initiatedBy.user;
        await jobState.addRelationship(
          createMappedRelationship({
            source: directoryAuditEntity,
            _class: RelationshipClass.PERFORMED,
            target: {
              _type: 'azure_user',
              _key: user.id,
              id: user.id,
              displayName: user.displayName ?? undefined,
              userType: user.userType,
            },
            targetFilterKeys: [['_key']],
            relationshipDirection: RelationshipDirection.REVERSE,
            properties: {
              ipAddress: user.ipAddress,
            },
          }),
        );
      }

      for (const targetResource of directoryAudit.targetResources || []) {
        await jobState.addRelationship(
          createMappedRelationship({
            source: directoryAuditEntity,
            _class: RelationshipClass.UPDATED,
            target: {
              _type: 'azure_principal',
              _key: targetResource.id,
              displayName: targetResource.displayName ?? undefined,
              userPrincipalName: targetResource.userPrincipalName,
              id: targetResource.id,
              type: targetResource.type,
              groupType: targetResource.groupType,
            },
            targetFilterKeys: [['_key']],
          }),
        );
      }
    });
  },
};

export { integrationStep };

import { clients } from '@jupiterone/graph-azure';
import { IntegrationValidationError } from '@jupiterone/integration-sdk-core';
import { DirectoryAudit } from './types';

const { GraphClient } = clients;

export type IterableGraphResponse<T> = {
  value: T[];
};

export class AuditLogClient extends GraphClient {
  private async iterateResources<T>({
    resourceUrl,
    options,
    callback,
  }: {
    resourceUrl: string;
    options?: { select?: string[]; useBeta?: boolean };
    callback: (item: T) => void | Promise<void>;
  }): Promise<void> {
    let nextLink: string | undefined;
    do {
      let api = this.client.api(nextLink || resourceUrl);
      if (options?.useBeta) {
        api = api.version('beta');
      }
      if (options?.select) {
        api = api.select(options.select);
      }

      const response = await this.request<IterableGraphResponse<T>>(api);
      if (response) {
        nextLink = response['@odata.nextLink'];
        for (const value of response.value) {
          try {
            await callback(value);
          } catch (err) {
            this.logger.error(
              {
                err,
              },
              'Callback error while iterating an API response in DirectoryGraphClient',
            );
          }
        }
      } else {
        nextLink = undefined;
      }
    } while (nextLink);
  }

  public async iterateDirectoryAudits(
    callback: (role: DirectoryAudit) => void | Promise<void>,
  ): Promise<void> {
    const resourceUrl = '/auditLogs/directoryAudits';
    this.logger.info('Iterating directory audits.');
    return this.iterateResources({
      resourceUrl,
      callback,
    });
  }

  public async validateInvocation() {
    const resourceUrl = '/auditLogs/directoryAudits';
    try {
      const api = this.client.api(resourceUrl);
      await this.request<IterableGraphResponse<DirectoryAudit>>(api);
    } catch (err) {
      throw new IntegrationValidationError(err);
    }
  }
}

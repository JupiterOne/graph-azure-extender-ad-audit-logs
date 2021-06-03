import * as dotenv from 'dotenv';
import * as path from 'path';
import { IntegrationConfig } from '../src/types';

if (process.env.LOAD_ENV) {
  dotenv.config({
    path: path.join(__dirname, '../.env'),
  });
}

const DEFAULT_DIRECTORY_ID = 'dummy-directory-id';
const DEFAULT_CLIENT_ID = 'dummy-acme-client-id';
const DEFAULT_CLIENT_SECRET = 'dummy-acme-client-secret';

export const integrationConfig: IntegrationConfig = {
  directoryId: process.env.DIRECTORY_ID || DEFAULT_DIRECTORY_ID,
  clientId: process.env.CLIENT_ID || DEFAULT_CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET || DEFAULT_CLIENT_SECRET,
};

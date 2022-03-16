#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as dotenv from 'dotenv';
import { KeyStack } from '../lib/key-stack';
import { CdkCrossAccountSecretSharingStack } from '../lib/cdk-cross-account-secret-sharing-stack';

const app = new cdk.App();

if (!process.env.DATALAKE_ACCOUNT_NUMBER) {
  dotenv.config({ path: `${__dirname}/../.env.local` });
}

const { DATALAKE_ACCOUNT_NUMBER, VPCNAME } = process.env;

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const keystack = new KeyStack(app, 'CrossAccountKeys', { env, dlaccount: DATALAKE_ACCOUNT_NUMBER as string });
const sharingstack = new CdkCrossAccountSecretSharingStack(app, 'CdkCrossAccountSecretSharingStack', {
  env,
  vpcName: VPCNAME!,
});
sharingstack.addDependency(keystack);

// aws secretsmanager get-secret-value --secret-id arn:aws:secretsmanager:us-east-1:173975140544:secret:generate_rds_credential-Iu7DJ3 --version-stage AWSCURRENT
// --profile test

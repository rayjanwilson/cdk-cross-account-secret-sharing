#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdkCrossAccountSecretSharingStack } from '../lib/cdk-cross-account-secret-sharing-stack';

const app = new cdk.App();
new CdkCrossAccountSecretSharingStack(app, 'CdkCrossAccountSecretSharingStack', {});

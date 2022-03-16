import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

export interface IProps extends cdk.StackProps {
  dlaccount: string;
}

export class KeyStack extends cdk.Stack {
  public s3Key: kms.Key;
  public rdsKey: kms.Key;
  public secretManagerKey: kms.Key;

  constructor(scope: Construct, id: string, props: IProps) {
    super(scope, id);

    const stagename: string = this.node.tryGetContext('stageName') ?? 'dev';

    const datalake_account_number = props.dlaccount;
    const datalake_account_principal = new iam.AccountPrincipal(datalake_account_number);

    const keyAdminRole = new iam.Role(this, 'KeyRole', {
      assumedBy: new iam.AccountPrincipal(cdk.Aws.ACCOUNT_ID),
      managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('AWSKeyManagementServicePowerUser')],
    });

    this.s3Key = new kms.Key(this, 'S3Key', {
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      alias: 's3key',
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountPrincipal(cdk.Aws.ACCOUNT_ID), new iam.ArnPrincipal(keyAdminRole.roleArn)],
            actions: ['kms:*'],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            principals: [new iam.AnyPrincipal()],
            actions: ['kms:Encrypt', 'kms:Decrypt', 'kms:ReEncrypt*', 'kms:GenerateDataKey*', 'kms:DescribeKey'],
            resources: ['*'],
            conditions: {
              StringEquals: {
                'kms:CallerAccount': cdk.Aws.ACCOUNT_ID,
                'kms:ViaService': `s3.${cdk.Aws.REGION}.amazonaws.com`,
              },
            },
          }),
        ],
      }),
    });

    // s3Key.grantAdmin(keyAdminRole);
    this.exportValue(this.s3Key.keyArn, { name: `S3KeyArn${stagename}` });

    this.rdsKey = new kms.Key(this, 'RDSKey', {
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      alias: 'rdskey',
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountPrincipal(cdk.Aws.ACCOUNT_ID), new iam.ArnPrincipal(keyAdminRole.roleArn)],
            actions: ['kms:*'],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            principals: [new iam.AnyPrincipal()],
            actions: ['kms:Encrypt', 'kms:Decrypt', 'kms:ReEncrypt*', 'kms:GenerateDataKey*', 'kms:DescribeKey'],
            resources: ['*'],
            conditions: {
              StringEquals: {
                'kms:CallerAccount': cdk.Aws.ACCOUNT_ID,
                'kms:ViaService': `s3.${cdk.Aws.REGION}.amazonaws.com`,
              },
            },
          }),
        ],
      }),
    });
    // rdsKey.grantAdmin(keyAdminRole);
    this.exportValue(this.rdsKey.keyArn, { name: `RdsKeyArn${stagename}` });

    this.secretManagerKey = new kms.Key(this, 'SMKey', {
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      alias: 'secretmanagerkey',
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountPrincipal(cdk.Aws.ACCOUNT_ID), new iam.ArnPrincipal(keyAdminRole.roleArn)],
            actions: ['kms:*'],
            resources: ['*'],
          }),
          // new iam.PolicyStatement({
          //   effect: iam.Effect.ALLOW,
          //   principals: [new iam.AnyPrincipal()],
          //   actions: ['kms:Encrypt', 'kms:Decrypt', 'kms:ReEncrypt*', 'kms:GenerateDataKey*', 'kms:DescribeKey'],
          //   resources: ['*'],
          //   conditions: {
          //     StringEquals: {
          //       'kms:CallerAccount': cdk.Aws.ACCOUNT_ID,
          //       'kms:ViaService': `s3.${cdk.Aws.REGION}.amazonaws.com`,
          //     },
          //   },
          // }),
          // new iam.PolicyStatement({
          //   effect: iam.Effect.ALLOW,
          //   principals: [new iam.AnyPrincipal()],
          //   actions: ['kms:Decrypt', 'kms:DescribeKey'],
          //   resources: ['*'],
          //   conditions: {
          //     StringEquals: {
          //       'kms:CallerAccount': datalake_account_number,
          //       'kms:ViaService': `s3.${cdk.Aws.REGION}.amazonaws.com`,
          //     },
          //   },
          // }),
        ],
      }),
    });
    this.secretManagerKey.grantDecrypt(datalake_account_principal);
    // secretManagerKey.grantAdmin(keyAdminRole);
    this.exportValue(this.secretManagerKey.keyArn, { name: `SmKeyArn${stagename}` });

    // const rds_credentials = new rds.DatabaseSecret(this, 'rdssecret', {
    //   username: 'admin',
    //   secretName: `aurora-credentials-${stagename}`,
    //   encryptionKey: secretManagerKey,
    // });
    // this.exportValue(rds_credentials.secretFullArn, { name: `${projectName}-aurora-secret-arn-${stagename}` });
    // const datalake_account = new iam.AccountPrincipal(datalake_account_number);
    // const rds_credentials_secret = new secretsmanager.Secret(this, `${projectName}-AuroraSecret-${stagename}`, {
    //   secretName: `aurora-credentials-${stagename}`,
    //   generateSecretString: {
    //     secretStringTemplate: JSON.stringify({
    //       username: 'admin',
    //     }),
    //     generateStringKey: 'password',
    //     excludePunctuation: true,
    //   },
    //   encryptionKey: secretManagerKey,
    //   removalPolicy: cdk.RemovalPolicy.DESTROY,
    // });
    // rds_credentials_secret.grantRead(datalake_account);
  }
}

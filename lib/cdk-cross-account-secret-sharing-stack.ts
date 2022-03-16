import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as cdk from 'aws-cdk-lib';
import * as sm from 'aws-cdk-lib/aws-secretsmanager';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export interface IProps extends cdk.StackProps {
  vpcName: string;
}

export class CdkCrossAccountSecretSharingStack extends Stack {
  constructor(scope: Construct, id: string, props: IProps) {
    super(scope, id, props);

    const { vpcName } = props;

    const smKey = kms.Key.fromKeyArn(this, 'smkeyimport', cdk.Fn.importValue('SmKeyArndev'));

    const vpc = ec2.Vpc.fromLookup(this, 'Vpc', { vpcName });

    const cluster = new rds.DatabaseCluster(this, 'Database', {
      engine: rds.DatabaseClusterEngine.auroraMysql({ version: rds.AuroraMysqlEngineVersion.VER_2_08_1 }),
      defaultDatabaseName: 'sampledev',
      credentials: {
        username: 'admin',
        encryptionKey: smKey,
        secretName: 'generate_rds_credential',
      },
      instanceProps: {
        // optional , defaults to t3.medium
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.SMALL),
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        vpc,
      },
    });

    const datalake_account_number = process.env.DATALAKE_ACCOUNT_NUMBER;
    const datalake_account_principal = new iam.AccountPrincipal(datalake_account_number);
    cluster.secret?.grantRead(datalake_account_principal);
  }
}

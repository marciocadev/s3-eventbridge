import { App, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Rule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { BlockPublicAccess, Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { join } from 'path';

export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    const bucket = new Bucket(this, 'Bucket', {
      bucketName: 'lazy-s3-eventbridge',
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      publicReadAccess: false,
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
      eventBridgeEnabled: true,
    });

    const lambda = new NodejsFunction(this, 'Lambda', {
      entry: join(__dirname, 'lambda-fns/index.ts'),
      handler: 'handler',
      runtime: Runtime.NODEJS_16_X,
    });

    new Rule(this, 'Rule', {
      targets: [new LambdaFunction(lambda)],
      eventPattern: {
        source: ['aws.s3'],
        detailType: [
          'Object Created',
          'Object Deleted',
          'Object Tags Added',
          'Object Tags Deleted',
        ],
        detail: {
          bucket: {
            name: [bucket.bucketName],
          },
        },
      },
    });
  }
}

// for development, use account/region from cdk cli
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new MyStack(app, 's3-eventbridge-dev', { env: devEnv });
// new MyStack(app, 's3-eventbridge-prod', { env: prodEnv });

app.synth();
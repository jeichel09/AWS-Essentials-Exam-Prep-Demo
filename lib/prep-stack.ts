import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Lambda } from 'aws-cdk-lib/aws-ses-actions';
import { CfnOutput } from 'aws-cdk-lib';
import { Topic, Subscription, SubscriptionProtocol } from 'aws-cdk-lib/aws-sns';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class PrepStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const errorTable : dynamodb.Table = new dynamodb.Table(this, 'ErrorTable', {
      partitionKey: { 
        name: 'id', 
        type: dynamodb.AttributeType.STRING 
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl'
    });

    const errorTopic : Topic = new Topic(this, 'ErrorTopic', { 
      topicName: 'ErrorTopic'
    });

    const processFunction = new NodejsFunction(this, 'ProcessFunction', {
      runtime: Runtime.NODEJS_20_X,
      entry: `${__dirname}/../src/processFunction.ts`,
      handler: 'handler',
      environment: {
        TABLE_NAME: errorTable.tableName,
        TOPIC_ARN: errorTopic.topicArn
      }
    });

    errorTable.grantReadWriteData(processFunction);
    errorTopic.grantPublish(processFunction);

    const api = new RestApi(this, 'ProcessorApi');
    const resource = api.root.addResource('processJSON');
    resource.addMethod('POST', new LambdaIntegration(processFunction));

    new Subscription(this, 'ErrorSubscription', {
      topic: errorTopic,
      protocol: SubscriptionProtocol.EMAIL,
      endpoint: 'dunyto@etik.com'
    });

    new CfnOutput(this, 'RESTApiEndpoint', {
      value: `https://${api.restApiId}.execute-api.${this.region}.amazonaws.com/prod/processJSON`
    });
  }  
}
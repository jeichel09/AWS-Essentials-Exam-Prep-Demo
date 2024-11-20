import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Lambda } from 'aws-cdk-lib/aws-ses-actions';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class PrepStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const errorTable : dynamodb.Table = new dynamodb.Table(this, 'ErrorTable', {
      partitionKey: { 
        name: 'id', 
        type: dynamodb.AttributeType.STRING 
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST
    });

    const processFunction = new NodejsFunction(this, 'ProcessFunction', {
      runtime: Runtime.NODEJS_20_X,
      entry: `${__dirname}/../src/processFunction.ts`,
      handler: 'handler',
    });

    const api = new RestApi(this, 'ProcessorApi');
    const resource = api.root.addResource('processJSON');
    resource.addMethod('POST', new LambdaIntegration(processFunction));
  }  
}
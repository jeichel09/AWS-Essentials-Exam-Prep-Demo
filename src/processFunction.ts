import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { v4 } from 'uuid';


const snsClient = new SNSClient({});
const dynamoDBClient = new DynamoDBClient({});

export const handler = async (event: any) => {
    const tableName = process.env.TABLE_NAME;
    const topicArn = process.env.TOPIC_ARN;
    
    console.log(event);

    const body = JSON.parse(event.body);

    console.log(body);
    

    if (!body || !body.text) {

        const ttl = Math.floor(Date.now() / 1000) + 1800;
        
        await dynamoDBClient.send(new PutItemCommand({
            TableName: tableName,
            Item: {
                id: { S: v4() },
                errorMessage: { S: 'Invalid JSON received' },
                ttl: { N: ttl.toString() }  
            },

        }));
    } else {
        await snsClient.send(new PublishCommand({
            TopicArn: topicArn,
            Message: `Valid JSON received: ${body.text}`
        }));
        console.log('Notification sent!');
    }
    
    return {
        statusCode: 200,
        body: 'Hello from Lambda!'
    };
};
import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { TodoItem } from '../models/TodoItem'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'

const XAWS = AWSXRay.captureAWS(AWS);

// @ts-ignore
const docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient()
const s3 = new AWS.S3({ signatureVersion: 'v4', });

const TODOS_TABLE = process.env.TODOS_TABLE;
const ATTACHMENT_S3_BUCKET = process.env.ATTACHMENT_S3_BUCKET;
const SIGNED_URL_EXPIRATION = process.env.SIGNED_URL_EXPIRATION;

export const getTodosByUserId = async (userId: string) => {
  const todo = await docClient.query({
    TableName: TODOS_TABLE,
    KeyConditionExpression: '#userId = :userId',
    ExpressionAttributeNames: { '#userId': 'userId', '#_name': 'name' },
    ExpressionAttributeValues: { ':userId': userId },
    ProjectionExpression: 'todoId, userId, createdAt, #_name, dueDate, done, attachmentUrl',
  }).promise();

  return todo.Items;
};

export const addTodoToDB = async (todo: TodoItem) => {
  await docClient.put({ TableName: TODOS_TABLE, Item: todo }).promise();
};

export const updateTodoToDB = async (userId: string, todoId: string, todo: UpdateTodoRequest) => {
  await docClient.update({
    TableName: TODOS_TABLE,
    Key: { todoId, userId, },
    UpdateExpression: 'set #_name = :name, #dueDate = :dueDate, #done = :done',
    ExpressionAttributeNames: {
      '#_name': 'name',
      '#dueDate': 'dueDate',
      '#done': 'done',
    },
    ExpressionAttributeValues: {
      ':name': todo.name,
      ':dueDate': todo.dueDate,
      ':done': todo.done,
    },
  }).promise();
}

export const deleteTodoFromDB = async (userId: string, todoId: string) => {
  await docClient.delete({
    TableName: TODOS_TABLE,
    Key: { userId, todoId, },
  }).promise();
};

export const generateUploadURLToS3 = async (userId: string, todoId: string): Promise<string> => {
  const presignUrl = s3.getSignedUrl('putObject', {
    Bucket: ATTACHMENT_S3_BUCKET,
    Key: `${todoId}.jpg`,
    Expires: parseInt(SIGNED_URL_EXPIRATION),
  });


  await docClient.update({
    TableName: TODOS_TABLE,
    Key: { userId, todoId, },
    UpdateExpression: 'set attachmentUrl = :attachmentUrl',
    ExpressionAttributeValues: {
      ':attachmentUrl': `https://${ATTACHMENT_S3_BUCKET}.s3.amazonaws.com/${todoId}.jpg`,
    },
  }).promise();

  return presignUrl;
};
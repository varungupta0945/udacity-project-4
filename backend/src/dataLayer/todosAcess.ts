import * as AWS from 'aws-sdk'

import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';



const AWSXRay = require('aws-xray-sdk')
const XAWS = AWSXRay.captureAWS(AWS)
const logger = createLogger('TodosAccess')
const s3Bucket = process.env.ATTACHMENT_S3_BUCKET

export class ToDoAccess {

    constructor(
        private readonly docClient: DocumentClient = createDynamoDBClient(),
        private readonly todosTable = process.env.TODOS_TABLE) {
    }



    async createToDo(toDo: TodoItem): Promise<TodoItem> {
        logger.info("Creating new todo")

        await this.docClient.put({
            TableName: this.todosTable,
            Item: toDo
        }).promise()

        return toDo
    }

    async deleteToDo(todoId: string, userId: string): Promise<void> {
        logger.info("Deleting  todo having Id" + todoId + "by user id" + userId)

        await this.docClient.delete({
            TableName: this.todosTable,
            Key: {
                userId: userId,
                todoId: todoId
            }
        }).promise()

    }

    async putAttachment(userId: string, todoId: string): Promise<void> {
        logger.info("saving  todo attachment Url having Id" + todoId + "by user id" + userId)
        await this.docClient.update({
            TableName: this.todosTable,
            Key: {
                userId: userId,
                todoId: todoId
            },
            UpdateExpression: "set attachmentUrl = :attachmentUrl",
            ExpressionAttributeValues: {
                ":attachmentUrl": `https://${s3Bucket}.s3.amazonaws.com/${todoId}`
            }
        }).promise()
    }

    async getTodosForUser(userId: string): Promise<TodoItem[]> {
        logger.info("Getting all todos for user id" + userId)

        const result = await this.docClient.query({
            TableName: this.todosTable,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            },
            ScanIndexForward: false
        }).promise()

        return result.Items as TodoItem[]
    }
    async updateTodo(userId: string, todoId: string, updatedTodo: TodoUpdate) {
        logger.info("Updating toDos with id" + todoId + "for user id" + userId)

        await this.docClient.update({
            TableName: this.todosTable,
            Key: {
                userId: userId,
                todoId: todoId
            },
            UpdateExpression: "set #name = :n, #dueDate = :due, #done = :don",
            ExpressionAttributeNames: {
                "#name": "name",
                "#dueDate": "dueDate",
                "#done": "done",
            },
            ExpressionAttributeValues: {
                ":n": updatedTodo.name,
                ":due": updatedTodo.dueDate,
                ":don": updatedTodo.done
            },
        }).promise()
    }

}

function createDynamoDBClient() {
    if (process.env.IS_OFFLINE) {
        logger.log({ level: "Info", message: "Creating a local DynamoDB instance" })

        return new XAWS.DynamoDB.DocumentClient({
            region: 'localhost',
            endpoint: 'http://localhost:8000'
        })
    }

    return new XAWS.DynamoDB.DocumentClient()
}
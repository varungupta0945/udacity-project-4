import { ToDoAccess } from '../dataLayer/todosAcess'
import { AttachmentUtils } from '../helpers/attachmentUtils';
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
//import * as createError from 'http-errors'
//import { getUserId } from '../lambda/utils';
//import * as AWS from 'aws-sdk';



//Implement businessLogic
const toDoAccess = new ToDoAccess()
const attachmentUtils = new AttachmentUtils()
const logger = createLogger('TodosAccess')

export async function createTodo(newTodo: CreateTodoRequest, userId: string): Promise<TodoItem> {
    logger.info("creating new todo", { toDo: newTodo, userId: userId })
    const todoId = uuid.v4()

    const newToDo = {
        todoId: todoId,
        userId: userId,
        ...newTodo
    }
    return await toDoAccess.createToDo(newToDo);
}
export async function deleteTodo(todoId: string, userId: string): Promise<void> {
    logger.info("delete todo", { ToDoId: todoId, UserId: userId })

    return await toDoAccess.deleteToDo(todoId, userId);
}

export async function createAttachmentPresignedUrl(todoId: string, userId: string): Promise<string> {
    logger.info("create attachment  presigned url for to do", { ToDoId: todoId, UserId: userId })

    const uploadUrl = attachmentUtils.getSignedURL(todoId)
    logger.info("Upload Url" + uploadUrl)
    await toDoAccess.putAttachment(userId, todoId)
    return uploadUrl;

}
export async function getTodosForUser(userId: string): Promise<TodoItem[]> {
    logger.info("Getting all todos for user id", { UserId: userId })

    return await toDoAccess.getTodosForUser(userId);
}
export async function updateTodo(userId: string, todoId: string, updatedTodo: UpdateTodoRequest) {
    logger.info("Updating toDos for user id", { UserId: userId, ToDoId: todoId, UpdateToDoRequest: updatedTodo })

    return await toDoAccess.updateTodo(userId, todoId, updatedTodo);
}

import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'

import { deleteTodo } from '../../businessLogic/todos'
import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'

const logger = createLogger('createTodo');

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    const userId = getUserId(event);
    try {
      await deleteTodo(userId, todoId);
      return { statusCode: 200, body: '', };
    }
    catch (e) {
      logger.error('Error delete todo', e);
      return { statusCode: 500, body: 'Internal Server Error' };
    }
  }
)

handler
  .use(httpErrorHandler())
  .use(cors({ credentials: true })
  )

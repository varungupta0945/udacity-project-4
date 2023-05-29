import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { getUserId } from '../utils';
import { createTodo } from '../../businessLogic/todos'
import { createLogger } from "../../utils/logger";

const logger = createLogger('createTodo');

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const newTodo: CreateTodoRequest = JSON.parse(event.body)
    const userId = getUserId(event);

    try {
      const todo = await createTodo(newTodo, userId);
      logger.info('New-todo', todo);

      return {
        statusCode: 201, body: JSON.stringify({ item: todo, }),
      };
    }
    catch (e) {
      logger.error('Error create todo', e);
      return { statusCode: 500, body: 'Internal Server Error', };
    }
  }
)

handler.use(cors({ credentials: true }));

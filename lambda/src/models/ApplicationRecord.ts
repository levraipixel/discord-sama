import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, DeleteCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

export const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export interface ApplicationRecord {
  id: string;
  createdAt: string;
  updatedAt: string | null;
}

export class ApplicationRecords {
  protected static TABLE: string | undefined;

  static async create(
    this: typeof ApplicationRecords,
    attributes: Omit<ApplicationRecord, 'id' | 'createdAt' | 'updatedAt'>
  ) {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    await client.send(new PutCommand({
      TableName: this.TABLE,
      Item: {
        id,
        createdAt,
        ...attributes,
      },
    }));
    return id;
  }

  static async delete(
    this: typeof ApplicationRecords,
    id: string
  ) {
    await client.send(new DeleteCommand({ TableName: this.TABLE, Key: { id } }));
  }
}

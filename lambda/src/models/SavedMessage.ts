import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.REMINDERS_TABLE_NAME;

export interface SavedMessageRecord {
  id: string;
  userId: string;
  messageId: string;
  channelId: string;
  guildId: string | null;
  remindAt: null;
}

export class SavedMessage {
  static async create({ userId, messageId, channelId, guildId }: Omit<SavedMessageRecord, 'id' | 'remindAt'>) {
    const id = crypto.randomUUID();
    await client.send(new PutCommand({
      TableName: TABLE,
      Item: { id, userId, messageId, channelId, guildId: guildId ?? null, remindAt: null },
    }));
    return id;
  }

  static async getAllForUser(userId: string): Promise<SavedMessageRecord[]> {
    const result = await client.send(new ScanCommand({ TableName: TABLE }));
    return (result.Items ?? []).filter((r) => r.userId === userId && !r.remindAt) as SavedMessageRecord[];
  }

  static async delete(id: string) {
    await client.send(new DeleteCommand({ TableName: TABLE, Key: { id } }));
  }
}

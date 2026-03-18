import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.REMINDERS_TABLE_NAME;

export interface ReminderRecord {
  id: string;
  userId: string;
  messageId: string;
  channelId: string;
  guildId: string | null;
  remindAt: string;
}

export class Reminder {
  static async create({ userId, messageId, channelId, guildId, remindAt }: Omit<ReminderRecord, 'id' | 'remindAt'> & { remindAt: Date }) {
    const id = crypto.randomUUID();
    await client.send(new PutCommand({
      TableName: TABLE,
      Item: {
        id,
        userId,
        messageId,
        channelId,
        guildId: guildId ?? null,
        remindAt: remindAt.toISOString()
      },
    }));
    return id;
  }

  static async getDue(now: Date): Promise<ReminderRecord[]> {
    const result = await client.send(new ScanCommand({ TableName: TABLE }));
    return (result.Items ?? []).filter((r) => r.remindAt && r.remindAt <= now.toISOString()) as ReminderRecord[];
  }

  static async getAllForUser(userId: string): Promise<ReminderRecord[]> {
    const result = await client.send(new ScanCommand({ TableName: TABLE }));
    return (result.Items ?? []).filter((r) => r.userId === userId && r.remindAt) as ReminderRecord[];
  }

  static async delete(id: string) {
    await client.send(new DeleteCommand({ TableName: TABLE, Key: { id } }));
  }
}

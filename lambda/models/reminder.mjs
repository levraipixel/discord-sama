import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.REMINDERS_TABLE_NAME;

export class Reminder {
  static async create({ userId, messageId, channelId, guildId, remindAt }) {
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

  static async getDue(now) {
    const result = await client.send(new ScanCommand({ TableName: TABLE }));
    return result.Items.filter((r) => r.remindAt && r.remindAt <= now.toISOString());
  }

  static async getAllForUser(userId) {
    const result = await client.send(new ScanCommand({ TableName: TABLE }));
    return result.Items.filter((r) => r.userId === userId && r.remindAt);
  }

  static async delete(id) {
    await client.send(new DeleteCommand({ TableName: TABLE, Key: { id } }));
  }
}

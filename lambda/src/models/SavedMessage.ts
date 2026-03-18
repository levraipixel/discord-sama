import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { ApplicationRecord, ApplicationRecords, client } from './ApplicationRecord';

export interface SavedMessage extends ApplicationRecord {
  userId: string;
  messageId: string;
  channelId: string;
  guildId: string | null;
}

export class SavedMessages extends ApplicationRecords {
  protected static TABLE = process.env.SAVED_MESSAGES_TABLE_NAME;

  static async create({ userId, messageId, channelId, guildId }: Omit<SavedMessage, 'id' | 'createdAt' | 'updatedAt'>) {
    return super.create({ userId, messageId, channelId, guildId: guildId ?? null });
  }

  static async getAllForUser(userId: string): Promise<SavedMessage[]> {
    const result = await client.send(new ScanCommand({ TableName: this.TABLE }));
    return (result.Items ?? []).filter((r) => r.userId === userId) as SavedMessage[];
  }
}

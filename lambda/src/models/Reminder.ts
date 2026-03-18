import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { ApplicationRecord, ApplicationRecords, client } from './ApplicationRecord';

export interface Reminder extends ApplicationRecord {
  userId: string;
  messageId: string;
  channelId: string;
  guildId: string | null;
  remindAt: Date;
}

export class Reminders extends ApplicationRecords {
  protected static TABLE = process.env.REMINDERS_TABLE_NAME;

  static async create({ userId, messageId, channelId, guildId, remindAt }: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>) {
    return super.create({ userId, messageId, channelId, guildId: guildId ?? null, remindAt: remindAt.toISOString() });
  }

  static async getDue(now: Date): Promise<Reminder[]> {
    const result = await client.send(new ScanCommand({ TableName: this.TABLE }));
    return (result.Items ?? [])
      .filter((r) => r.remindAt && new Date(r.remindAt) <= now)
      .map((r) => ({ ...r, remindAt: new Date(r.remindAt) })) as Reminder[];
  }

  static async getAllForUser(userId: string): Promise<Reminder[]> {
    const result = await client.send(new ScanCommand({ TableName: this.TABLE }));
    return (result.Items ?? [])
      .filter((r) => r.userId === userId && r.remindAt)
      .map((r) => ({ ...r, remindAt: new Date(r.remindAt) })) as Reminder[];
  }
}

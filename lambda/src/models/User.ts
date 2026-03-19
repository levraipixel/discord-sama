import { GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { ApplicationRecord, ApplicationRecords, client } from './ApplicationRecord';
import { findDirectMessageChannelId } from '../helpers/discord';

export type Language = 'en' | 'fr';

export interface User extends ApplicationRecord {
  discordUserId: string;
  dmChannelId: string;
  language: Language;
  timezone: string;
  dailyReminderHour: number;
  dailyReminderMinutes: number;
}

const USER_DEFAULTS = {
  language: 'en' as Language,
  timezone: 'Europe/Paris',
  dailyReminderHour: 9,
  dailyReminderMinutes: 0,
};

export class Users extends ApplicationRecords {
  protected static TABLE = process.env.USERS_TABLE_NAME;

  static async create({
    discordUserId,
    dmChannelId,
    language = USER_DEFAULTS.language,
    timezone = USER_DEFAULTS.timezone,
    dailyReminderHour = USER_DEFAULTS.dailyReminderHour,
    dailyReminderMinutes = USER_DEFAULTS.dailyReminderMinutes,
  }: Pick<User, 'discordUserId' | 'dmChannelId'> & Partial<Pick<User, 'language' | 'timezone' | 'dailyReminderHour' | 'dailyReminderMinutes'>>) {
    return super.create({ discordUserId, dmChannelId, language, timezone, dailyReminderHour, dailyReminderMinutes });
  }

  static async findById(id: string): Promise<User | null> {
    const result = await client.send(new GetCommand({ TableName: this.TABLE, Key: { id } }));
    return (result.Item as User) ?? null;
  }

  static async findByDiscordUserId(discordUserId: string): Promise<User | null> {
    const result = await client.send(new ScanCommand({ TableName: this.TABLE }));
    const item = (result.Items ?? []).find((u) => u.discordUserId === discordUserId);
    return (item as User) ?? null;
  }

  static async findOrCreateByDiscordUserId(discordUserId: string): Promise<User> {
    const existing = await this.findByDiscordUserId(discordUserId);
    if (existing) return existing;

    const dmChannelId = await findDirectMessageChannelId(discordUserId);
    const id = await this.create({ discordUserId, dmChannelId });
    return {
      id,
      discordUserId,
      dmChannelId,
      ...USER_DEFAULTS,
      createdAt: new Date().toISOString(),
      updatedAt: null,
    };
  }
}

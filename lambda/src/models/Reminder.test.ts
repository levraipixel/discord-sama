import { beforeEach, describe, expect, it, vi } from 'vitest';
import { client } from './ApplicationRecord';
import { Reminders } from './Reminder';

vi.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: vi.fn().mockReturnValue({}),
}));

vi.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: { from: vi.fn().mockReturnValue({ send: vi.fn() }) },
  PutCommand: vi.fn((input) => ({ input })),
  DeleteCommand: vi.fn((input) => ({ input })),
  ScanCommand: vi.fn((input) => ({ input })),
}));

const sendMock = vi.spyOn(client, 'send');

const TABLE = 'reminders-table';

beforeEach(() => {
  sendMock.mockReset();
  (Reminders as any).TABLE = TABLE;
});

describe('Reminders.create', () => {
  it('stores remindAt as an ISO string and returns an id', async () => {
    sendMock.mockResolvedValue({} as any);
    const remindAt = new Date('2026-06-01T10:00:00.000Z');

    const id = await Reminders.create({
      userId: 'u1',
      messageId: 'm1',
      channelId: 'c1',
      guildId: 'g1',
      remindAt,
    });

    expect(typeof id).toBe('string');
    expect(id).toHaveLength(36);

    const [command] = sendMock.mock.calls[0];
    expect((command as any).input).toMatchObject({
      TableName: TABLE,
      Item: {
        userId: 'u1',
        messageId: 'm1',
        channelId: 'c1',
        guildId: 'g1',
        remindAt: '2026-06-01T10:00:00.000Z',
      },
    });
  });

  it('stores null for guildId when not provided', async () => {
    sendMock.mockResolvedValue({} as any);

    await Reminders.create({
      userId: 'u1',
      messageId: 'm1',
      channelId: 'c1',
      guildId: null,
      remindAt: new Date(),
    });

    const [command] = sendMock.mock.calls[0];
    expect((command as any).input.Item.guildId).toBeNull();
  });
});

describe('Reminders.getDue', () => {
  const items = [
    { id: '1', userId: 'u1', messageId: 'm1', channelId: 'c1', guildId: null, remindAt: '2026-01-01T00:00:00.000Z', createdAt: '2025-12-01T00:00:00.000Z', updatedAt: null },
    { id: '2', userId: 'u2', messageId: 'm2', channelId: 'c2', guildId: null, remindAt: '2026-12-01T00:00:00.000Z', createdAt: '2025-12-01T00:00:00.000Z', updatedAt: null },
    { id: '3', userId: 'u1', messageId: 'm3', channelId: 'c3', guildId: 'g1', remindAt: '2026-06-01T00:00:00.000Z', createdAt: '2025-12-01T00:00:00.000Z', updatedAt: null },
  ];

  it('returns only reminders due at or before now', async () => {
    sendMock.mockResolvedValue({ Items: items } as any);
    const now = new Date('2026-07-01T00:00:00.000Z');

    const results = await Reminders.getDue(now);

    expect(results).toHaveLength(2);
    expect(results.map((r) => r.id)).toEqual(['1', '3']);
  });

  it('deserializes remindAt as a Date', async () => {
    sendMock.mockResolvedValue({ Items: [items[0]] } as any);

    const results = await Reminders.getDue(new Date('2026-07-01T00:00:00.000Z'));

    expect(results[0].remindAt).toBeInstanceOf(Date);
    expect(results[0].remindAt.toISOString()).toBe('2026-01-01T00:00:00.000Z');
  });

  it('returns an empty array when nothing is due', async () => {
    sendMock.mockResolvedValue({ Items: items } as any);

    const results = await Reminders.getDue(new Date('2025-01-01T00:00:00.000Z'));

    expect(results).toEqual([]);
  });
});

describe('Reminders.getAllForUser', () => {
  it('returns only reminders for the given user', async () => {
    sendMock.mockResolvedValue({
      Items: [
        { id: '1', userId: 'u1', messageId: 'm1', channelId: 'c1', guildId: null, remindAt: '2026-06-01T00:00:00.000Z', createdAt: '2025-12-01T00:00:00.000Z', updatedAt: null },
        { id: '2', userId: 'u2', messageId: 'm2', channelId: 'c2', guildId: null, remindAt: '2026-06-01T00:00:00.000Z', createdAt: '2025-12-01T00:00:00.000Z', updatedAt: null },
      ],
    } as any);

    const results = await Reminders.getAllForUser('u1');

    expect(results).toHaveLength(1);
    expect(results[0].userId).toBe('u1');
  });

  it('deserializes remindAt as a Date', async () => {
    sendMock.mockResolvedValue({
      Items: [{ id: '1', userId: 'u1', messageId: 'm1', channelId: 'c1', guildId: null, remindAt: '2026-06-01T10:00:00.000Z', createdAt: '2025-12-01T00:00:00.000Z', updatedAt: null }],
    } as any);

    const results = await Reminders.getAllForUser('u1');

    expect(results[0].remindAt).toBeInstanceOf(Date);
    expect(results[0].remindAt.toISOString()).toBe('2026-06-01T10:00:00.000Z');
  });

  it('returns an empty array when no reminders match', async () => {
    sendMock.mockResolvedValue({ Items: [] } as any);

    const results = await Reminders.getAllForUser('u1');

    expect(results).toEqual([]);
  });
});

describe('Reminders.delete', () => {
  it('deletes the reminder by id', async () => {
    sendMock.mockResolvedValue({} as any);

    await Reminders.delete('abc-123');

    const [command] = sendMock.mock.calls[0];
    expect((command as any).input).toMatchObject({
      TableName: TABLE,
      Key: { id: 'abc-123' },
    });
  });
});

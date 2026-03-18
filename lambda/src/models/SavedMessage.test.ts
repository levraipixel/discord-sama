import { beforeEach, describe, expect, it, vi } from 'vitest';
import { client } from './ApplicationRecord';
import { SavedMessages } from './SavedMessage';

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

const TABLE = 'saved-messages-table';

beforeEach(() => {
  sendMock.mockReset();
  (SavedMessages as any).TABLE = TABLE;
});

describe('SavedMessages.create', () => {
  it('puts the item in the table and returns an id', async () => {
    sendMock.mockResolvedValue({} as any);

    const id = await SavedMessages.create({
      userId: 'u1',
      messageId: 'm1',
      channelId: 'c1',
      guildId: 'g1',
    });

    expect(typeof id).toBe('string');
    expect(id).toHaveLength(36); // UUID

    const [command] = sendMock.mock.calls[0];
    expect((command as any).input).toMatchObject({
      TableName: TABLE,
      Item: { userId: 'u1', messageId: 'm1', channelId: 'c1', guildId: 'g1' },
    });
    expect((command as any).input.Item.id).toBe(id);
    expect((command as any).input.Item.createdAt).toBeDefined();
  });

  it('stores null for guildId when not provided', async () => {
    sendMock.mockResolvedValue({} as any);

    await SavedMessages.create({ userId: 'u1', messageId: 'm1', channelId: 'c1', guildId: null });

    const [command] = sendMock.mock.calls[0];
    expect((command as any).input.Item.guildId).toBeNull();
  });
});

describe('SavedMessages.getAllForUser', () => {
  it('returns only records belonging to the given user', async () => {
    sendMock.mockResolvedValue({
      Items: [
        { id: '1', userId: 'u1', messageId: 'm1', channelId: 'c1', guildId: null, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: null },
        { id: '2', userId: 'u2', messageId: 'm2', channelId: 'c2', guildId: null, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: null },
        { id: '3', userId: 'u1', messageId: 'm3', channelId: 'c3', guildId: 'g1', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: null },
      ],
    } as any);

    const results = await SavedMessages.getAllForUser('u1');

    expect(results).toHaveLength(2);
    expect(results.every((r) => r.userId === 'u1')).toBe(true);
  });

  it('returns an empty array when no records match', async () => {
    sendMock.mockResolvedValue({ Items: [] } as any);

    const results = await SavedMessages.getAllForUser('u1');

    expect(results).toEqual([]);
  });

  it('scans the correct table', async () => {
    sendMock.mockResolvedValue({ Items: [] } as any);

    await SavedMessages.getAllForUser('u1');

    const [command] = sendMock.mock.calls[0];
    expect((command as any).input.TableName).toBe(TABLE);
  });
});

describe('SavedMessages.delete', () => {
  it('deletes the record by id', async () => {
    sendMock.mockResolvedValue({} as any);

    await SavedMessages.delete('abc-123');

    const [command] = sendMock.mock.calls[0];
    expect((command as any).input).toMatchObject({
      TableName: TABLE,
      Key: { id: 'abc-123' },
    });
  });
});

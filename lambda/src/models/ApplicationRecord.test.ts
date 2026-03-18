import { beforeEach, describe, expect, it, vi } from 'vitest';
import { client, ApplicationRecords } from './ApplicationRecord';

vi.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: vi.fn().mockReturnValue({}),
}));

vi.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: { from: vi.fn().mockReturnValue({ send: vi.fn() }) },
  PutCommand: vi.fn((input) => ({ input })),
  DeleteCommand: vi.fn((input) => ({ input })),
}));

const sendMock = vi.spyOn(client, 'send');

class TestRecords extends ApplicationRecords {
  static TABLE = 'test-table';
}

beforeEach(() => {
  sendMock.mockReset();
});

describe('ApplicationRecords.create', () => {
  it('puts the item in the table and returns a UUID', async () => {
    sendMock.mockResolvedValue({} as any);

    const id = await TestRecords.create({ extra: 'field' } as any);

    expect(typeof id).toBe('string');
    expect(id).toHaveLength(36);

    const [command] = sendMock.mock.calls[0];
    expect((command as any).input).toMatchObject({
      TableName: 'test-table',
      Item: { id, extra: 'field' },
    });
  });

  it('sets createdAt to an ISO timestamp', async () => {
    sendMock.mockResolvedValue({} as any);
    const before = new Date().toISOString();

    await TestRecords.create({});

    const after = new Date().toISOString();
    const { createdAt } = (sendMock.mock.calls[0][0] as any).input.Item;
    expect(createdAt >= before).toBe(true);
    expect(createdAt <= after).toBe(true);
  });

  it('spreads extra attributes into the item', async () => {
    sendMock.mockResolvedValue({} as any);

    await TestRecords.create({ userId: 'u1', channelId: 'c1' } as any);

    const { Item } = (sendMock.mock.calls[0][0] as any).input;
    expect(Item.userId).toBe('u1');
    expect(Item.channelId).toBe('c1');
  });
});

describe('ApplicationRecords.delete', () => {
  it('sends a DeleteCommand with the correct table and key', async () => {
    sendMock.mockResolvedValue({} as any);

    await TestRecords.delete('abc-123');

    const [command] = sendMock.mock.calls[0];
    expect((command as any).input).toMatchObject({
      TableName: 'test-table',
      Key: { id: 'abc-123' },
    });
  });
});

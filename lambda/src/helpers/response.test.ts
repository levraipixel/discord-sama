import { describe, expect, it } from 'vitest';
import { InteractionResponseType } from 'discord-interactions';
import { deferEphemeral, respond, respondEphemeral, respondEphemeralWithComponents, respondModal, respondUpdateMessage } from './response';

describe('respond', () => {
  it('returns a 200 with CHANNEL_MESSAGE_WITH_SOURCE type', () => {
    const result = respond('Hello!');
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(body.type).toBe(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE);
    expect(body.data.content).toBe('Hello!');
    expect(body.data.flags).toBeUndefined();
  });
});

describe('respondEphemeral', () => {
  it('returns a 200 with flags: 64', () => {
    const result = respondEphemeral('Only you can see this');
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(body.type).toBe(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE);
    expect(body.data.content).toBe('Only you can see this');
    expect(body.data.flags).toBe(64);
  });
});

describe('deferEphemeral', () => {
  it('returns a 200 with DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE type and flags 64', () => {
    const result = deferEphemeral();
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(body.type).toBe(InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE);
    expect(body.data.flags).toBe(64);
  });
});

describe('respondEphemeralWithComponents', () => {
  it('returns a 200 ephemeral message with components', () => {
    const components = [{ type: 1, components: [] }];
    const result = respondEphemeralWithComponents('Pick one:', components);
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(body.type).toBe(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE);
    expect(body.data.content).toBe('Pick one:');
    expect(body.data.flags).toBe(64);
    expect(body.data.components).toEqual(components);
  });
});

describe('respondUpdateMessage', () => {
  it('returns a 200 with type 7 and components', () => {
    const components = [{ type: 1, components: [] }];
    const result = respondUpdateMessage('Updated!', components);
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(body.type).toBe(7);
    expect(body.data.content).toBe('Updated!');
    expect(body.data.flags).toBe(64);
    expect(body.data.components).toEqual(components);
  });
});

describe('respondModal', () => {
  it('returns a 200 with MODAL type and the correct shape', () => {
    const components = [{ type: 1, components: [] }];
    const result = respondModal('my_modal', 'My Title', components);
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(body.type).toBe(InteractionResponseType.MODAL);
    expect(body.data.custom_id).toBe('my_modal');
    expect(body.data.title).toBe('My Title');
    expect(body.data.components).toEqual(components);
  });
});

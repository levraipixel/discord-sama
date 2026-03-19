import { InteractionResponseType } from 'discord-interactions';

export const respond = (content: string) => ({
  statusCode: 200,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content },
  }),
});

export const respondEphemeral = (content: string) => ({
  statusCode: 200,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content, flags: 64 },
  }),
});

export const respondEphemeralWithComponents = (content: string, components: unknown[]) => ({
  statusCode: 200,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content, flags: 64, components },
  }),
});

export const respondUpdateMessage = (content: string, components: unknown[]) => ({
  statusCode: 200,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 7, // UPDATE_MESSAGE
    data: { content, flags: 64, components },
  }),
});

export const respondModal = (customId: string, title: string, components: unknown[]) => ({
  statusCode: 200,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: InteractionResponseType.MODAL,
    data: {
      custom_id: customId,
      title,
      components,
    },
  }),
});

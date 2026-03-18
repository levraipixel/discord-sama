import { InteractionResponseType } from 'discord-interactions';

export const respond = (content) => ({
  statusCode: 200,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content },
  }),
});

export const respondEphemeral = (content) => ({
  statusCode: 200,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content, flags: 64 },
  }),
});

export const respondModal = (customId, title, components) => ({
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

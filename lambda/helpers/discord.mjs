export const messageLink = ({ guildId, channelId, messageId }) =>
  `https://discord.com/channels/${guildId ?? '@me'}/${channelId}/${messageId}`;

export const dateTag = (date) => {
  const ts = Math.floor(date.getTime() / 1000);
  return `<t:${ts}:R>`;
};

// TODO: memoize this
export const findDirectMessageChannelId = async (userId) => {
  const dmRes = await fetch(`https://discord.com/api/v10/users/@me/channels`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}`,
    },
    body: JSON.stringify({ recipient_id: userId }),
  });
  if (!dmRes.ok) throw new Error(`Failed to open DM: ${dmRes.status} ${await dmRes.text()}`);

  const { id: dmChannelId } = await dmRes.json();
  return dmChannelId;
};

export const sendMessage = async (channelId, content) => {
  const msgRes = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}`,
    },
    body: JSON.stringify({ content }),
  });
  if (!msgRes.ok) throw new Error(`Failed to send DM: ${msgRes.status} ${await msgRes.text()}`);
};

export const sendDirectMessage = async (userId, content) => {
  const dmChannelId = await findDirectMessageChannelId(userId);
  await sendMessage(dmChannelId, content);
};

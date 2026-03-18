import * as chrono from 'chrono-node';
import { verifyKey, InteractionType, InteractionResponseType } from 'discord-interactions';
import { saveReminder, getAllReminders, getDueReminders, deleteReminder } from './models/reminder.mjs';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const TIMEZONE = 'Europe/Paris'; // Used for parsing user input and scheduling reminders at "9am tomorrow" etc.

const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION });
// Eagerly resolve IAM credentials during cold start so the first handler
// invocation doesn't pay the IMDS latency cost inside the 3s Discord window.
lambdaClient.config.credentials().catch(() => {});

// Returns the UTC offset in minutes for an IANA timezone at a given date (positive = east of UTC).
// Uses Intl to reconstruct the local wall-clock time and diff against UTC — handles DST correctly.
const getTimezoneOffsetMinutes = (timezone, date) => {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));
  const tzLocal = new Date(Date.UTC(
    parseInt(parts.year), parseInt(parts.month) - 1, parseInt(parts.day),
    parseInt(parts.hour) % 24, parseInt(parts.minute), parseInt(parts.second),
  ));
  return (tzLocal - date) / 60000;
};

const respond = (content) => ({
  statusCode: 200,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content },
  }),
});

const respondEphemeral = (content) => ({
  statusCode: 200,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content, flags: 64 },
  }),
});

export const handler = async (event) => {
  console.log('Received event:', JSON.stringify(event));

  // Scheduled task: check for due reminders and send DMs
  if (event.asyncTask === 'checkReminders') {
    console.log('Running async task: checkReminders');
    const now = new Date();
    const due = await getDueReminders(now);
    console.log(`checkReminders: ${due.length} due reminder(s)`);
    await Promise.all(due.map(async (reminder) => {
      try {
        const guildPart = reminder.guildId ?? '@me';
        const link = `https://discord.com/channels/${guildPart}/${reminder.channelId}/${reminder.messageId}`;
        const dmRes = await fetch(`https://discord.com/api/v10/users/@me/channels`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}`,
          },
          body: JSON.stringify({ recipient_id: reminder.userId }),
        });
        if (!dmRes.ok) throw new Error(`Failed to open DM: ${dmRes.status} ${await dmRes.text()}`);
        const { id: dmChannelId } = await dmRes.json();

        const msgRes = await fetch(`https://discord.com/api/v10/channels/${dmChannelId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}`,
          },
          body: JSON.stringify({ content: `You asked me to remind you of ${link}` }),
        });
        if (!msgRes.ok) throw new Error(`Failed to send DM: ${msgRes.status} ${await msgRes.text()}`);

        await deleteReminder(reminder.id);
        console.log(`checkReminders: sent reminder ${reminder.id} to user ${reminder.userId}`);
      } catch (err) {
        console.error(`checkReminders: failed for reminder ${reminder.id}:`, err);
      }
    }));
    return { statusCode: 200 };
  }

  const signature = event.headers['x-signature-ed25519'];
  const timestamp = event.headers['x-signature-timestamp'];
  const rawBody = event.body ?? '';

  // Verify the request is genuinely from Discord (skipped in local dev mode)
  if (process.env.LOCAL_MODE !== 'true') {
    const isValid = verifyKey(rawBody, signature, timestamp, process.env.DISCORD_PUBLIC_KEY);
    if (!isValid) {
      return { statusCode: 401, body: 'Invalid request signature' };
    }
  }

  const interaction = JSON.parse(rawBody);

  // Discord endpoint validation (PING)
  if (interaction.type === InteractionType.PING) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: InteractionResponseType.PONG }),
    };
  }

  // Message context menu command handling (type 3 = MESSAGE)
  if (interaction.type === InteractionType.APPLICATION_COMMAND && interaction.data.type === 3) {
    const { name, target_id: messageId } = interaction.data;

    if (name === 'Remind me in 1 hour') {
      const remindAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      await saveReminder({
        userId: interaction.member?.user?.id ?? interaction.user?.id,
        messageId,
        channelId: interaction.channel_id,
        guildId: interaction.guild_id ?? null,
        remindAt,
      });
      return respondEphemeral('Got it! I\'ll remind you about this message in 1 hour. ⏰');
    }

    if (name === 'Remind me tomorrow') {
      const naive = new Date();
      naive.setUTCDate(naive.getUTCDate() + 1);
      naive.setUTCHours(9, 0, 0, 0);
      const tomorrow = new Date(naive.getTime() - getTimezoneOffsetMinutes(TIMEZONE, naive) * 60000);
      const remindAt = tomorrow.toISOString();
      await saveReminder({
        userId: interaction.member?.user?.id ?? interaction.user?.id,
        messageId,
        channelId: interaction.channel_id,
        guildId: interaction.guild_id ?? null,
        remindAt,
      });
      const ts = Math.floor(tomorrow.getTime() / 1000);
      return respondEphemeral(`Got it! I'll remind you about this message <t:${ts}:R>. ⏰`);
    }

    if (name === 'Save for later') {
      await saveReminder({
        userId: interaction.member?.user?.id ?? interaction.user?.id,
        messageId,
        channelId: interaction.channel_id,
        guildId: interaction.guild_id ?? null,
        remindAt: null,
      });
      return respondEphemeral('Saved! Use `/saved list` to see your saved messages.');
    }

    if (name === 'Remind me on specific date') {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 9, // MODAL
          data: {
            custom_id: `remind_date:${interaction.channel_id}:${messageId}`,
            title: 'Schedule a reminder',
            components: [{
              type: 1, // ACTION_ROW
              components: [{
                type: 4, // TEXT_INPUT
                custom_id: 'date',
                label: 'When?',
                style: 1, // SHORT
                placeholder: 'e.g. "in 2 weeks", "June 6 at 10pm", "2026-04-15"',
                required: true,
              }],
            }],
          },
        }),
      };
    }
  }

  // Modal submission handling
  if (interaction.type === 5) { // MODAL_SUBMIT
    const { custom_id, components } = interaction.data;

    if (custom_id.startsWith('remind_date:')) {
      const userId = interaction.member?.user?.id ?? interaction.user?.id;
      const allowedIds = (process.env.ALLOWED_DISCORD_USER_IDS ?? '').split(',').map((id) => id.trim()).filter(Boolean);
      if (allowedIds.length > 0 && !allowedIds.includes(userId)) {
        return respondEphemeral('You are not authorized to use this command.');
      }

      const [, channelId, messageId] = custom_id.split(':');
      const dateValue = components[0].components[0].value.trim();

      const now = new Date();
      const parsed = chrono.parse(dateValue, now, { forwardDate: true })[0];
      if (!parsed) {
        return respondEphemeral(`I couldn't understand "${dateValue}". Try something like "in 2 weeks", "June 6 at 10pm", or "2026-04-15".`);
      }

      const naiveDate = parsed.date();
      if (!parsed.start.isCertain('hour')) {
        naiveDate.setUTCHours(9, 0, 0, 0);
      }
      // chrono parses times in the system timezone (UTC on Lambda), so shift to the user's timezone.
      const remindAt = new Date(naiveDate.getTime() - getTimezoneOffsetMinutes(TIMEZONE, naiveDate) * 60000);

      if (remindAt <= now) {
        return respondEphemeral('Please provide a future date.');
      }

      await saveReminder({
        userId,
        messageId,
        channelId,
        guildId: interaction.guild_id ?? null,
        remindAt: remindAt.toISOString(),
      });

      const ts = Math.floor(remindAt.getTime() / 1000);
      return respondEphemeral(`Got it! I'll remind you about this message <t:${ts}:R>. ⏰`);
    }
  }

  // Slash command handling
  if (interaction.type === InteractionType.APPLICATION_COMMAND) {
    const { name, options } = interaction.data;
    const args = options?.map((o) => `${o.name}=${o.value}`).join(', ') ?? '';
    console.log(`Command: /${name}${args ? ` (${args})` : ''}`);

    if (name === 'saved') {
      const action = options?.find((o) => o.name === 'action')?.value;
      const userId = interaction.member?.user?.id ?? interaction.user?.id;
      const all = await getAllReminders();
      const mine = all.filter((r) => r.userId === userId && !r.remindAt);

      if (action === 'list') {
        if (mine.length === 0) return respondEphemeral('You have no saved messages.');
        const lines = mine.map((r) => {
          const guildPart = r.guildId ?? '@me';
          return `- https://discord.com/channels/${guildPart}/${r.channelId}/${r.messageId}`;
        });
        return respondEphemeral(`Your saved messages:\n${lines.join('\n')}`);
      }

      if (action === 'clear') {
        if (mine.length === 0) return respondEphemeral('You have no saved messages to clear.');
        await Promise.all(mine.map((r) => deleteReminder(r.id)));
        return respondEphemeral(`Cleared ${mine.length} saved message(s).`);
      }
    }

    if (name === 'remind') {
      const action = options?.find((o) => o.name === 'action')?.value;
      const userId = interaction.member?.user?.id ?? interaction.user?.id;
      const all = await getAllReminders();
      const mine = all.filter((r) => r.userId === userId && r.remindAt);

      if (action === 'list') {
        if (mine.length === 0) return respondEphemeral('You have no scheduled reminders.');
        const lines = mine.map((r) => {
          const guildPart = r.guildId ?? '@me';
          const link = `https://discord.com/channels/${guildPart}/${r.channelId}/${r.messageId}`;
          const ts = Math.floor(new Date(r.remindAt).getTime() / 1000);
          return `- ${link} — <t:${ts}:R>`;
        });
        return respondEphemeral(`Your reminders:\n${lines.join('\n')}`);
      }

      if (action === 'clear') {
        if (mine.length === 0) return respondEphemeral('You have no reminders to clear.');
        await Promise.all(mine.map((r) => deleteReminder(r.id)));
        return respondEphemeral(`Cleared ${mine.length} reminder(s).`);
      }
    }

    if (name === 'hello') {
      return respond('Hello! I am Discord Sama, your serverless Discord bot powered by AWS Lambda! 🚀');
    }
  }

  return { statusCode: 400, body: 'Unknown interaction type' };
};

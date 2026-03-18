import { Reminder } from '../models/Reminder.mjs';
import { SavedMessage } from '../models/SavedMessage.mjs';
import { respondEphemeral, respondModal } from '../helpers/response.mjs';
import { dateTag } from '../helpers/discord.mjs';
import { getTimezoneOffsetMinutes } from '../helpers/timezone.mjs';

const TIMEZONE = 'Europe/Paris';

export const handleContextMenuCommand = async (interaction) => {
  const { name, target_id: messageId } = interaction.data;
  const userId = interaction.member?.user?.id ?? interaction.user?.id;
  const channelId = interaction.channel_id;
  const guildId = interaction.guild_id ?? null;

  if (name === 'Remind me in 1 hour') {
    const remindAt = new Date(Date.now() + 60 * 60 * 1000);
    await Reminder.create({ userId, messageId, channelId, guildId, remindAt });
    return respondEphemeral(`Got it! I\'ll remind you about this message ${dateTag(remindAt)}. ⏰`);
  }

  if (name === 'Remind me tomorrow') {
    const naive = new Date();
    naive.setUTCDate(naive.getUTCDate() + 1);
    naive.setUTCHours(9, 0, 0, 0);
    const tomorrow = new Date(naive.getTime() - getTimezoneOffsetMinutes(TIMEZONE, naive) * 60000);
    await Reminder.create({ userId, messageId, channelId, guildId, remindAt: tomorrow });
    return respondEphemeral(`Got it! I'll remind you about this message ${dateTag(tomorrow)}. ⏰`);
  }

  if (name === 'Remind me on specific date') {
    return respondModal(
      `remind_date:${channelId}:${messageId}`,
      'Schedule a reminder',
      [{
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
    );
  }

  if (name === 'Save for later') {
    await SavedMessage.create({ userId, messageId, channelId, guildId });
    return respondEphemeral('Saved! Use `/saved list` to see your saved messages.');
  }
};

import * as chrono from 'chrono-node';
import { Reminder } from '../models/Reminder.mjs';
import { dateTag } from '../helpers/discord.mjs';
import { respondEphemeral } from '../helpers/response.mjs';
import { getTimezoneOffsetMinutes } from '../helpers/timezone.mjs';

const TIMEZONE = 'Europe/Paris';

export const handleModalSubmission = async (interaction) => {
  const { custom_id, components } = interaction.data;

  if (custom_id.startsWith('remind_date:')) {
    const userId = interaction.member?.user?.id ?? interaction.user?.id;

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

    await Reminder.create({ userId, messageId, channelId, guildId: interaction.guild_id ?? null, remindAt });

    const ts = Math.floor(remindAt.getTime() / 1000);
    return respondEphemeral(`Got it! I'll remind you about this message ${dateTag(remindAt)}. ⏰`);
  }
};

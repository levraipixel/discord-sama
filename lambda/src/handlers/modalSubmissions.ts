import * as chrono from 'chrono-node';
import { Reminders } from '../models/Reminder';
import { Users } from '../models/User';
import { dateTag } from '../helpers/discord';
import { respondEphemeral } from '../helpers/response';
import { getTimezoneOffsetMinutes } from '../helpers/timezone';
import { t } from '../helpers/i18n';

export const handleModalSubmission = async (interaction: any) => {
  const { custom_id, components } = interaction.data;

  if (custom_id.startsWith('remind_date:')) {
    const discordUserId = interaction.member?.user?.id ?? interaction.user?.id;
    const user = await Users.findOrCreateByDiscordUserId(discordUserId);
    const userId = user.id;

    const [, channelId, messageId] = custom_id.split(':');
    const dateValue = components[0].component.value.trim();

    const now = new Date();
    const lang = interaction.locale?.slice(0, 2);
    const parser = lang === 'fr' ? chrono.fr : chrono;
    const parsed = parser.parse(dateValue, now, { forwardDate: true })[0];
    if (!parsed) {
      return respondEphemeral(t(interaction.locale).remindDateSubmit.parseError.replace('{input}', dateValue));
    }

    const naiveDate = parsed.date();
    if (!parsed.start.isCertain('hour')) {
      naiveDate.setUTCHours(user.dailyReminderHour, user.dailyReminderMinutes, 0, 0);
    }
    // chrono parses times in the system timezone (UTC on Lambda), so shift to the user's timezone.
    const remindAt = new Date(naiveDate.getTime() - getTimezoneOffsetMinutes(user.timezone, naiveDate) * 60000);

    if (remindAt <= now) {
      return respondEphemeral(t(interaction.locale).remindDateSubmit.pastDateError);
    }

    await Reminders.create({ userId, messageId, channelId, guildId: interaction.guild_id ?? null, remindAt });

    return respondEphemeral(t(interaction.locale).remindDateSubmit.success.replace('{date}', dateTag(remindAt)));
  }
};

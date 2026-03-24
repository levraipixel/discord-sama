import { Reminders } from '../models/Reminder';
import { SavedMessages } from '../models/SavedMessage';
import { Users } from '../models/User';
import { MessageComponentTypes, TextStyleTypes } from 'discord-interactions';
import { respondEphemeral, respondModal } from '../helpers/response';
import { t } from '../helpers/i18n';

const LABEL = 18; // MessageComponentTypes.LABEL — not yet in discord-interactions package
import { dateTag } from '../helpers/discord';
import { getTimezoneOffsetMinutes } from '../helpers/timezone';

export const handleContextMenuCommand = async (interaction: any) => {
  const { id: commandId, target_id: messageId } = interaction.data;
  const discordUserId = interaction.member?.user?.id ?? interaction.user?.id;
  const user = await Users.findOrCreateByDiscordUserId(discordUserId);
  const userId = user.id;
  const channelId = interaction.channel_id;
  const guildId = interaction.guild_id ?? null;

  if (commandId === process.env.COMMAND_ID_REMIND_1H) {
    const remindAt = new Date(Date.now() + 60 * 60 * 1000);
    await Reminders.create({ userId, messageId, channelId, guildId, remindAt });
    return respondEphemeral(t(interaction.locale).remind1h.success.replace('{date}', dateTag(remindAt)));
  }

  if (commandId === process.env.COMMAND_ID_REMIND_TOMORROW) {
    const naive = new Date();
    naive.setUTCDate(naive.getUTCDate() + 1);
    naive.setUTCHours(user.dailyReminderHour, user.dailyReminderMinutes, 0, 0);
    const tomorrow = new Date(naive.getTime() - getTimezoneOffsetMinutes(user.timezone, naive) * 60000);
    await Reminders.create({ userId, messageId, channelId, guildId, remindAt: tomorrow });
    return respondEphemeral(t(interaction.locale).remindTomorrow.success.replace('{date}', dateTag(tomorrow)));
  }

  if (commandId === process.env.COMMAND_ID_REMIND_DATE) {
    return respondModal(
      `remind_date:${channelId}:${messageId}`,
      t(interaction.locale).remindDateModal.title,
      [{
        type: LABEL,
        label: t(interaction.locale).remindDateModal.label,
        component: {
          type: MessageComponentTypes.INPUT_TEXT,
          custom_id: 'date',
          style: TextStyleTypes.SHORT,
          placeholder: t(interaction.locale).remindDateModal.placeholder,
          required: true,
        },
      }],
    );
  }

  if (commandId === process.env.COMMAND_ID_SAVE_LATER) {
    await SavedMessages.create({ userId, messageId, channelId, guildId });
    return respondEphemeral(t(interaction.locale).saveLater.success);
  }
};

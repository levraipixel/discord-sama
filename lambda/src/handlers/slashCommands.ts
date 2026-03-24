import { Reminders } from '../models/Reminder';
import { SavedMessages } from '../models/SavedMessage';
import { Users } from '../models/User';
import { dateTag } from '../helpers/discord';
import { respondEphemeral } from '../helpers/response';
import { messageLink } from '../helpers/discord';
import { t } from '../helpers/i18n';

export const handleSlashCommand = async (interaction: any) => {
  const { name, options } = interaction.data;
  const args = options?.map((o: any) => `${o.name}=${o.value}`).join(', ') ?? '';
  console.log(`Command: /${name}${args ? ` (${args})` : ''}`);

  if (name === 'saved') {
    const action = options?.find((o: any) => o.name === 'action')?.value;
    const discordUserId = interaction.member?.user?.id ?? interaction.user?.id;
    const user = await Users.findOrCreateByDiscordUserId(discordUserId);
    const mine = await SavedMessages.getAllForUser(user.id);

    if (action === 'list') {
      if (mine.length === 0) return respondEphemeral(t(interaction.locale).saved.list.empty);
      const list = mine.map((r) => `- ${messageLink(r)}`).join('\n');
      return respondEphemeral(t(interaction.locale).saved.list.result.replace('{list}', list));
    }

    if (action === 'clear') {
      if (mine.length === 0) return respondEphemeral(t(interaction.locale).saved.clear.empty);
      await Promise.all(mine.map((r) => SavedMessages.delete(r.id)));
      return respondEphemeral(t(interaction.locale).saved.clear.success.replace('{count}', String(mine.length)));
    }
  }

  if (name === 'remind') {
    const action = options?.find((o: any) => o.name === 'action')?.value;
    const discordUserId = interaction.member?.user?.id ?? interaction.user?.id;
    const user = await Users.findOrCreateByDiscordUserId(discordUserId);
    const mine = await Reminders.getAllForUser(user.id);

    if (action === 'list') {
      if (mine.length === 0) return respondEphemeral(t(interaction.locale).remind.list.empty);
      const list = mine.map((r) => `- ${messageLink(r)} — ${dateTag(r.remindAt)}`).join('\n');
      return respondEphemeral(t(interaction.locale).remind.list.result.replace('{list}', list));
    }

    if (action === 'clear') {
      if (mine.length === 0) return respondEphemeral(t(interaction.locale).remind.clear.empty);
      await Promise.all(mine.map((r) => Reminders.delete(r.id)));
      return respondEphemeral(t(interaction.locale).remind.clear.success.replace('{count}', String(mine.length)));
    }
  }

  if (name === 'hello') {
    return respondEphemeral(t(interaction.locale).hello.message);
  }
};

/**
 * Registers (or updates) the bot's slash commands with Discord.
 *
 * Usage:
 *   DISCORD_APP_ID=<app_id> DISCORD_BOT_TOKEN=<token> node scripts/register-commands.mjs
 *
 * This performs a full PUT (bulk overwrite) so all listed commands become the
 * authoritative set. Propagation can take up to one hour globally.
 */

import { appendFileSync } from 'fs';
import { fileURLToPath } from 'url';

export const commands = [
  {
    name: 'settings',
    description: 'View and update your personal settings',
    name_localizations: { fr: 'parametres' },
    description_localizations: { fr: 'Voir et modifier vos paramètres personnels' },
  },
  {
    name: 'hello',
    description: 'Say hello to Discord Sama',
    name_localizations: { fr: 'bonjour' },
    description_localizations: { fr: 'Dire bonjour à Discord Sama' },
  },
  {
    name: 'remind',
    description: 'Manage your scheduled reminders',
    name_localizations: { fr: 'rappels' },
    description_localizations: { fr: 'Gérer vos rappels programmés' },
    options: [
      {
        name: 'action',
        description: 'Action to perform',
        name_localizations: { fr: 'action' },
        description_localizations: { fr: 'Action à effectuer' },
        type: 3, // STRING
        required: true,
        choices: [
          {
            name: 'list — Show your scheduled reminders',
            value: 'list',
            name_localizations: { fr: 'list — Afficher vos rappels programmés' },
          },
          {
            name: 'clear — Delete all your reminders',
            value: 'clear',
            name_localizations: { fr: 'clear — Supprimer tous vos rappels' },
          },
        ],
      },
    ],
  },
  {
    name: 'saved',
    description: 'Manage your saved messages',
    name_localizations: { fr: 'sauvegardés' },
    description_localizations: { fr: 'Gérer vos messages sauvegardés' },
    options: [
      {
        name: 'action',
        description: 'Action to perform',
        name_localizations: { fr: 'action' },
        description_localizations: { fr: 'Action à effectuer' },
        type: 3, // STRING
        required: true,
        choices: [
          {
            name: 'list — Show your saved messages',
            value: 'list',
            name_localizations: { fr: 'list — Afficher vos messages sauvegardés' },
          },
          {
            name: 'clear — Delete all your saved messages',
            value: 'clear',
            name_localizations: { fr: 'clear — Supprimer tous vos messages sauvegardés' },
          },
        ],
      },
    ],
  },
  // Message context menu commands
  {
    name: 'Remind me in 1 hour',
    type: 3, // MESSAGE
    name_localizations: { fr: 'Me le rappeler dans 1 heure' },
  },
  {
    name: 'Remind me tomorrow',
    type: 3, // MESSAGE
    name_localizations: { fr: 'Me le rappeler demain' },
  },
  {
    name: 'Remind me on specific date',
    type: 3, // MESSAGE
    name_localizations: { fr: 'Me le rappeler plus tard' },
  },
  {
    name: 'Save for later',
    type: 3, // MESSAGE
    name_localizations: { fr: 'Sauvegarder' },
  },
];

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const APP_ID = process.env.DISCORD_APP_ID;
  const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

  if (!APP_ID || !BOT_TOKEN) {
    console.error('Error: DISCORD_APP_ID and DISCORD_BOT_TOKEN must be set.');
    process.exit(1);
  }

  const url = `https://discord.com/api/v10/applications/${APP_ID}/commands`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bot ${BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`Failed to register commands (${response.status}):`, error);
    process.exit(1);
  }

  const registered = await response.json();
  console.log(`Successfully registered ${registered.length} command(s):\n`);

  const nameToOutput = {
    'Remind me in 1 hour':        'command_id_remind_1h',
    'Remind me tomorrow':         'command_id_remind_tomorrow',
    'Remind me on specific date': 'command_id_remind_date',
    'Save for later':             'command_id_save_later',
  };

  for (const cmd of registered) {
    const outputName = nameToOutput[cmd.name];
    if (outputName) {
      console.log(`  ${outputName}=${cmd.id}`);
      if (process.env.GITHUB_OUTPUT) {
        appendFileSync(process.env.GITHUB_OUTPUT, `${outputName}=${cmd.id}\n`);
      }
    } else {
      console.log(`  [type ${cmd.type ?? 1}] ${cmd.name} → ${cmd.id}`);
    }
  }
}

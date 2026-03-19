/**
 * Registers (or updates) the bot's slash commands with Discord.
 *
 * Usage:
 *   DISCORD_APP_ID=<app_id> DISCORD_BOT_TOKEN=<token> node scripts/register-commands.mjs
 *
 * This performs a full PUT (bulk overwrite) so all listed commands become the
 * authoritative set. Propagation can take up to one hour globally.
 */

const APP_ID = process.env.DISCORD_APP_ID;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

if (!APP_ID || !BOT_TOKEN) {
  console.error('Error: DISCORD_APP_ID and DISCORD_BOT_TOKEN must be set.');
  process.exit(1);
}

const commands = [
  {
    name: 'settings',
    description: 'View and update your personal settings',
  },
  {
    name: 'hello',
    description: 'Say hello to Discord Sama',
  },
  {
    name: 'remind',
    description: 'Manage your scheduled reminders',
    options: [
      {
        name: 'action',
        description: 'Action to perform',
        type: 3, // STRING
        required: true,
        choices: [
          { name: 'list — Show your scheduled reminders', value: 'list' },
          { name: 'clear — Delete all your reminders', value: 'clear' },
        ],
      },
    ],
  },
  {
    name: 'saved',
    description: 'Manage your saved messages',
    options: [
      {
        name: 'action',
        description: 'Action to perform',
        type: 3, // STRING
        required: true,
        choices: [
          { name: 'list — Show your saved messages', value: 'list' },
          { name: 'clear — Delete all your saved messages', value: 'clear' },
        ],
      },
    ],
  },
  // Message context menu commands
  {
    name: 'Remind me in 1 hour',
    type: 3, // MESSAGE
  },
  {
    name: 'Remind me tomorrow',
    type: 3, // MESSAGE
  },
  {
    name: 'Remind me on specific date',
    type: 3, // MESSAGE
  },
  {
    name: 'Save for later',
    type: 3, // MESSAGE
  },
];

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
console.log(`Successfully registered ${registered.length} command(s):`);
registered.forEach((cmd) => console.log(`  [type ${cmd.type ?? 1}] ${cmd.name}`));

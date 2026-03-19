import { MessageComponentTypes } from 'discord-interactions';
import { User } from '../models/User';

const LANGUAGE_OPTIONS = [
  { label: 'English', value: 'en' },
  { label: 'Français', value: 'fr' },
];

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  label: `${i}:00`,
  value: String(i),
}));

const MINUTE_OPTIONS = [
  { label: '00', value: '0' },
  { label: '15', value: '15' },
  { label: '30', value: '30' },
  { label: '45', value: '45' },
];

const TIMEZONE_OPTIONS = [
  { label: 'UTC', value: 'UTC' },
  { label: 'London (UTC+0/+1)', value: 'Europe/London' },
  { label: 'Paris (UTC+1/+2)', value: 'Europe/Paris' },
  { label: 'Berlin (UTC+1/+2)', value: 'Europe/Berlin' },
  { label: 'Rome (UTC+1/+2)', value: 'Europe/Rome' },
  { label: 'Madrid (UTC+1/+2)', value: 'Europe/Madrid' },
  { label: 'Amsterdam (UTC+1/+2)', value: 'Europe/Amsterdam' },
  { label: 'Zurich (UTC+1/+2)', value: 'Europe/Zurich' },
  { label: 'Stockholm (UTC+1/+2)', value: 'Europe/Stockholm' },
  { label: 'Helsinki (UTC+2/+3)', value: 'Europe/Helsinki' },
  { label: 'Moscow (UTC+3)', value: 'Europe/Moscow' },
  { label: 'New York (UTC-5/-4)', value: 'America/New_York' },
  { label: 'Toronto (UTC-5/-4)', value: 'America/Toronto' },
  { label: 'Chicago (UTC-6/-5)', value: 'America/Chicago' },
  { label: 'Mexico City (UTC-6/-5)', value: 'America/Mexico_City' },
  { label: 'Denver (UTC-7/-6)', value: 'America/Denver' },
  { label: 'Los Angeles (UTC-8/-7)', value: 'America/Los_Angeles' },
  { label: 'São Paulo (UTC-3)', value: 'America/Sao_Paulo' },
  { label: 'Dubai (UTC+4)', value: 'Asia/Dubai' },
  { label: 'Kolkata (UTC+5:30)', value: 'Asia/Kolkata' },
  { label: 'Bangkok (UTC+7)', value: 'Asia/Bangkok' },
  { label: 'Shanghai (UTC+8)', value: 'Asia/Shanghai' },
  { label: 'Tokyo (UTC+9)', value: 'Asia/Tokyo' },
  { label: 'Sydney (UTC+10/+11)', value: 'Australia/Sydney' },
  { label: 'Auckland (UTC+12/+13)', value: 'Pacific/Auckland' },
];

const withDefault = <T extends { value: string }>(options: T[], current: string) =>
  options.map((o) => ({ ...o, default: o.value === current }));

const selectMenu = (customId: string, placeholder: string, options: object[]) => ({
  type: MessageComponentTypes.ACTION_ROW,
  components: [{
    type: MessageComponentTypes.STRING_SELECT,
    custom_id: customId,
    placeholder,
    options,
  }],
});

export const buildSettingsMessage = (user: User) => ({
  content: `**Settings**\nLanguage: **${user.language === 'en' ? 'English' : 'Français'}** · Timezone: **${user.timezone}** · Daily reminder: **${user.dailyReminderHour}:${String(user.dailyReminderMinutes).padStart(2, '0')}**`,
  components: [
    selectMenu('settings:language', 'Language', withDefault(LANGUAGE_OPTIONS, user.language)),
    selectMenu('settings:timezone', 'Timezone', withDefault(TIMEZONE_OPTIONS, user.timezone)),
    selectMenu('settings:reminderHour', 'Reminder hour', withDefault(HOUR_OPTIONS, String(user.dailyReminderHour))),
    selectMenu('settings:reminderMinutes', 'Reminder minutes', withDefault(MINUTE_OPTIONS, String(user.dailyReminderMinutes))),
  ],
});

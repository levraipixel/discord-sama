// Returns the UTC offset in minutes for an IANA timezone at a given date (positive = east of UTC).
// Uses Intl to reconstruct the local wall-clock time and diff against UTC — handles DST correctly.
export const getTimezoneOffsetMinutes = (timezone, date) => {
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

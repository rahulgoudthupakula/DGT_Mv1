/** Calendar dates are store-local labels, so UTC arithmetic avoids browser DST shifts. */
export function scheduleAddDays(date: string, amount: number) {
  const value = new Date(date + 'T12:00:00Z');
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}
export function scheduleSunday(date: string) {
  return scheduleAddDays(date, -new Date(date + 'T12:00:00Z').getUTCDay());
}
export function shiftDates(date: string, endDate: string, selectedDays: number[]) {
  const offset = (Date.parse(endDate + 'T12:00:00Z') - Date.parse(date + 'T12:00:00Z')) / 86400000;
  if (!Number.isInteger(offset) || offset < 0 || offset > 1) throw new Error('Choose the same end date, or the following day for an overnight shift.');
  if (!selectedDays.length || selectedDays.some(day => !Number.isInteger(day) || day < 0 || day > 6)) throw new Error('Select at least one day.');
  const sunday = scheduleSunday(date);
  return [...new Set(selectedDays)].sort((a,b) => a-b).map(day => {
    const start = scheduleAddDays(sunday, day);
    return {date: start, endDate: scheduleAddDays(start, offset)};
  });
}

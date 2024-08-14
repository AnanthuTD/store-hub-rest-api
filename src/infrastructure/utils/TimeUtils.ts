import dayjs from 'dayjs';

/**
 * Convert a relative time string (e.g., "1h", "30m") into a JavaScript Date object.
 * @param timeString - The relative time string to convert.
 * @returns The Date object representing the future date and time.
 * @throws Error if the time unit is invalid or the time string is not valid.
 */
export const convertRelativeTimeToDate = (timeString: string): Date => {
  if (!timeString) {
    throw new Error('Time string cannot be empty');
  }

  const timeValue: number = parseInt(timeString.slice(0, -1), 10);
  const timeUnit: string = timeString.slice(-1);

  if (isNaN(timeValue) || timeValue <= 0) {
    throw new Error('Invalid time value');
  }

  // Add the specified time to the current date and time
  switch (timeUnit) {
    case 'h':
      return dayjs().add(timeValue, 'hour').toDate();
    case 'm':
      return dayjs().add(timeValue, 'minute').toDate();
    case 's':
      return dayjs().add(timeValue, 'second').toDate();
    case 'd':
      return dayjs().add(timeValue, 'day').toDate();
    default:
      throw new Error('Invalid time unit');
  }
};

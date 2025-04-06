/**
 * Creates a Google Calendar event URL
 * @param {Object} event - The event object with name, description, date, time, location
 * @returns {string} - Google Calendar URL
 */
export const createGoogleCalendarEvent = (event) => {
  // Format the date for Google Calendar (YYYYMMDDTHHMMSS)
  const eventDate = new Date(event.date);
  
  // If there's a time, use it, otherwise set to 00:00
  if (event.time) {
    const [hours, minutes] = event.time.split(':');
    eventDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));
  }
  
  const formattedStartDate = eventDate.toISOString().replace(/-|:|\.\d+/g, '');
  
  // Default to 2 hour event
  const endDate = new Date(eventDate);
  endDate.setHours(eventDate.getHours() + 2);
  const formattedEndDate = endDate.toISOString().replace(/-|:|\.\d+/g, '');
  
  // Build the URL
  const url = new URL('https://calendar.google.com/calendar/render');
  url.searchParams.append('action', 'TEMPLATE');
  url.searchParams.append('text', event.name);
  url.searchParams.append('dates', `${formattedStartDate}/${formattedEndDate}`);
  
  if (event.description) {
    url.searchParams.append('details', event.description);
  }
  
  if (event.location) {
    url.searchParams.append('location', event.location);
  }
  
  return url.toString();
};

/**
 * Downloads an iCalendar file for the event
 * @param {Object} event - The event object
 */
export const downloadICalEvent = (event) => {
  const eventDate = new Date(event.date);
  
  // If there's a time, use it, otherwise set to 00:00
  if (event.time) {
    const [hours, minutes] = event.time.split(':');
    eventDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));
  }
  
  const endDate = new Date(eventDate);
  endDate.setHours(eventDate.getHours() + 2);
  
  // Format dates for iCal
  const formatDate = (date) => {
    return date.toISOString().replace(/-|:|\.\d+/g, '');
  };
  
  const now = new Date();
  
  // Create iCal content
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Club Events//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${Math.random().toString(36).substring(2)}@clubevents.com`,
    `DTSTAMP:${formatDate(now)}`,
    `DTSTART:${formatDate(eventDate)}`,
    `DTEND:${formatDate(endDate)}`,
    `SUMMARY:${event.name}`,
    event.description ? `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}` : '',
    event.location ? `LOCATION:${event.location}` : '',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\r\n');
  
  // Create a blob and download link
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${event.name.replace(/\s+/g, '_')}.ics`;
  link.click();
}; 
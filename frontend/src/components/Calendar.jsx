import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { createGoogleCalendarEvent } from '../utils/calendarUtils';

export const Calendar = ({ events = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // Generate calendar days for the current month
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Get the day of the week for the first day (0 = Sunday, 6 = Saturday)
    const firstDayOfWeek = firstDay.getDay();
    
    // Create an array for all days in the month plus padding for the first week
    const days = [];
    
    // Add empty spaces for days from previous month
    for (let i = 0; i < firstDayOfWeek; i++) {
      const prevMonthLastDay = new Date(year, month, 0);
      const day = prevMonthLastDay.getDate() - firstDayOfWeek + i + 1;
      days.push({
        date: new Date(year, month - 1, day),
        isCurrentMonth: false,
        hasEvent: false,
        events: []
      });
    }
    
    // Add all days in the current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      const dateEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.getDate() === i && 
               eventDate.getMonth() === month && 
               eventDate.getFullYear() === year;
      });
      
      days.push({
        date,
        isCurrentMonth: true,
        hasEvent: dateEvents.length > 0,
        events: dateEvents
      });
    }
    
    // Add days from the next month to complete the calendar grid (6 rows x 7 columns = 42 days)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
        hasEvent: false,
        events: []
      });
    }
    
    setCalendarDays(days);
  }, [currentDate, events]);
  
  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };
  
  const formatEventTime = (event) => {
    if (!event.time) return '';
    return event.time;
  };
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  return (
    <div className="calendar-container">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">
          {currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}
        </h2>
        <div className="flex">
          <Button variant="outline" size="sm" onClick={() => navigateMonth(-1)} className="mr-2">
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigateMonth(1)}>
            Next
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {dayNames.map(day => (
          <div key={day} className="text-center font-semibold py-2">
            {day}
          </div>
        ))}
        
        {calendarDays.map((day, index) => (
          <div 
            key={index} 
            className={`min-h-24 p-1 border rounded-md ${
              day.isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'
            } ${
              day.hasEvent ? 'border-blue-200' : ''
            } ${
              new Date().toDateString() === day.date.toDateString() ? 'bg-blue-50 border-blue-300' : ''
            }`}
          >
            <div className="text-right">{day.date.getDate()}</div>
            
            <div className="mt-1">
              {day.events.slice(0, 2).map((event, idx) => (
                <div 
                  key={idx} 
                  className={`text-xs p-1 mb-1 rounded truncate cursor-pointer hover:bg-gray-100 ${
                    event.status === 'approved' ? 'bg-green-100' : 
                    event.status === 'pending' ? 'bg-yellow-100' : 'bg-red-100'
                  }`}
                  onClick={() => setSelectedEvent(event)}
                >
                  {formatEventTime(event)} {event.name}
                </div>
              ))}
              
              {day.events.length > 2 && (
                <div className="text-xs text-blue-500 cursor-pointer" onClick={() => alert(`All events on ${day.date.toDateString()}: ${day.events.map(e => e.name).join(', ')}`)}>
                  +{day.events.length - 2} more
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold">{selectedEvent.name}</h3>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="mb-4">
              <p>{selectedEvent.description}</p>
              <div className="mt-2 text-sm text-gray-600">
                <p><strong>Date:</strong> {new Date(selectedEvent.date).toLocaleDateString()}</p>
                {selectedEvent.time && <p><strong>Time:</strong> {selectedEvent.time}</p>}
                {selectedEvent.location && <p><strong>Location:</strong> {selectedEvent.location}</p>}
                {selectedEvent.club && <p><strong>Club:</strong> {selectedEvent.club.name}</p>}
              </div>
            </div>
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                className="mr-2"
                onClick={() => window.open(createGoogleCalendarEvent(selectedEvent), '_blank')}
              >
                Add to Google Calendar
              </Button>
              <Button 
                size="sm"
                onClick={() => setSelectedEvent(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 
import React, { useState } from "react";
import Calendar from "react-calendar";
import 'react-calendar/dist/Calendar.css';
import type { Value } from 'react-calendar';

export default function MyCalendar() {
  const [value, setValue] = useState<Value>(new Date()); // Accepts Date | [Date, Date]
  const [showCalendar, setShowCalendar] = useState(false);

  const toggleCalendar = () => setShowCalendar(!showCalendar);

  const highlightDates = [
    new Date(2025, 6, 20),
    new Date(2025, 6, 22),
    new Date(2025, 6, 25)
  ];

  const disabledDates = [
    new Date(2025, 6, 23),
    new Date(2025, 6, 24)
  ];

  return (
    <div className="w-full max-w-sm mx-auto p-4">
      <button
        onClick={toggleCalendar}
        className="px-4 py-2 bg-[#242424] text-[white] rounded-md shadow"
      >
        {showCalendar ? "Hide Calendar" : "Show Calendar"}
      </button>

      {showCalendar && (
        <Calendar
          onChange={(val) => setValue(val)}
          value={value}
          selectRange={true}
          tileClassName={({ date }) =>
            highlightDates.some(d => d.toDateString() === date.toDateString())
              ? "bg-green-200 text-black rounded-md"
              : null
          }
          tileDisabled={({ date }) =>
            disabledDates.some(d => d.toDateString() === date.toDateString())
          }
        />
      )}
    </div>
  );
}

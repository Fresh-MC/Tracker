import React, { useMemo, useState, useEffect } from "react";

// helpers
const fmt = (d) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

// Sample static data
const sampleRows = [
  {
    _id: "1",
    event: "Backend",
    responsible: { name: "Rajesh", email: "rajesh@example.com" },
    startDate: "2025-08-07",
    finishDate: "2025-08-15",
    completion: 40,
    noOfDays: 9
  },
  {
    _id: "2",
    event: "Frontend",
    responsible: { name: "Anita", email: "anita@example.com" },
    startDate: "2025-08-10",
    finishDate: "2025-08-20",
    completion: 60,
    noOfDays: 11
  },
];

export default function ProPlan() {
  const [rows, setRows] = useState(sampleRows);
  const [users, setUsers] = useState([]);

  // Fetch tasks from server
  useEffect(() => {
    fetch("http://localhost:3000/api/tasks")
      .then(res => res.json())
      .then(data => {
        const formatted = data.map(t => ({
          _id: t._id,
          event: t.title,
          responsible: { name: t.assignee, email: "" },
          startDate: t.startDate,
          finishDate: t.endDate,
          completion: t.completion || 0,
          noOfDays: Math.ceil((new Date(t.endDate) - new Date(t.startDate)) / (1000*60*60*24))
        }));
        setRows(formatted);
      })
      .catch(err => console.error("Error fetching tasks:", err));

    // Fetch users
    fetch("http://localhost:3000/api/users")
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error("Error fetching users:", err));
  }, []);

  // compute grid range
  const { days, minDate, maxDate } = useMemo(() => {
    if (!rows.length) return { days: [], minDate: null, maxDate: null };
    const min = rows.reduce((m, r) => m && m < new Date(r.startDate) ? m : new Date(r.startDate), null);
    const max = rows.reduce((m, r) => m && m > new Date(r.finishDate) ? m : new Date(r.finishDate), null);
    const dd = [];
    for (let d = new Date(min); d <= max; d = addDays(d, 1)) dd.push(new Date(d));
    return { days: dd, minDate: min, maxDate: max };
  }, [rows]);

  return (
    <div className="p-4 bg-[#303030]">
      <header className="mb-4 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-wide">DEVELOPMENT TIMING PLAN</h1>
          {minDate && maxDate && (
            <p className="text-sm text-gray-500">{fmt(minDate)} – {fmt(maxDate)}</p>
          )}
        </div>
        <button
          onClick={() => window.print()}
          className="px-3 py-1.5 rounded-lg shadow border text-sm hover:bg-white-50 print:hidden"
        >
          Print / Save PDF
        </button>
      </header>

      <div className="border bg rounded-xl overflow-hidden shadow-sm">
        {/* Header */}
        <div className="grid" style={{ gridTemplateColumns: "320px 160px 80px 120px 120px 110px 1fr" }}>
          <div className="bg-gray-200 font-medium px-3 py-2 border-r sticky left-0 z-10">Events</div>
          <div className="bg-gray-100 font-medium px-3 py-2 border-r sticky left-[320px] z-10">Responsible</div>
          <div className="bg-gray-100 font-medium px-3 py-2 border-r sticky left-[480px] z-10">No of Days</div>
          <div className="bg-gray-100 font-medium px-3 py-2 border-r sticky left-[560px] z-10">Start Date</div>
          <div className="bg-gray-100 font-medium px-3 py-2 border-r sticky left-[680px] z-10">Finish Date</div>
          <div className="bg-gray-100 font-medium px-3 py-2 border-r sticky left-[800px] z-10">% completion</div>
          <div className="bg-gray-100 px-2 py-2 overflow-hidden">
            <div className="flex text-[10px] text-white-600">
              {days.map((d, i) => (
                <div key={i} className="w-6 text-center border-l last:border-r">
                  {d.getDate().toString().padStart(2, "0")}
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          {rows.map((r, idx) => {
            const s = new Date(r.startDate);
            const e = new Date(r.finishDate);
            return (
              <React.Fragment key={r._id || idx}>
                <div className={`px-3 py-2 border-t border-r sticky left-0 bg-gray ${idx % 2 ? "bg-gray-50" : ""}`}>
                  <div className="font-medium">{r.event}</div>
                </div>
                <div className={`px-3 py-2 border-t border-r sticky left-[320px] ${idx % 2 ? "bg-gray-50" : ""}`}>
                  <div className="text-sm">{r?.responsible?.name || "-"}</div>
                </div>
                <div className={`px-3 py-2 border-t border-r text-sm sticky left-[480px] ${idx % 2 ? "bg-gray-50" : ""}`}>
                  {r.noOfDays}
                </div>
                <div className={`px-3 py-2 border-t border-r text-sm sticky left-[560px] ${idx % 2 ? "bg-gray-50" : ""}`}>{fmt(s)}</div>
                <div className={`px-3 py-2 border-t border-r text-sm sticky left-[680px] ${idx % 2 ? "bg-gray-50" : ""}`}>{fmt(e)}</div>
                <div className={`px-3 py-2 border-t border-r text-sm sticky left-[800px] ${idx % 2 ? "bg-gray-50" : ""}`}>
                  <div className="w-full h-2 bg-gray-200 rounded">
                    <div className="h-2 rounded" style={{ width: `${Math.min(100, r.completion)}%`, background: "#4b5563" }} />
                  </div>
                  <div className="text-xs mt-1">{Math.min(100, r.completion)}%</div>
                </div>

                <div className={`border-t overflow-hidden ${idx % 2 ? "bg-gray-50" : ""}`}>
                  <div className="flex">
                    {days.map((d, i) => {
                      const inRange = d >= s && d <= e;
                      return (
                        <div
                          title={`${r.event} • ${fmt(s)}–${fmt(e)}`}
                          key={i}
                          className={`w-6 h-6 border-l last:border-r ${inRange ? "bg-gray-700/70" : ""}`}
                        />
                      );
                    })}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}

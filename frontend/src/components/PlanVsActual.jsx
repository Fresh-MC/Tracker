import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { GridBackground } from "../components/lightswind/grid-dot-background";
import MyCalendar from "./MyCalendar";


const data = [
  { name: 'Phase 1: Planning', plannedStart: 0, plannedEnd: 5, actualStart: 1, actualEnd: 6 },
  { name: 'Phase 2: Design', plannedStart: 6, plannedEnd: 12, actualStart: 7, actualEnd: 11 },
  { name: 'Phase 3: Development', plannedStart: 13, plannedEnd: 25, actualStart: 12, actualEnd: 28 },
  { name: 'Phase 4: Testing', plannedStart: 26, plannedEnd: 30, actualStart: 29, actualEnd: 31 },
  { name: 'Phase 5: Deployment', plannedStart: 31, plannedEnd: 35, actualStart: 32, actualEnd: 34 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const plannedBar = payload.find(p => p.dataKey === 'plannedDuration');
    const actualBar = payload.find(p => p.dataKey === 'actualDuration');
    const task = data.find(d => d.name === label);
    if (!task) return null;

    return (
      <div className="p-4 bg-white rounded-lg shadow-md border border-gray-200 text-sm font-inter">
        <p className="font-bold text-lg mb-2">{task.name}</p>
        {plannedBar && (
          <p className="text-blue-600">
            Planned: Day {task.plannedStart} - Day {task.plannedEnd} (Duration: {plannedBar.value} days)
          </p>
        )}
        {actualBar && (
          <p className="text-green-600">
            Actual: Day {task.actualStart} - Day {task.actualEnd} (Duration: {actualBar.value} days)
          </p>
        )}
      </div>
    );
  }
  return null;
};

const PlanVsActual = () => {
  const chartData = data.map(task => ({
    name: task.name,
    plannedOffset: task.plannedStart,
    actualOffset: task.actualStart,
    plannedDuration: task.plannedEnd - task.plannedStart,
    actualDuration: task.actualEnd - task.actualStart,
  }));

  return (
    <GridBackground
      gridSize={24}
      gridColor="#e4e4e7"
      darkGridColor="#262626"
      showFade={true}
      fadeIntensity={30}
      className="min-h-screen py-12"
    >
      {/* Horizontal layout for chart and calendar */}
      <div className="flex w-full max-w-[1400px] h-[800px] p-6 bg-[#242424] rounded-2xl shadow-xl border border-gray-200 font-inter gap-8 ml-6">
        {/* Chart Section */}
        <div className="flex-1 flex flex-col">
          <h2 className="text-3xl font-bold text-[white] mb-4">Plan vs. Actual Progress</h2>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              barCategoryGap={20}
              margin={{ top: 20, right: 50, left: 40, bottom: 20 }}
            >
              <XAxis
                type="number"
                domain={[0, 'dataMax + 5']}
                tickFormatter={(value) => `Day ${value}`}
                stroke="#6B7280"
                className="text-sm"
              />
              <YAxis
                type="category"
                dataKey="name"
                width={160}
                stroke="#6B7280"
                className="text-sm"
              />
              <Tooltip content={<CustomTooltip />} />
              {/* Planned */}
              <Bar dataKey="plannedOffset" stackId="planned" fill="transparent" barSize={32} />
              <Bar dataKey="plannedDuration" stackId="planned" fill="#60A5FA" barSize={32} />
              {/* Actual */}
              <Bar dataKey="actualOffset" stackId="actual" fill="transparent" barSize={32} />
              <Bar dataKey="actualDuration" stackId="actual" fill="#34D399" barSize={32} />
            </BarChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="mt-4 flex justify-start space-x-6 text-base">
            <div className="flex items-center">
              <span className="w-4 h-4 rounded-full bg-blue-400 mr-2"></span>
              <span>Planned</span>
            </div>
            <div className="flex items-center">
              <span className="w-4 h-4 rounded-full bg-green-400 mr-2"></span>
              <span>Actual</span>
            </div>
          </div>
        </div>

        {/* Calendar Section (placeholder or real component) */}
        <div className="w-[300px] bg-[#242424] p-4 rounded-lg shadow border border-gray-200">
          <h3 className="text-xl font-semibold mb-4 ">Calendar</h3>
          
            
<MyCalendar />
          
        </div>
      </div>
    </GridBackground>
  );
};

export default PlanVsActual;

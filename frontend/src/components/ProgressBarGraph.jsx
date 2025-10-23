// components/ProgressBarGraph.jsx
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';

const ProgressBarGraph = () => {
  const data = [
    {
      name: 'Planned',
      tasks: 12,
      fill: '#31493c',
    },
    {
      name: 'Completed',
      tasks: 9,
      fill: '#c05a43',
    },
    {
      name: 'Delayed',
      tasks: 3,
      fill: '#f8c146',
    },
  ];

  return (
    <div className="w-full h-full px-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis dataKey="name" stroke="#f8f7ec" />
          <YAxis stroke="#f8f7ec" />
          <Tooltip />
          <Bar dataKey="tasks" isAnimationActive={true}>
            <LabelList dataKey="tasks" position="top" fill="#f8f7ec" />
            {data.map((entry, index) => (
              <Bar key={`bar-${index}`} dataKey="tasks" fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProgressBarGraph;

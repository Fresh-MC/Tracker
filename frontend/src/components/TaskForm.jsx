import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import Select from 'react-select';
import { motion } from 'framer-motion';
import 'react-datepicker/dist/react-datepicker.css';

const TaskForm = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [assignee, setAssignee] = useState(null);
  const [priority, setPriority] = useState('Medium');
  const [tags, setTags] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);

  const tagOptions = [
    { value: 'Frontend', label: 'Frontend' },
    { value: 'Backend', label: 'Backend' },
    { value: 'Bug', label: 'Bug' },
    { value: 'Feature', label: 'Feature' },
  ];

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const response = await fetch('/api/users'); // mock or local json
        const data = await response.json();
        const options = data.map(user => ({
          value: user._id || user.id,
          label: user.name,
        }));
        setTeamMembers(options);
      } catch (err) {
        console.error('Failed to load team members:', err);
      }
    };
    fetchTeamMembers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const taskData = {
      title,
      description,
      dueDate,
      assignee: assignee?.value || null,
      priority,
      tags: tags.map(tag => tag.value),
    };

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });

      if (response.ok) {
        console.log('✅ Task created successfully!');
        setTitle('');
        setDescription('');
        setDueDate(new Date());
        setAssignee(null);
        setPriority('Medium');
        setTags([]);
      } else {
        console.error('❌ Task creation failed');
      }
    } catch (error) {
      console.error('⚠️ Error submitting form:', error);
    }
  };

  return (
    
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="max-w-2xl mx-auto bg-white shadow-lg rounded-2xl p-8 mt-10 space-y-6"
    >
      <h2 className="text-2xl font-bold text-center text-gray-800">Create New Task</h2>

      <div>
        <label className="block font-semibold mb-1 text-gray-700">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block font-semibold mb-1 text-gray-700">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block font-semibold mb-1 text-gray-700">Due Date</label>
        <DatePicker
          selected={dueDate}
          onChange={setDueDate}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none"
        />
      </div>

      <div>
        <label className="block font-semibold mb-1 text-gray-700">Assignee</label>
        <Select
          options={teamMembers}
          value={assignee}
          onChange={setAssignee}
          isClearable
          className="text-sm"
        />
      </div>

      <div>
        <label className="block font-semibold mb-1 text-gray-700">Priority</label>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      <div>
        <label className="block font-semibold mb-1 text-gray-700">Tags</label>
        <Select
          isMulti
          options={tagOptions}
          value={tags}
          onChange={setTags}
          className="text-sm"
        />
      </div>

      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        type="submit"
        className="w-full bg-blue-600 text-white font-medium py-3 rounded-xl shadow hover:bg-blue-700 transition"
      >
        Create Task
      
      </motion.button>
    </motion.form>
    
  );
};

export default TaskForm;

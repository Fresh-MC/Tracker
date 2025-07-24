// src/components/TaskForm.jsx
import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import Select from 'react-select';
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

  // 🔁 Fetch team members from mock API (replace later)
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
        // Reset form
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
    <form onSubmit={handleSubmit} style={styles.form}>
      <h2>Create New Task</h2>

      <label style={styles.label}>Title</label>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        style={styles.input}
      />

      <label style={styles.label}>Description</label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={4}
        style={styles.textarea}
      />

      <label style={styles.label}>Due Date</label>
      <DatePicker selected={dueDate} onChange={setDueDate} style={styles.input} />

      <label style={styles.label}>Assignee</label>
      <Select
        options={teamMembers}
        value={assignee}
        onChange={setAssignee}
        isClearable
      />

      <label style={styles.label}>Priority</label>
      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
        style={styles.select}
      >
        <option value="High">High</option>
        <option value="Medium">Medium</option>
        <option value="Low">Low</option>
      </select>

      <label style={styles.label}>Tags</label>
      <Select
        isMulti
        options={tagOptions}
        value={tags}
        onChange={setTags}
      />

      <button type="submit" style={styles.button}>Create Task</button>
    </form>
  );
};

const styles = {
  form: {
    maxWidth: '500px',
    margin: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    padding: '1.5rem',
    backgroundColor: '#f7f7f7',
    borderRadius: '12px',
    boxShadow: '0 0 10px rgba(0,0,0,0.05)',
  },
  label: { fontWeight: 'bold' },
  input: {
    padding: '8px',
    fontSize: '1rem',
    borderRadius: '6px',
    border: '1px solid #ccc',
  },
  textarea: {
    padding: '8px',
    fontSize: '1rem',
    borderRadius: '6px',
    border: '1px solid #ccc',
  },
  select: {
    padding: '8px',
    fontSize: '1rem',
    borderRadius: '6px',
    border: '1px solid #ccc',
  },
  button: {
    padding: '10px',
    fontSize: '1rem',
    borderRadius: '8px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
  },
};

export default TaskForm;

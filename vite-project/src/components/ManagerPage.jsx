// ManagerPage.jsx
import { useEffect, useState } from "react";
import axios from "axios";

export default function ManagerPage() {
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    axios.get("/api/users", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    }).then(res => setEmployees(res.data));
  }, []);

  const assignRole = (id, role) => {
    axios.put(`/api/manager/assign-role/${id}`, { role }, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    }).then(() => {
      setEmployees(prev =>
        prev.map(emp => emp._id === id ? { ...emp, role } : emp)
      );
    });
  };

  return (
    <div>
      <h1>Manager Role Assignment</h1>
      <table>
        <thead>
          <tr>
            <th>Name</th><th>Email</th><th>Current Role</th><th>Action</th>
          </tr>
        </thead>
        <tbody>
          {employees.map(emp => (
            <tr key={emp._id}>
              <td>{emp.name}</td>
              <td>{emp.email}</td>
              <td>{emp.role}</td>
              <td>
                <select value={emp.role} onChange={(e) => assignRole(emp._id, e.target.value)}>
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

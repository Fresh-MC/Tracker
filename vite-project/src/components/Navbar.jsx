import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-white dark:bg-zinc-900 shadow-md px-6 py-3 flex justify-between items-center sticky top-0 z-50">
      <div className="text-xl font-bold text-blue-600">YourAppName</div>

      <ul className="flex gap-6 text-sm font-medium text-gray-700 dark:text-gray-200">
        <li>
          <Link to="/" className="hover:text-blue-500">Home</Link>
        </li>
        <li>
          <Link to="/about" className="hover:text-blue-500">About</Link>
        </li>
        <li>
          <Link to="/dashboard" className="hover:text-blue-500">Dashboard</Link>
        </li>
        <li>
          <Link to="/contact" className="hover:text-blue-500">Contact</Link>
        </li>
      </ul>
    </nav>
  );
}

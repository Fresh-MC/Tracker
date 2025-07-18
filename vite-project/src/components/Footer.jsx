import React from "react";
import logo from "../assets/logo.svg";

export default function Footer() {
  return (
    <footer className="w-full border-t border-[#121212] bg-[#242424] rounded-4xl" role="contentinfo" >
      <div className="mx-auto max-w-screen-xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:justify-between gap-12 border-b pb-10">
          {/* Logo and Description */}
          <div className="max-w-md">
            <a href="http://localhost:5173/#/" aria-label="Pagedone Logo" className="flex items-center gap-2">
              <svg className="w-8 h-8" viewBox="0 0 40 40" fill="none" xmlns="logo">
                <rect width="100%" height="100%" rx="8" fill="#2563EB" />
                <path d="M22.768 11.962v16.038h5.154V15.23l3.307.756V11l-8.461.962ZM6 22.077v5.923h5.077v-4.307l3.308.754V11l-8.385.962v5.615l3.308.754v3.384L6 22.077Zm11.846 5.923h5.077V11.962h-5.077V28Z" fill="white" />
              </svg>
              <span className="font-semibold text-xl text-[#f8f7ec]">Tracker</span>
            </a>
            <p className="mt-4 text-sm text-[#f8f7ec]">
              For fast and reliable tracking of your projects, tasks, and deadlines. Stay organized and efficient with our easy-to-use platform.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            {/* Column 1 */}
            <ul className="flex flex-col gap-2 text-[#f8f7ec]">
              <li className="font-semibold mb-1 text-[#f8f7ec]">Company</li>
              <li><a href="#" className="hover:text-blue-600 transition">About Us</a></li>
              <li><a href="#" className="hover:text-blue-600 transition">Pricing</a></li>
              <li><a href="#" className="hover:text-blue-600 transition">Contact</a></li>
            </ul>

            {/* Column 2 */}
            <ul className="flex flex-col gap-2 text-[#f8f7ec]">
              <li className="font-semibold mb-1 text-[#f8f7ec]">Legal</li>
              <li><a href="#" className="hover:text-blue-600 transition">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-blue-600 transition">Terms of Service</a></li>
              <li><a href="#" className="hover:text-blue-600 transition">Cookie Policy</a></li>
            </ul>

            {/* Column 3 */}
            <ul className="flex flex-col gap-2 text-[#f8f7ec]">
              <li className="font-semibold mb-1 text-[#f8f7ec]">Social</li>
              <li><a href="#" className="hover:text-blue-600 transition">LinkedIn</a></li>
              <li><a href="#" className="hover:text-blue-600 transition">Twitter</a></li>
              <li><a href="#" className="hover:text-blue-600 transition">Instagram</a></li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="py-6 text-sm text-center text-[#f8f7ec] bg-[#242424]">
          © 2025 All rights reserved by{" "}
          <a href="http://localhost:5173/#/" className="underline hover:text-blue-600 transition">
            Messy Stackers
          </a>
        </div>
      </div>
    </footer>
  );
}

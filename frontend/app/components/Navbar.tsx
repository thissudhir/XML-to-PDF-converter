"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if the user is logged in by verifying the token
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    // Remove the token from localStorage
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    router.push("/login"); // Redirect to the login page
  };

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md">
      <div className="container mx-auto flex justify-between items-center py-4 px-6">
        {/* Logo */}

        <Link
          href="/"
          className="text-2xl font-bold text-gray-800 dark:text-gray-100 hover:text-blue-500 transition duration-300"
        >
          Converter
        </Link>

        {/* Navigation Buttons */}
        <div className="space-x-4">
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition duration-300"
            >
              Logout
            </button>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition duration-300"
              >
                Login
              </Link>

              <>
                <Link
                  href="/signup"
                  className="px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition duration-300"
                >
                  Signup
                </Link>
              </>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

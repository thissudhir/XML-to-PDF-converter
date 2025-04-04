"use client";
import React, { useEffect, useState } from "react";

export default function ConversionHistory() {
  const [history, setHistory] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/conversions`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch conversion history");
        }

        const data = await response.json();
        setHistory(data);
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchHistory();
  }, []);

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-bold mb-4">Conversion History</h1>
        {history.length === 0 ? (
          <p>No conversions found.</p>
        ) : (
          <ul className="space-y-4">
            {history.map((conversion) => (
              <li key={conversion._id} className="p-4 bg-gray-100 rounded-lg">
                <p>
                  <strong>File:</strong> {conversion.originalFilename}
                </p>
                <p>
                  <strong>Date:</strong>{" "}
                  {new Date(conversion.createdAt).toLocaleString()}
                </p>
                <button
                  onClick={() =>
                    window.open(
                      `${process.env.NEXT_PUBLIC_API_URL}/api/conversion/${conversion._id}/download`,
                      "_blank"
                    )
                  }
                  className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg"
                >
                  Download XML
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

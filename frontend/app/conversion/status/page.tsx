"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ConversionStatus() {
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams(); // Hook to access query parameters
  const conversionId = searchParams.get("id"); // Get the "id" query parameter

  useEffect(() => {
    console.log("Conversion ID:", conversionId);
    const fetchStatus = async () => {
      if (!conversionId) {
        setError("Conversion ID is missing in the URL.");
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/conversion/${conversionId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch conversion status");
        }

        const data = await response.json();
        setStatus(data.status);
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchStatus();
  }, [conversionId]);

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Conversion Status</h1>
        {status ? (
          <p className="mt-4 text-lg">Status: {status}</p>
        ) : (
          <p className="mt-4 text-lg">Loading...</p>
        )}
        {status === "completed" && (
          <button
            onClick={() => router.push(`/conversion/${conversionId}/download`)}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            Download XML
          </button>
        )}
      </div>
    </div>
  );
}

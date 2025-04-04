"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function PdfUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter(); // Use Next.js router for navigation

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === "application/pdf") {
        setFile(selectedFile);
        setError(null);

        // Upload the file
        const formData = new FormData();
        formData.append("pdf", selectedFile);

        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/convert`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
              body: formData,
            }
          );

          if (!response.ok) {
            throw new Error("Failed to upload PDF");
          }

          const result = await response.json();
          console.log("Conversion started:", result);

          // Redirect to the status page with the conversion ID
          router.push(`/conversion/status?id=${result.conversionId}`);
        } catch (err: any) {
          setError(err.message);
        }
      } else {
        setError("Only PDF files are allowed.");
        setFile(null);
      }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile.type === "application/pdf") {
      setFile(droppedFile);
      setError(null);
    } else {
      setError("Only PDF files are allowed.");
      setFile(null);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
      <div
        className="w-full max-w-lg p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          id="fileInput"
          onChange={handleFileChange}
        />
        <label
          htmlFor="fileInput"
          className="flex flex-col items-center justify-center cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-16 h-16 text-gray-400 dark:text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <p className="mt-4 text-lg font-medium text-gray-600 dark:text-gray-400">
            Drag & drop your PDF here, or{" "}
            <span className="text-blue-500 underline">browse</span>
          </p>
        </label>
      </div>
      {file && (
        <div className="mt-6 text-center">
          <p className="text-lg text-gray-700 dark:text-gray-300">
            Selected file: <strong>{file.name}</strong>
          </p>
        </div>
      )}
      {error && (
        <div className="mt-6 text-center">
          <p className="text-lg text-red-500">{error}</p>
        </div>
      )}
    </div>
  );
}

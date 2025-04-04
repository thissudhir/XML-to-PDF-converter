# PDF-to-XML Converter Web Application

This is a web application that allows users to upload PDF files, convert them to XML format while preserving the document structure and formatting, and manage the results. The application includes user authentication, file upload functionality, conversion features, and a history of previous conversions.

---

## Features

### **Level 1 (Basic Implementation)**

- User authentication system (login/registration with email and password).
- PDF file upload functionality.
- Basic PDF-to-XML conversion that extracts text content.
- Display the converted XML on the screen.
- Copy and download functionality for the XML.
- Simple list view of previous conversions.
- Store conversion history in a MongoDB database.

### **Level 2 (Intermediate Implementation)**

- Proper authentication using JWT.
- Improved PDF-to-XML conversion that maintains basic structure (paragraphs, headers).
- Multi-page display of the converted document.
- Sidebar navigation for accessing previous conversions.
- Preview of both the original PDF and the converted XML.
- Basic error handling and validation.
- User profile management.

### **Level 3 (Advanced Implementation)**

- Advanced PDF parsing that preserves complex formatting (tables, lists, styling).
- XML output that closely mirrors the PDF's structure and layout.
- Interactive multi-page viewer for both PDFs and converted XML.
- Real-time conversion status updates.
- Advanced filtering and searching of conversion history.
- Comprehensive error handling and edge cases.
- Responsive design for mobile devices.

---

## Technical Stack

### **Frontend**

- **Framework**: [Next.js](https://nextjs.org/)
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **Authentication**: JWT-based authentication

### **Backend**

- **Framework**: [Node.js](https://nodejs.org/) with [Express.js](https://expressjs.com/)
- **File Storage**: MongoDB GridFS for storing uploaded PDFs and converted XML files
- **Authentication**: JWT for secure user sessions
- **PDF Parsing**: `pdf-parse` for extracting text from PDFs
- **XML Generation**: `xmlbuilder` for creating structured XML files

### **Database**

- **Database**: [MongoDB](https://www.mongodb.com/)
- **Schema Management**: Mongoose

---

## Installation and Setup

### **Prerequisites**

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### **Steps to Run the Application**

1. **Clone the Repository**

   ```bash
   git clone https://github.com/thissudhir/XML-to-PDF-converter

   ```

2. **Install backend dependencies**

   `cd backend`  
   `npm install`

3. **Set Up Environment Variables Create .env files in both the backend and frontend directories, Backend .env**

   ```bash
   PORT=
   MONGODB_URL=
    JWT_SECRET=

   ```

# Install frontend dependencies

`cd ../frontend`
`npm install`

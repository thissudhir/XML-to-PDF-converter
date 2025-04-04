const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const xmlbuilder = require('xmlbuilder');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();
// const Grid = require('gridfs-stream');
const { GridFsStorage } = require('multer-gridfs-storage');

// Create Express app
const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB Connection
mongoose
    .connect(process.env.MONGODB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Initialize GridFSBucket
let gfsBucket;
const conn = mongoose.connection;
conn.once('open', () => {
    gfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
        bucketName: 'uploads', // Bucket name for GridFS
    });
});

// Schemas
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

const conversionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    originalFilename: { type: String, required: true },
    pdfPath: { type: String, required: true },
    xmlPath: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);
const Conversion = mongoose.model('Conversion', conversionSchema);

// JWT Authentication Middleware
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header missing' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// Configure GridFS storage for multer
const storage = new GridFsStorage({
    url: process.env.MONGODB_URL,
    file: (req, file) => {
        return {
            filename: `${Date.now()}-${file.originalname}`,
            bucketName: 'uploads', // Bucket name for GridFS
        };
    },
});
const upload = multer({ storage });

// Advanced PDF to XML conversion function
async function convertPdfToXml(fileId, originalFilename) {
    try {
        // Retrieve the PDF file from GridFS
        const chunks = [];
        const pdfStream = gfsBucket.openDownloadStream(fileId);

        for await (const chunk of pdfStream) {
            chunks.push(chunk);
        }
        const dataBuffer = Buffer.concat(chunks);

        // Parse the PDF
        const data = await pdf(dataBuffer);

        // Create the XML structure
        const root = xmlbuilder.create('document', { encoding: 'UTF-8' });

        // Add metadata
        const metadata = root.ele('metadata');
        metadata.ele('fileName', {}, originalFilename);
        metadata.ele('pageCount', {}, data.numpages);
        metadata.ele('author', {}, data.info.Author || 'Unknown');
        metadata.ele('creationDate', {}, data.info.CreationDate || 'Unknown');
        metadata.ele('conversionDate', {}, new Date().toISOString());

        // Process text content
        const content = root.ele('content');
        const lines = data.text.split('\n');
        let currentParagraph = null;

        for (const line of lines) {
            const trimmedLine = line.trim();

            if (trimmedLine === '') {
                currentParagraph = null;
                continue;
            }

            const words = trimmedLine.split(' ');
            if (words.length <= 5 && trimmedLine.length <= 50) {
                content.ele('heading', {}, trimmedLine);
                currentParagraph = null;
            } else {
                if (!currentParagraph) {
                    currentParagraph = content.ele('paragraph');
                }
                currentParagraph.txt(trimmedLine + ' ');
            }
        }

        // Convert to XML string
        const xmlString = root.end({ pretty: true });

        // Save the XML file to MongoDB
        const uploadStream = gfsBucket.openUploadStream(
            `${originalFilename.replace('.pdf', '')}.xml`,
            {
                contentType: 'application/xml',
                metadata: { originalFilename },
            }
        );
        uploadStream.write(xmlString);
        uploadStream.end();

        return new Promise((resolve, reject) => {
            uploadStream.on('finish', (file) => resolve(file._id));
            uploadStream.on('error', (err) => reject(err));
        });
    } catch (error) {
        console.error('PDF conversion error:', error);
        throw new Error('Failed to convert PDF to XML');
    }
}

// Routes

// Register route
app.post('/api/register', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new User({
            email,
            password: hashedPassword,
        });

        await newUser.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login route
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Validate password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET || 'your_jwt_secret_key',
            { expiresIn: '24h' }
        );

        res.json({ token, userId: user._id });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Upload and convert PDF route
app.post('/api/convert', authenticate, upload.single('pdf'), async (req, res) => {
    try {
        console.log('Uploaded file:', req.file);

        if (!req.file) {
            return res.status(400).json({ error: 'No PDF file uploaded' });
        }

        const xmlFileId = await convertPdfToXml(req.file.id, req.file.originalname);

        const newConversion = new Conversion({
            userId: req.user.userId,
            originalFilename: req.file.originalname,
            pdfPath: req.file.id,
            xmlPath: xmlFileId,
        });

        const savedConversion = await newConversion.save();
        console.log('Saved conversion:', savedConversion);

        res.status(202).json({
            message: 'Conversion started',
            status: 'processing',
            conversionId: savedConversion._id,
        });
    } catch (error) {
        console.error('Conversion error:', error);
        res.status(500).json({ error: 'Failed to convert PDF to XML' });
    }
});

// Get conversion status
app.get('/api/conversion/:id', authenticate, async (req, res) => {
    try {
        const conversionId = req.params.id;
        console.log('Fetching conversion with ID:', conversionId);

        const conversion = await Conversion.findOne({
            _id: conversionId,
            userId: req.user.userId,
        });

        if (!conversion) {
            console.log('Conversion not found for ID:', conversionId);
            return res.status(404).json({ error: 'Conversion not found' });
        }

        res.json({
            status: 'completed',
            conversionId: conversion._id,
            originalFilename: conversion.originalFilename,
            createdAt: conversion.createdAt,
        });
    } catch (error) {
        console.error('Get conversion status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get XML result
app.get('/api/conversion/:id/xml', authenticate, async (req, res) => {
    try {
        const conversionId = req.params.id;
        const conversion = await Conversion.findOne({
            _id: conversionId,
            userId: req.user.userId,
        });

        if (!conversion) {
            return res.status(404).json({ error: 'Conversion not found' });
        }

        const readStream = gfs.createReadStream({ _id: conversion.xmlPath });
        res.header('Content-Type', 'application/xml');
        readStream.pipe(res);
    } catch (error) {
        console.error('Get XML error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Download XML file
app.get('/api/conversion/:id/download', authenticate, async (req, res) => {
    try {
        const conversionId = req.params.id;
        const conversion = await Conversion.findOne({
            _id: conversionId,
            userId: req.user.userId,
        });

        if (!conversion) {
            return res.status(404).json({ error: 'Conversion not found' });
        }

        const readStream = gfsBucket.openDownloadStream(conversion.xmlPath);
        res.header(
            'Content-Disposition',
            `attachment; filename="${conversion.originalFilename.replace('.pdf', '')}.xml"`
        );
        readStream.pipe(res);
    } catch (error) {
        console.error('Download XML error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user's conversion history
app.get('/api/conversions', authenticate, async (req, res) => {
    try {
        const conversions = await Conversion.find({ userId: req.user.userId })
            .sort({ createdAt: -1 })
            .select('originalFilename createdAt');

        res.json(conversions);
    } catch (error) {
        console.error('Get conversions error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import morgan from 'morgan';
import sqlite3 from 'sqlite3';
const { verbose } = sqlite3;
const sqlite3Verbose = verbose();
import bcrypt from 'bcryptjs';
import { createServer } from 'http';
import { Server } from 'socket.io';
import multer from 'multer';
import fs from 'fs';

const app = express();
const server = createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

// Multer Storage Setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(express.static(__dirname)); // Serve static HTML files
app.use('/uploads', express.static('uploads'));

// SQLite Database Initialization
const db = new sqlite3Verbose.Database('./kaziforge.db');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        budget INTEGER NOT NULL,
        description TEXT,
        proposals INTEGER DEFAULT 0,
        status TEXT DEFAULT 'active'
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        type TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room TEXT NOT NULL,
        sender TEXT NOT NULL,
        text TEXT NOT NULL,
        type TEXT DEFAULT 'text',
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    db.run(`ALTER TABLE messages ADD COLUMN type TEXT DEFAULT 'text'`, (err) => {});
});

// --- API Routes ---

// Registration Route
app.post('/api/auth/register', async (req, res) => {
    const { email, password, type } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(`INSERT INTO users (email, password, type) VALUES (?, ?, ?)`, [email, hashedPassword, type], function(err) {
            if (err) return res.status(400).json({ success: false, message: 'User already exists' });
            res.json({ success: true, message: 'User registered' });
        });
    } catch (e) { res.status(500).send(); }
});

// Authentication Route
app.post('/api/auth/login', (req, res) => {
    const { email, password, type } = req.body;
    db.get(`SELECT * FROM users WHERE email = ? AND type = ?`, [email, type], async (err, user) => {
        if (err || !user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        
        const match = await bcrypt.compare(password, user.password);
        if (match) {
            res.json({
                success: true,
                user: { email: user.email, type: user.type, token: 'fake-jwt-token-123' }
            });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    });
});

// Get All Users (Admin only simulation)
app.get('/api/users', (req, res) => {
    db.all("SELECT id, email, type FROM users", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get All Jobs
app.get('/api/jobs', (req, res) => {
    db.all("SELECT * FROM jobs ORDER BY id DESC", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Get Message History for a Room
app.get('/api/messages/:room', (req, res) => {
    db.all(`SELECT * FROM messages WHERE room = ? ORDER BY timestamp ASC`, [req.params.room], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// File Upload Route
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json({ filePath: `/uploads/${req.file.filename}`, fileName: req.file.originalname });
});

// Post a New Job
app.post('/api/jobs', (req, res) => {
    const { title, budget, description } = req.body;

    if (!title || !budget) {
        return res.status(400).json({ message: 'Missing fields' });
    }

    const sql = `INSERT INTO jobs (title, budget, description) VALUES (?, ?, ?)`;
    db.run(sql, [title, budget, description], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        const newJob = {
            id: this.lastID,
            title,
            budget,
            description,
            proposals: 0,
            status: 'active'
        };
        io.emit('jobPosted', newJob);
        res.status(201).json(newJob);
    });
});

// Update a Job
app.put('/api/jobs/:id', (req, res) => {
    const { title, budget, description } = req.body;
    const sql = `UPDATE jobs SET title = ?, budget = ?, description = ? WHERE id = ?`;
    db.run(sql, [title, budget, description, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Delete a Job
app.delete('/api/jobs/:id', (req, res) => {
    db.run(`DELETE FROM jobs WHERE id = ?`, req.params.id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Dashboard Redirection (Simple catch-all for routing)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Socket.io Events for Private Messaging
io.on('connection', (socket) => {
    socket.on('joinRoom', (room) => {
        socket.join(room);
    });

    socket.on('sendMessage', (data) => {
        const { room, sender, text, type } = data;
        const msgType = type || 'text';
        db.run(`INSERT INTO messages (room, sender, text, type) VALUES (?, ?, ?, ?)`, [room, sender, text, msgType], function(err) {
            if (!err) {
                io.to(room).emit('newMessage', { sender, text, type: msgType, timestamp: new Date() });
            }
        });
    });
});

server.listen(PORT, () => {
    console.log(`
    🚀 KaziForge Server Running!
    ----------------------------
    Local: http://localhost:${PORT}
    
    Instructions:
    1. Run 'npm install'
    2. Run 'npm start'
    3. Open the browser to see the full-stack integration.
    `);
});
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(cors());

// Підключення до бази даних
const dbPath = path.resolve(__dirname, 'users.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Users DB Error:', err.message);
    } else {
        console.log('Users Service connected to SQLite DB.');
    }
});

// Health Check
app.get('/health', (req, res) => {
    res.json({ service: 'Users Service', status: 'healthy', port: PORT });
});

// Отримати всіх користувачів
app.get('/users', (req, res) => {
    db.all(`SELECT id, username, plan, created_at FROM users`, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ users: rows, total: rows.length });
    });
});

// Створити користувача
app.post('/users', (req, res) => {
    const { username, password, plan } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    db.run(
        `INSERT INTO users (username, password, plan) VALUES (?, ?, ?)`,
        [username.trim(), password, plan || 'Free'],
        function(err) {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            res.status(201).json({ id: this.lastID, username, plan: plan || 'Free' });
        }
    );
});

// Отримати конкретного користувача
app.get('/users/:username', (req, res) => {
    const username = req.params.username;
    db.get(
        `SELECT id, username, plan, created_at FROM users WHERE username = ?`,
        [username.trim()],
        (err, row) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (row) {
                res.json(row);
            } else {
                res.status(404).json({ error: `Користувача '${username}' не знайдено` });
            }
        }
    );
});

app.listen(PORT, () => {
    console.log(`👤 Users Service running on http://localhost:${PORT}`);
});

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3002;

app.use(bodyParser.json());
app.use(cors());

// Підключення до бази даних
const dbPath = path.resolve(__dirname, 'users.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to DB:', err.message);
    } else {
        console.log('Auth Service connected to SQLite DB.');
    }
});

// Створення таблиці користувачів, якщо не існує
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    plan TEXT DEFAULT 'Free',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Health Check
app.get('/health', (req, res) => {
    res.json({ service: 'Auth Service', status: 'healthy', port: PORT });
});

// Реєстрація
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: "Поля 'username' та 'password' обов'язкові" });
    }

    const sql = `INSERT INTO users (username, password, plan) VALUES (?, ?, 'Free')`;
    db.run(sql, [username.trim(), password], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: `Користувач '${username}' вже існує.` });
            }
            return res.status(500).json({ error: 'Помилка реєстрації: ' + err.message });
        }
        res.status(201).json({
            message: 'Реєстрація успішна!',
            userId: this.lastID,
            username: username.trim()
        });
    });
});

// Логін
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: "Поля 'username' та 'password' обов'язкові" });
    }

    const sql = `SELECT id, username, plan, created_at FROM users WHERE username = ? AND password = ?`;
    db.get(sql, [username.trim(), password], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(401).json({ error: 'Невірний логін або пароль' });
        }
        res.json({
            message: 'Вхід успішний!',
            user: row,
            token: `token_${Buffer.from(username).toString('base64')}`
        });
    });
});

app.listen(PORT, () => {
    console.log(`🔐 Auth Service running on http://localhost:${PORT}`);
});

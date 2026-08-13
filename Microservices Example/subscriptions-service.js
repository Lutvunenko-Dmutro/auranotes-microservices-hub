const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3001;

app.use(bodyParser.json());
app.use(cors());

// Підключення до БД
const dbPath = path.resolve(__dirname, 'users.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Subscriptions DB Error:', err.message);
    } else {
        console.log('Subscriptions Service connected to SQLite DB.');
    }
});

// Створення таблиці підписок
db.run(`CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user TEXT NOT NULL,
    targetUser TEXT NOT NULL,
    plan TEXT DEFAULT 'Pro',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Health Check
app.get('/health', (req, res) => {
    res.json({ service: 'Subscriptions Service', status: 'healthy', port: PORT });
});

// Створити або оновити підписку
app.post('/subscriptions', (req, res) => {
    const { user, targetUser, plan } = req.body;
    if (!user) {
        return res.status(400).json({ error: "Поле 'user' обов'язкове" });
    }

    const selectedPlan = plan || targetUser || 'Pro Plan';
    const sql = `INSERT INTO subscriptions (user, targetUser, plan) VALUES (?, ?, ?)`;
    db.run(sql, [user.trim(), selectedPlan, selectedPlan], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        // Також оновлюємо тариф у таблиці users
        db.run(`UPDATE users SET plan = ? WHERE username = ?`, [selectedPlan, user.trim()]);

        res.status(201).json({
            message: `Підписку на '${selectedPlan}' успішно оформлено!`,
            subscriptionId: this.lastID,
            user: user.trim(),
            plan: selectedPlan
        });
    });
});

// Отримати підписки користувача
app.get('/subscriptions/:username', (req, res) => {
    const username = req.params.username;
    db.all(
        `SELECT * FROM subscriptions WHERE user = ? ORDER BY created_at DESC`,
        [username.trim()],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({
                user: username,
                subscriptions: rows,
                activeCount: rows.length
            });
        }
    );
});

app.listen(PORT, () => {
    console.log(`💳 Subscriptions Service running on http://localhost:${PORT}`);
});

const AUTH_URL = 'http://localhost:3002';

document.getElementById('registerForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const alertBox = document.getElementById('alertBox');
    const submitBtn = document.getElementById('submitBtn');
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    alertBox.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Створення акаунту...';

    try {
        // Спроба реєстрації через живий Auth Service
        const response = await fetch(`${AUTH_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            alertBox.className = 'alert alert-success';
            alertBox.textContent = '🎉 Реєстрація успішна! Перенаправляємо на сторінку входу...';
            alertBox.style.display = 'flex';

            // Збережемо також у локальний список для синхронізації
            const localUsers = JSON.parse(localStorage.getItem('users')) || [];
            localUsers.push({ username, password, plan: 'Free' });
            localStorage.setItem('users', JSON.stringify(localUsers));

            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1200);
            return;
        } else {
            throw new Error(data.error || 'Помилка реєстрації');
        }
    } catch (err) {
        // Fallback на localStorage
        console.warn('Auth Service fallback:', err.message);
        const localUsers = JSON.parse(localStorage.getItem('users')) || [];
        if (localUsers.some(u => u.username === username)) {
            alertBox.className = 'alert alert-danger';
            alertBox.textContent = `Користувач '${username}' уже зареєстрований.`;
            alertBox.style.display = 'flex';
        } else {
            localUsers.push({ username, password, plan: 'Free' });
            localStorage.setItem('users', JSON.stringify(localUsers));

            alertBox.className = 'alert alert-success';
            alertBox.textContent = '🎉 Реєстрація успішна! Перенаправляємо...';
            alertBox.style.display = 'flex';

            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1200);
        }
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Зареєструватися →';
    }
});
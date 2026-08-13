const AUTH_URL = 'http://localhost:3002';

document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const alertBox = document.getElementById('alertBox');
    const submitBtn = document.getElementById('submitBtn');
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    alertBox.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Перевірка...';

    try {
        // Спроба входу через живий Auth Service мікросервіс
        const response = await fetch(`${AUTH_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('currentUser', JSON.stringify({
                username: data.user.username,
                plan: data.user.plan || 'Free',
                token: data.token
            }));
            window.location.href = 'notes.html';
            return;
        } else {
            throw new Error(data.error || 'Невірне ім\'я користувача або пароль');
        }
    } catch (err) {
        // Fallback на localStorage якщо мікросервіс тимчасово вимкнено
        console.warn('Auth Service offline, checking local storage fallback:', err.message);
        const localUsers = JSON.parse(localStorage.getItem('users')) || [];
        const localUser = localUsers.find(u => u.username === username && u.password === password);

        if (localUser) {
            localStorage.setItem('currentUser', JSON.stringify({
                username: localUser.username,
                plan: localUser.plan || 'Free'
            }));
            window.location.href = 'notes.html';
        } else {
            alertBox.textContent = err.message.includes('Failed to fetch') 
                ? 'Невірний логін або пароль (також перевірте статус Auth Service).' 
                : err.message;
            alertBox.style.display = 'flex';
        }
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Увійти в систему →';
    }
});

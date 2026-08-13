const SUBS_URL = 'http://localhost:3001';

document.addEventListener('DOMContentLoaded', function() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('currentUser').textContent = currentUser.username;
    updateUIForCurrentPlan(currentUser.plan || 'Free');
});

function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem('currentUser'));
    } catch (e) {
        return null;
    }
}

function updateUIForCurrentPlan(currentPlan) {
    const planBadge = document.getElementById('userPlanBadge');
    planBadge.textContent = currentPlan.toUpperCase();

    const btnFree = document.getElementById('btnPlanFree');
    const btnPro = document.getElementById('btnPlanPro');
    const btnEnt = document.getElementById('btnPlanEnterprise');

    btnFree.textContent = 'Обрати';
    btnPro.textContent = '⚡ Перейти на Pro';
    btnEnt.textContent = 'Оформити VIP';

    if (currentPlan === 'Free' || !currentPlan) {
        btnFree.textContent = '✓ Ваш поточний тариф';
        btnFree.disabled = true;
    } else if (currentPlan.toLowerCase().includes('pro')) {
        btnPro.textContent = '✓ Активний тариф Pro';
        btnPro.disabled = true;
    } else if (currentPlan.toLowerCase().includes('enterprise') || currentPlan.toLowerCase().includes('vip')) {
        btnEnt.textContent = '✓ Активний тариф VIP';
        btnEnt.disabled = true;
    }
}

async function selectPlan(planName) {
    const currentUser = getCurrentUser();
    const alertBox = document.getElementById('alertBox');

    alertBox.style.display = 'none';

    try {
        // Запит до живого Subscriptions Service мікросервісу (:3001)
        const response = await fetch(`${SUBS_URL}/subscriptions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user: currentUser.username,
                targetUser: planName,
                plan: planName
            })
        });

        const data = await response.json();

        // Оновлюємо локальну сесію
        currentUser.plan = planName;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        // Оновлюємо в локальній базі користувачів
        const localUsers = JSON.parse(localStorage.getItem('users')) || [];
        const idx = localUsers.findIndex(u => u.username === currentUser.username);
        if (idx !== -1) {
            localUsers[idx].plan = planName;
            localStorage.setItem('users', JSON.stringify(localUsers));
        }

        alertBox.textContent = `🎉 Вітаємо! Ваш тариф успішно змінено на '${planName}'. Ліміти оновлено!`;
        alertBox.style.display = 'block';

        updateUIForCurrentPlan(planName);

        setTimeout(() => {
            window.location.href = 'notes.html';
        }, 1500);

    } catch (err) {
        console.warn('Subscriptions Service fallback:', err.message);

        // Fallback
        currentUser.plan = planName;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        alertBox.textContent = `🎉 Тариф '${planName}' активовано!`;
        alertBox.style.display = 'block';

        updateUIForCurrentPlan(planName);

        setTimeout(() => {
            window.location.href = 'notes.html';
        }, 1200);
    }
}
document.addEventListener('DOMContentLoaded', function() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('currentUser').textContent = currentUser.username;
    
    // Відображаємо план
    const plan = currentUser.plan || 'Free';
    const planBadge = document.getElementById('userPlanBadge');
    planBadge.textContent = plan.toUpperCase();
    if (plan !== 'Free') {
        planBadge.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    }

    loadNotes();

    // Event Listeners
    document.getElementById('logoutBtn').addEventListener('click', function() {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });

    document.getElementById('addNoteBtn').addEventListener('click', handleAddNote);

    document.getElementById('searchInput').addEventListener('input', function(e) {
        loadNotes(e.target.value.trim().toLowerCase());
    });
});

function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem('currentUser'));
    } catch (e) {
        return null;
    }
}

function getPlanLimit() {
    const user = getCurrentUser();
    const plan = (user && user.plan) ? user.plan.toLowerCase() : 'free';
    if (plan.includes('pro')) return 50;
    if (plan.includes('enterprise') || plan.includes('vip')) return 9999;
    return 5; // Free plan limit
}

function handleAddNote() {
    const noteInput = document.getElementById('noteInput');
    const categorySelect = document.getElementById('noteCategory');
    const text = noteInput.value.trim();
    const category = categorySelect.value;
    const currentUser = getCurrentUser();

    if (!text) {
        alert('Будь ласка, введіть текст нотатки.');
        return;
    }

    const allNotes = JSON.parse(localStorage.getItem('notes')) || [];
    const userNotes = allNotes.filter(n => n.owner === currentUser.username);
    const limit = getPlanLimit();

    if (userNotes.length >= limit) {
        if (confirm(`Ви досягли ліміту (${limit} нотаток) для вашого тарифу ${currentUser.plan || 'Free'}. Бажаєте перейти на Pro тариф?`)) {
            window.location.href = 'subscriptions.html';
        }
        return;
    }

    const newNote = {
        id: Date.now(),
        text: text,
        category: category,
        owner: currentUser.username,
        createdAt: new Date().toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    };

    allNotes.unshift(newNote);
    localStorage.setItem('notes', JSON.stringify(allNotes));

    noteInput.value = '';
    loadNotes();
}

function deleteNote(id) {
    const allNotes = JSON.parse(localStorage.getItem('notes')) || [];
    const filtered = allNotes.filter(n => n.id !== id);
    localStorage.setItem('notes', JSON.stringify(filtered));
    loadNotes();
}

function copyNote(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('📋 Текст нотатки скопійовано!');
    });
}

function loadNotes(searchQuery = '') {
    const currentUser = getCurrentUser();
    const notesList = document.getElementById('notesList');
    const emptyState = document.getElementById('emptyState');
    const allNotes = JSON.parse(localStorage.getItem('notes')) || [];
    
    let userNotes = allNotes.filter(n => n.owner === currentUser.username);

    // Оновлюємо лічильники
    const limit = getPlanLimit();
    document.getElementById('notesCount').textContent = userNotes.length;
    document.getElementById('notesLimit').textContent = limit > 1000 ? '∞' : limit;
    document.getElementById('totalNotesHeader').textContent = userNotes.length;

    if (searchQuery) {
        userNotes = userNotes.filter(n => 
            n.text.toLowerCase().includes(searchQuery) || 
            (n.category && n.category.toLowerCase().includes(searchQuery))
        );
    }

    notesList.innerHTML = '';

    if (userNotes.length === 0) {
        emptyState.style.display = 'block';
        return;
    } else {
        emptyState.style.display = 'none';
    }

    userNotes.forEach(note => {
        const card = document.createElement('div');
        card.className = 'note-card';
        card.innerHTML = `
            <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <span style="font-size: 12px; padding: 3px 8px; border-radius: 6px; background: rgba(99, 102, 241, 0.15); color: #818cf8; font-weight: 600;">
                        ${note.category || '💡 Ідеї'}
                    </span>
                    <span style="font-size: 11px; color: var(--text-muted);">${note.createdAt || ''}</span>
                </div>
                <div class="note-content">${escapeHtml(note.text)}</div>
            </div>
            <div class="note-footer">
                <span>ID: #${String(note.id).slice(-4)}</span>
                <div class="note-actions">
                    <button class="btn-icon" onclick="copyNote('${escapeForAttr(note.text)}')" title="Скопіювати текст">📋</button>
                    <button class="btn-icon" onclick="deleteNote(${note.id})" title="Видалити">🗑️</button>
                </div>
            </div>
        `;
        notesList.appendChild(card);
    });
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function escapeForAttr(str) {
    return str.replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, ' ');
}
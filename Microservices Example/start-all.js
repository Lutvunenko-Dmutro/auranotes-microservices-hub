const { fork } = require('child_process');
const path = require('path');

console.log('🚀 Launching Aura Microservices Cluster...');

const services = [
    { name: 'Auth Service', file: 'auth-service.js', port: 3002 },
    { name: 'Users Service', file: 'users-service.js', port: 3000 },
    { name: 'Subscriptions Service', file: 'subscriptions-service.js', port: 3001 }
];

services.forEach(s => {
    const child = fork(path.resolve(__dirname, s.file));
    child.on('error', (err) => console.error(`❌ [${s.name}] Error:`, err));
    child.on('exit', (code) => {
        if (code !== 0) console.log(`⚠️ [${s.name}] Exited with code ${code}`);
    });
});

console.log('✅ All microservices spawned successfully!');
console.log('👉 Dashboard: Open microservices.html in your browser.');

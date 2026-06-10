const clients = new Set();

function addClient(res) {
    clients.add(res);
    res.on('close', () => clients.delete(res));
}

function broadcast() {
    const msg = 'data: {}\n\n';
    clients.forEach(res => {
        try { res.write(msg); } catch(e) { clients.delete(res); }
    });
}

// Heartbeat: named event so clients can track liveness
setInterval(() => {
    clients.forEach(res => {
        try { res.write('event: ping\ndata: {}\n\n'); } catch(e) { clients.delete(res); }
    });
}, 5000);

module.exports = { addClient, broadcast };

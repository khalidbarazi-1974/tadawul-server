(function () {
    const ID       = 'conn-loss-banner';
    const INTERVAL = 10000; // ping every 10 s

    window.showConnectionWarning = function () {
        if (document.getElementById(ID)) return;
        const b = document.createElement('div');
        b.id = ID;
        b.innerHTML = '&#9888; انقطع الاتصال بالخادم &mdash; جاري إعادة الاتصال&hellip;';
        Object.assign(b.style, {
            position:   'fixed',
            top:        '0',
            left:       '0',
            width:      '100%',
            background: '#c0392b',
            color:      '#fff',
            textAlign:  'center',
            padding:    '13px 16px',
            zIndex:     '99999',
            fontSize:   '15px',
            fontWeight: 'bold',
            direction:  'rtl',
            boxSizing:  'border-box',
        });
        document.body.prepend(b);
    };

    window.hideConnectionWarning = function () {
        const el = document.getElementById(ID);
        if (el) el.remove();
    };

    async function ping() {
        try {
            const r = await fetch('/api/ping', {
                cache:  'no-store',
                signal: AbortSignal.timeout(5000),
            });
            if (r.ok) hideConnectionWarning();
            else      showConnectionWarning();
        } catch {
            showConnectionWarning();
        }
    }

    setInterval(ping, INTERVAL);

    // Ping immediately when the user switches back to the tab (e.g. after PC wake)
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') ping();
    });
})();

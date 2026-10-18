(() => {
    const existing = document.getElementById('reels-overlay-root');
    if (existing) existing.remove();
    const existingFinal = document.getElementById('reels-final-card');
    if (existingFinal) existingFinal.remove();

    const container = document.createElement('div');
    container.id = 'reels-overlay-root';
    container.style.cssText = `
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 99990;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 95px 36px 130px;
        box-sizing: border-box;
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
    `;

    container.innerHTML = `
        <!-- Top Hook Banner -->
        <div id="reels-top-banner" style="
            background: rgba(10, 15, 29, 0.94);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 2px solid rgba(245, 158, 11, 0.65);
            border-radius: 26px;
            padding: 20px 26px;
            box-shadow: 0 15px 40px rgba(0,0,0,0.7), 0 0 30px rgba(245, 158, 11, 0.35);
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 10px;
            transition: all 0.3s ease;
        ">
            <span id="reels-badge" style="
                background: linear-gradient(135deg, #f59e0b, #d97706);
                color: #000;
                font-weight: 900;
                font-size: 20px;
                padding: 6px 22px;
                border-radius: 999px;
                text-transform: uppercase;
                letter-spacing: 1.5px;
            ">🔥 3D BİLİŞİM LABORATUVARI</span>
            <h2 id="reels-title" style="
                color: #ffffff;
                font-size: 32px;
                font-weight: 900;
                margin: 0;
                line-height: 1.25;
                text-shadow: 0 2px 12px rgba(0,0,0,0.6);
            ">Bilgisayar donanımlarını 3D incelemeye ne dersin?</h2>
        </div>

        <!-- Bottom Subtitle Banner -->
        <div id="reels-bottom-banner" style="
            background: rgba(15, 23, 42, 0.96);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 2px solid rgba(99, 102, 241, 0.55);
            border-radius: 24px;
            padding: 16px 24px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            transition: all 0.3s ease;
        ">
            <p id="reels-sub" style="
                color: #e2e8f0;
                font-size: 23px;
                font-weight: 700;
                margin: 0;
                line-height: 1.3;
            ">Öğrencilerin deneyimleyebileceği interaktif laboratuvar!</p>
        </div>
    `;

    // Final Card appended directly to body
    const finalCard = document.createElement('div');
    finalCard.id = 'reels-final-card';
    finalCard.style.cssText = `
        position: fixed;
        inset: 0;
        width: 100vw;
        height: 100vh;
        z-index: 999999;
        background: radial-gradient(circle at center, #1e1b4b 0%, #030712 90%);
        display: none;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 60px 40px;
        box-sizing: border-box;
        gap: 28px;
        pointer-events: auto;
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
    `;

    finalCard.innerHTML = `
        <style>
            @keyframes ctaPulse {
                0%, 100% { transform: scale(1); box-shadow: 0 0 35px rgba(245, 158, 11, 0.5); }
                50% { transform: scale(1.04); box-shadow: 0 0 60px rgba(245, 158, 11, 0.85); }
            }
            @keyframes logoFloat {
                0%, 100% { transform: translateY(0px) rotate(0deg); }
                50% { transform: translateY(-8px) rotate(-2deg); }
            }
        </style>
        <div style="
            width: 130px;
            height: 130px;
            background: linear-gradient(135deg, #6366f1, #a855f7, #ec4899);
            border-radius: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 60px rgba(168, 85, 247, 0.7);
            font-size: 68px;
            animation: logoFloat 2.5s ease-in-out infinite;
        ">💻</div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
            <span style="
                color: #fbbf24;
                font-size: 24px;
                font-weight: 900;
                letter-spacing: 2.5px;
                text-transform: uppercase;
            ">ÖĞRETMEN BOZOK SUNAR</span>
            <h1 style="
                color: #ffffff;
                font-size: 52px;
                font-weight: 900;
                margin: 0;
                line-height: 1.15;
            ">Donanım Laboratuvarı’nı<br/><span style='color:#38bdf8;'>Keşfet!</span></h1>
        </div>
        
        <div style="
            background: rgba(255,255,255,0.08);
            border: 2px solid rgba(56, 189, 248, 0.5);
            padding: 20px 45px;
            border-radius: 26px;
            display: flex;
            align-items: center;
            gap: 14px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5), 0 0 30px rgba(56, 189, 248, 0.2);
        ">
            <span style="font-size: 32px;">🌐</span>
            <span style="color: #67e8f9; font-size: 38px; font-weight: 800; letter-spacing: 1.5px;">donanim.vercel.app</span>
        </div>

        <div style="
            background: linear-gradient(90deg, #f59e0b, #ef4444);
            color: #fff;
            font-size: 25px;
            font-weight: 900;
            padding: 20px 40px;
            border-radius: 999px;
            margin-top: 15px;
            letter-spacing: 0.5px;
            animation: ctaPulse 1.8s ease-in-out infinite;
        ">
            🚀 Kaydet & Bilişim Öğretmeni Arkadaşınla Paylaş!
        </div>
    `;

    document.body.appendChild(container);
    document.body.appendChild(finalCard);

    window.setReelsText = (badge, title, sub) => {
        const b = document.getElementById('reels-badge');
        const t = document.getElementById('reels-title');
        const s = document.getElementById('reels-sub');
        if (b) b.textContent = badge;
        if (t) t.textContent = title;
        if (s) s.textContent = sub;
    };

    window.showFinalCard = () => {
        container.style.display = 'none';
        finalCard.style.display = 'flex';
    };
})();

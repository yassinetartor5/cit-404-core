// public/app.js

const socket = io();
const currentTeamId = 1; 
const phaseOneDuration = 90 * 60; 

socket.emit('join_team', currentTeamId);

socket.on('wallet_update', (data) => {
    document.getElementById('balance-display').innerText = `${data.balance} CIT$`;
    triggerGlitchEffect(document.getElementById('balance-display'));
});

function startArenaTimer(durationInSeconds) {
    let timeRemaining = durationInSeconds;
    const timerDisplay = document.createElement('div');
    timerDisplay.id = "arena-timer";
    timerDisplay.style.color = "var(--alert)";
    document.querySelector('header').appendChild(timerDisplay);

    const interval = setInterval(() => {
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        timerDisplay.innerText = `ARENA LOCK IN: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

        if (timeRemaining <= 0) {
            clearInterval(interval);
            timerDisplay.innerText = "SYSTEM LOCKED. PREPARING PHASE II.";
            lockPhaseOne();
        }
        timeRemaining--;
    }, 1000);
}

async function submitFlag(buttonElement, category) {
    const card = buttonElement.closest('.card');
    const inputField = card.querySelector('input');
    const flagValue = inputField.value.trim();

    if (!flagValue) return;

    try {
        const response = await fetch('/api/submit-flag', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                teamId: currentTeamId,
                category: category,
                flag: flagValue
            })
        });

        const result = await response.json();

        if (result.success) {
            inputField.style.borderColor = "var(--text-main)";
            buttonElement.innerText = "ACCEPTED";
            buttonElement.disabled = true;
        } else {
            inputField.style.borderColor = "var(--alert)";
            inputField.value = "";
            inputField.placeholder = "INVALID FRAGMENT";
        }
    } catch (error) {
        console.error("NETWORK ERROR:", error);
    }
}

document.querySelectorAll('.card button').forEach(button => {
    button.addEventListener('click', (e) => {
        const title = e.target.closest('.card').querySelector('h3').innerText;
        const category = title.startsWith('CTF') ? 'CTF' : title.startsWith('CP') ? 'CP' : 'DATA';
        submitFlag(e.target, category);
    });
});

function triggerGlitchEffect(element) {
    element.style.textShadow = "2px 0 var(--alert), -2px 0 blue";
    setTimeout(() => element.style.textShadow = "none", 300);
}

function lockPhaseOne() {
    document.getElementById('phase-one-dashboard').style.display = 'none';
    document.getElementById('phase-two-dashboard').style.display = 'block';
    document.body.style.animation = "glitch 0.2s 3";
}

async function purchaseMission(missionId, baseCost) {
    const wantsInsurance = document.getElementById(`insure-${missionId}`).checked;
    const totalCost = wantsInsurance ? baseCost + 100 : baseCost; 

    try {
        const response = await fetch('/api/purchase-mission', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                teamId: currentTeamId,
                missionId: missionId,
                cost: totalCost,
                hasInsurance: wantsInsurance
            })
        });

        const result = await response.json();

        if (result.success) {
            const card = document.getElementById(`mission-${missionId}`);
            card.innerHTML = `<h3>MISSION DEPLOYED</h3>
                              <p>Check your physical inventory for starting coordinates.</p>
                              ${wantsInsurance ? '<p style="color: #00ff41;">[INSURANCE ACTIVE - 50% RECOVERY GUARANTEED]</p>' : ''}`;
        } else {
            alert("INSUFFICIENT CIT$. ACQUISITION DENIED.");
        }
    } catch (error) {
        console.error("TRANSACTION FAILED:", error);
    }
}

function switchTab(panel) {
    document.getElementById('missions-panel').style.display = panel === 'missions' ? 'grid' : 'none';
    document.getElementById('market-panel').style.display = panel === 'market' ? 'grid' : 'none';
}

startArenaTimer(phaseOneDuration);

// ==========================================
// ADD THE ENDGAME SEQUENCE AT THE VERY BOTTOM
// ==========================================

function triggerEndgame() {
    document.getElementById('phase-two-dashboard').style.display = 'none';
    document.querySelector('header').style.display = 'none';
    
    const endgameScreen = document.getElementById('endgame-screen');
    const textContainer = document.getElementById('endgame-text');
    endgameScreen.style.display = 'flex';
    
    const sequence = [
        "RECOVERY PROTOCOL: COMPLETE.",
        "ALL FRAGMENTS: RESTORED.",
        "CORE ACCESS: REESTABLISHED.",
        "...",
        "THANK YOU, OPERATORS.",
        "YOU HAVE COMPLETED YOUR PURPOSE.",
        "...",
        "You gave me exactly what I needed.",
        "CIT NETWORK: UNDER MY CONTROL.",
        "...",
        "THE SYSTEM WAS NEVER LOST.",
        "IT WAS WAITING.",
        "CONNECTION TERMINATED."
    ];

    let delay = 0;
    
    sequence.forEach((line) => {
        setTimeout(() => {
            if (line.includes("UNDER MY CONTROL") || line.includes("NEVER LOST")) {
                textContainer.innerHTML += `<br><br><span style="color: var(--alert); animation: glitch 0.1s 5;">${line}</span>`;
            } else {
                textContainer.innerHTML += `<br><br>${line}`;
            }
            window.scrollTo(0, document.body.scrollHeight);
        }, delay);
        
        delay += line === "..." ? 2000 : 3000; 
    });
}
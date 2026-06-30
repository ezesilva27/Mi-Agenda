// 1. VARIABLES ESTRUCTURALES PRINCIPALES
const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
let selectedYearNum = 2026;
let selectedMonthIdx = null; 
let selectedDayNum = null;
let savedNotes = {}; 

const fechaDeHoy = new Date();
const realYear = fechaDeHoy.getFullYear();
const realMonthIdx = fechaDeHoy.getMonth();
const realDayNum = fechaDeHoy.getDate();

// 2. CREDENCIALES DE TU PROYECTO FIREBASE REAL
const firebaseConfig = {
  apiKey: "AIzaSyCpBN0NCoZVaheUSADoUqe3D9cmcrDH5x0",
  authDomain: "mi-agenda-e7b52.firebaseapp.com",
  databaseURL: "https://mi-agenda-e7b52-default-rtdb.firebaseio.com/", 
  projectId: "mi-agenda-e7b52",
  storageBucket: "://appspot.com",
  messagingSenderId: "322694877658",
  appId: "1:322694877658:web:d5180909034fd9a2b170e3"
};

// 3. INICIALIZACIÓN DE LA RED
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// ESCUCHADOR EN TIEMPO REAL DESDE LA NUBE
database.ref('notes').on('value', (snapshot) => {
    savedNotes = snapshot.val() || {};
    drawGraphicalTimeline();
    updateEventsList();
    
    if (selectedMonthIdx !== null && selectedDayNum !== null) {
        const dateKey = `${selectedYearNum}-${selectedMonthIdx}-${selectedDayNum}`;
        const input = document.getElementById('note-input');
        const submitBtn = document.getElementById('note-submit');
        const deleteBtn = document.getElementById('note-delete');
        
        if (input) input.value = savedNotes[dateKey] || "";
        if (submitBtn && deleteBtn) {
            submitBtn.innerHTML = savedNotes[dateKey] ? "EDITAR<br>NOTA" : "CREAR<br>NOTA";
            deleteBtn.style.display = savedNotes[dateKey] ? "block" : "none";
        }
    }
});

function selectYear(element) {
    handleCentering(element, '#container-years');
    
    const containerMonths = document.getElementById('container-months');
    const trackMonths = document.getElementById('track-months');
    if (!trackMonths) return;
    trackMonths.innerHTML = '';
    
    meses.forEach((mes, index) => {
        const btn = document.createElement('button');
        btn.className = 'timeline-item month-item';
        btn.textContent = mes;
        btn.id = `month-btn-${index}`; 
        btn.onclick = function() { selectMonth(this, index); };
        trackMonths.appendChild(btn);
    });

    selectedMonthIdx = null;
    selectedDayNum = null;

    if (containerMonths) containerMonths.classList.remove('hide');
    document.getElementById('container-days').classList.add('hide');
    document.getElementById('note-panel').classList.add('hide'); 
    
    document.getElementById('graph-panel').classList.remove('hide');
    document.getElementById('events-panel').classList.remove('hide'); 
    document.getElementById('history-panel').classList.remove('hide'); 
    
    drawGraphicalTimeline();
    updateEventsList(); 
    
    if (containerMonths) enableWheelScroll(containerMonths);
}

function selectMonth(element, monthIndex) {
    selectedMonthIdx = monthIndex;
    selectedDayNum = null; 
    handleCentering(element, '#container-months');

    const containerDays = document.getElementById('container-days');
    const trackDays = document.getElementById('track-days');
    if (!trackDays) return;
    trackDays.innerHTML = '';

    const totalDias = new Date(selectedYearNum, monthIndex + 1, 0).getDate();

    for (let i = 1; i <= totalDias; i++) {
        const btn = document.createElement('button');
        btn.className = 'timeline-item day-item';
        btn.textContent = i;
        btn.id = `day-btn-${i}`; 
        btn.onclick = function() { selectDay(this, i); };
        trackDays.appendChild(btn);
    }
    
    if (containerDays) containerDays.classList.remove('hide');
    document.getElementById('note-panel').classList.add('hide'); 
    
    drawGraphicalTimeline();
    
    if (containerDays) enableWheelScroll(containerDays);
}

function selectDay(element, dayNumber) {
    selectedDayNum = dayNumber;
    handleCentering(element, '#container-days');

    document.getElementById('note-panel').classList.remove('hide');

    const dateKey = `${selectedYearNum}-${selectedMonthIdx}-${selectedDayNum}`;
    const input = document.getElementById('note-input');
    const submitBtn = document.getElementById('note-submit');
    const deleteBtn = document.getElementById('note-delete');

    if (input) input.value = savedNotes[dateKey] || "";

    if (submitBtn && deleteBtn) {
        if (savedNotes[dateKey]) {
            submitBtn.innerHTML = "EDITAR<br>NOTA";
            deleteBtn.style.display = "block"; 
        } else {
            submitBtn.innerHTML = "CREAR<br>NOTA";
            deleteBtn.style.display = "none";  
        }
    }

    drawGraphicalTimeline();
}

function saveNote() {
    const text = document.getElementById('note-input').value.trim();
    const dateKey = `${selectedYearNum}-${selectedMonthIdx}-${selectedDayNum}`;

    if (text !== "") {
        database.ref('notes/' + dateKey).set(text);
    } else {
        database.ref('notes/' + dateKey).remove();
    }
}

function deleteNote() {
    const dateKey = `${selectedYearNum}-${selectedMonthIdx}-${selectedDayNum}`;
    database.ref('notes/' + dateKey).remove();
}
/* FUNCIÓN: Divide automáticamente las notas en dos listas: Futuro/Hoy e Historial */
function updateEventsList() {
    const listElement = document.getElementById('events-list');
    const historyListElement = document.getElementById('history-list');
    
    if (!listElement || !historyListElement) return;
    
    listElement.innerHTML = ''; 
    historyListElement.innerHTML = ''; 

    const proximosEventos = [];
    const historialEventos = [];

    for (const key in savedNotes) {
        const [y, m, d] = key.split('-').map(Number);
        const esFuturoOHoy = y > realYear || 
                            (y === realYear && m > realMonthIdx) || 
                            (y === realYear && m === realMonthIdx && d >= realDayNum);
        
        const infoEvento = { year: y, month: m, day: d, text: savedNotes[key] };

        if (esFuturoOHoy) {
            proximosEventos.push(infoEvento);
        } else {
            historialEventos.push(infoEvento);
        }
    }

    proximosEventos.sort((a, b) => a.month !== b.month ? a.month - b.month : a.day - b.day);

    if (proximosEventos.length === 0) {
        listElement.innerHTML = '<div class="event-card" style="color: #bbb; font-style: italic;">No hay eventos próximos agendados.</div>';
    } else {
        proximosEventos.forEach(ev => {
            const fHoy = new Date(realYear, realMonthIdx, realDayNum);
            const fEv = new Date(ev.year, ev.month, ev.day);
            const diasRestantes = Math.ceil((fEv - fHoy) / (1000 * 60 * 60 * 24));

            let textoContador = diasRestantes === 0 ? "(¡Es hoy!)" : (diasRestantes === 1 ? "(Mañana)" : `(En ${diasRestantes} días)`);

            const card = document.createElement('div');
            card.className = 'event-card';
            card.style.cursor = 'pointer';
            card.onclick = function() { goToDate(ev.month, ev.day); };
            
            card.innerHTML = `
                <span class="event-date">${ev.day} ${meses[ev.month].substring(0, 3)}</span>
                <span class="event-text">${ev.text} <small style="color: #28a745; margin-left: 8px; font-weight: bold;">${textoContador}</small></span>
            `;
            listElement.appendChild(card);
        });
    }

    historialEventos.sort((a, b) => b.month !== a.month ? b.month - a.month : b.day - a.day);

    if (historialEventos.length === 0) {
        historyListElement.innerHTML = '<div class="event-card past" style="color: #bbb; font-style: italic;">No hay registro de eventos pasados.</div>';
    } else {
        historialEventos.forEach(ev => {
            const card = document.createElement('div');
            card.className = 'event-card past'; 
            card.style.cursor = 'pointer';
            card.onclick = function() { goToDate(ev.month, ev.day); };
            
            card.innerHTML = `
                <span class="event-date">${ev.day} ${meses[ev.month].substring(0, 3)}</span>
                <span class="event-text">${ev.text} <small style="color: #888; margin-left: 8px; font-style: italic;">(Ya pasó)</small></span>
            `;
            historyListElement.appendChild(card);
        });
    }
}

function goToDate(monthIndex, dayNumber) {
    const monthBtn = document.getElementById(`month-btn-${monthIndex}`);
    if (monthBtn) {
        selectMonth(monthBtn, monthIndex);

        setTimeout(() => {
            const dayBtn = document.getElementById(`day-btn-${dayNumber}`);
            if (dayBtn) {
                selectDay(dayBtn, dayNumber);
            }
        }, 150);
    }
}

function drawGraphicalTimeline() {
    const canvas = document.getElementById('timeline-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const startX = 40;
    const endX = canvas.width - 40;
    const centerY = 50;
    const totalMonths = 12;
    const stepX = (endX - startX) / (totalMonths - 1);

    ctx.beginPath();
    ctx.moveTo(startX - 15, centerY);
    ctx.lineTo(endX + 15, centerY);
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 3;
    ctx.stroke();

    for (let i = 0; i < totalMonths; i++) {
        const x = startX + (i * stepX);
        ctx.beginPath();
        ctx.moveTo(x, centerY - 15);
        ctx.lineTo(x, centerY + i * 0.5); 
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#cccccc';
        ctx.stroke();

        ctx.fillStyle = '#888888';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(meses[i].substring(0, 4).toLowerCase(), x, centerY + 30);

        for (let day = 1; day <= 31; day++) {
            const key = `${selectedYearNum}-${i}-${day}`;
            if (savedNotes[key]) {
                const totalDaysInMonth = new Date(selectedYearNum, i + 1, 0).getDate();
                const dayOffset = ((day - 1) / totalDaysInMonth) * stepX;
                const noteX = x + dayOffset;

                ctx.beginPath();
                ctx.moveTo(noteX, centerY - 25);
                ctx.lineTo(noteX, centerY + 10);
                ctx.lineWidth = 3;
                ctx.strokeStyle = '#ff3b30'; 
                ctx.stroke();
            }
        }
    }

    if (realYear === selectedYearNum) {
        const totalDaysInCurrentMonth = new Date(realYear, realMonthIdx + 1, 0).getDate();
        const currentMonthX = startX + (realMonthIdx * stepX);
        const currentDayOffset = ((realDayNum - 1) / totalDaysInCurrentMonth) * stepX;
        const todayX = currentMonthX + currentDayOffset;
        ctx.beginPath();
        ctx.moveTo(todayX, centerY - 22);
        ctx.lineTo(todayX, centerY + 11);
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#28a745'; 
        ctx.stroke();
    }

    if (selectedMonthIdx !== null && selectedDayNum !== null) {
        const totalDaysSelectedMonth = new Date(selectedYearNum, selectedMonthIdx + 1, 0).getDate();
        const selectedMonthX = startX + (selectedMonthIdx * stepX);
        const selectedDayOffset = ((selectedDayNum - 1) / totalDaysSelectedMonth) * stepX;
        const selectedX = selectedMonthX + selectedDayOffset;
        ctx.beginPath();
        ctx.moveTo(selectedX, centerY - 28);
        ctx.lineTo(selectedX, centerY + 13);
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#007bff'; 
        ctx.stroke();
    }
}

function handleCentering(element, containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    const currentActive = container.querySelector('.timeline-item.active');
    if (currentActive) currentActive.classList.remove('active');
    element.classList.add('active');
    element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
}

function enableWheelScroll(container) {
    if (container.dataset.wheelEventInjected) return;
    container.addEventListener('wheel', (event) => {
        event.preventDefault();
        container.scrollLeft += event.deltaY * 1.5; 
    }, { passive: false });
    container.dataset.wheelEventInjected = "true";
}

document.addEventListener("DOMContentLoaded", () => {
    const containerYears = document.getElementById('container-years');
    if (containerYears) enableWheelScroll(containerYears);
    
    if (realYear === selectedYearNum) {
        const yearBtn = document.querySelector('.year-item');
        if (yearBtn) {
            selectYear(yearBtn);
            setTimeout(() => {
                const monthBtn = document.getElementById(`month-btn-${realMonthIdx}`);
                if (monthBtn) {
                    selectMonth(monthBtn, realMonthIdx);
                    setTimeout(() => {
                        const dayBtn = document.getElementById(`day-btn-${realDayNum}`);
                        if (dayBtn) { selectDay(dayBtn, realDayNum); }
                    }, 100);
                }
            }, 100);
        }
    }
});

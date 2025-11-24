// --- CONFIGURATION & CONSTANTS ---
const MOON_PHASES = [
    { name: 'Nouvelle Lune', icon: 'moon', phase: 0 },
    { name: 'Premier Croissant', icon: 'moon', phase: 0.125 },
    { name: 'Premier Quartier', icon: 'moon', phase: 0.25 },
    { name: 'Lune Gibbeuse', icon: 'moon', phase: 0.375 },
    { name: 'Pleine Lune', icon: 'moon', phase: 0.5 },
    { name: 'Lune Gibbeuse', icon: 'moon', phase: 0.625 },
    { name: 'Dernier Quartier', icon: 'moon', phase: 0.75 },
    { name: 'Dernier Croissant', icon: 'moon', phase: 0.875 }
];

const WEEK_DAYS = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

// --- STATE ---
let state = {
    viewDate: new Date(),
    selectedDate: new Date(),
    coords: { lat: 48.8566, lon: 2.3522, name: "Paris" },
    isDarkMode: true,
    monthEvents: {} // Cache for the current month's events
};

// --- HELPER FUNCTIONS ---

function calculateMonthEvents(year, month) {
    const events = {}; // Key: "YYYY-M-D", Value: Array of objects
    const startDate = new Date(year, month, 1);
    // Go a bit into the next month to cover the grid
    const endDate = new Date(year, month + 2, 1); 

    function addEvent(date, event) {
        const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        if (!events[key]) events[key] = [];
        events[key].push(event);
    }

    // 1. Moon Phases
    for (let phase = 0; phase < 360; phase += 90) {
        let d = startDate;
        while (d < endDate) {
            const m = Astronomy.SearchMoonPhase(phase, d, 40);
            if (!m || m.date >= endDate) break;
            let name = '';
            if (phase === 0) name = 'Nouvelle Lune';
            else if (phase === 90) name = 'Premier Quartier';
            else if (phase === 180) name = 'Pleine Lune';
            else if (phase === 270) name = 'Dernier Quartier';
            
            addEvent(m.date, { type: 'Phase', name, icon: 'moon', time: m.date });
            d = new Date(m.date.getTime() + 24 * 3600 * 1000);
        }
    }

    // 2. Moon Apsis (Perigee/Apogee)
    let d = startDate;
    while (d < endDate) {
        const apsis = Astronomy.SearchLunarApsis(d);
        if (!apsis || apsis.date >= endDate) break;
        const name = apsis.dist_km < 370000 ? 'Périgée Lunaire' : 'Apogée Lunaire';
        addEvent(apsis.date, { type: 'Apsis', name, icon: 'move-vertical', time: apsis.date });
        d = new Date(apsis.date.getTime() + 24 * 3600 * 1000);
    }

    // 3. Seasons
    const seasons = Astronomy.Seasons(year);
    const seasonEvents = [
        { date: seasons.mar_equinox, name: 'Équinoxe de Printemps' },
        { date: seasons.jun_solstice, name: 'Solstice d\'Été' },
        { date: seasons.sep_equinox, name: 'Équinoxe d\'Automne' },
        { date: seasons.dec_solstice, name: 'Solstice d\'Hiver' }
    ];
    for (const s of seasonEvents) {
        if (s.date >= startDate && s.date < endDate) {
            addEvent(s.date, { type: 'Season', name: s.name, icon: 'sun', time: s.date });
        }
    }

    // 4. Planet Oppositions (Superior Planets) & Conjunctions
    const planets = [
        { name: 'Mars', id: Astronomy.Body.Mars },
        { name: 'Jupiter', id: Astronomy.Body.Jupiter },
        { name: 'Saturne', id: Astronomy.Body.Saturn },
        { name: 'Uranus', id: Astronomy.Body.Uranus },
        { name: 'Neptune', id: Astronomy.Body.Neptune }
    ];

    for (const p of planets) {
        // Opposition (Relative Longitude 180)
        let d = startDate;
        while (d < endDate) {
            const opp = Astronomy.SearchRelativeLongitude(p.id, 180, d);
            if (!opp || opp.date >= endDate) break;
            addEvent(opp.date, { type: 'Opposition', name: `Opposition ${p.name}`, icon: 'arrow-left-right', time: opp.date });
            d = new Date(opp.date.getTime() + 24 * 3600 * 1000);
        }
        // Conjunction (Relative Longitude 0)
        d = startDate;
        while (d < endDate) {
            const conj = Astronomy.SearchRelativeLongitude(p.id, 0, d);
            if (!conj || conj.date >= endDate) break;
            addEvent(conj.date, { type: 'Conjunction', name: `Conjonction ${p.name}`, icon: 'git-merge', time: conj.date });
            d = new Date(conj.date.getTime() + 24 * 3600 * 1000);
        }
    }

    // 5. Max Elongation (Mercury, Venus)
    const innerPlanets = [
        { name: 'Mercure', id: Astronomy.Body.Mercury },
        { name: 'Vénus', id: Astronomy.Body.Venus }
    ];
    for (const p of innerPlanets) {
        let d = startDate;
        while (d < endDate) {
            const elon = Astronomy.SearchMaxElongation(p.id, d);
            if (!elon || elon.date >= endDate) break;
            addEvent(elon.date, { type: 'Elongation', name: `Elong. Max ${p.name}`, icon: 'maximize-2', time: elon.date });
            d = new Date(elon.date.getTime() + 24 * 3600 * 1000);
        }
    }

    // 6. Planet-Planet & Moon-Planet Conjunctions (Iterative Check)
    const brightBodies = [
        { name: 'Lune', id: Astronomy.Body.Moon },
        { name: 'Mercure', id: Astronomy.Body.Mercury },
        { name: 'Vénus', id: Astronomy.Body.Venus },
        { name: 'Mars', id: Astronomy.Body.Mars },
        { name: 'Jupiter', id: Astronomy.Body.Jupiter },
        { name: 'Saturne', id: Astronomy.Body.Saturn }
    ];

    let iterDate = new Date(startDate);
    while (iterDate < endDate) {
        // Check pairs
        for (let i = 0; i < brightBodies.length; i++) {
            for (let j = i + 1; j < brightBodies.length; j++) {
                const body1 = brightBodies[i];
                const body2 = brightBodies[j];
                
                // Skip Moon-Moon obviously
                
                const sep = Astronomy.Separation(body1.id, body2.id, iterDate);
                if (sep.angle < 4.0) {
                    // Check visibility (elongation from Sun)
                    const el1 = Astronomy.Elongation(body1.id, iterDate);
                    const el2 = Astronomy.Elongation(body2.id, iterDate);
                    
                    if (el1.elongation > 15 && el2.elongation > 15) {
                        addEvent(new Date(iterDate), {
                            type: 'Conjunction',
                            name: `Conj. ${body1.name}-${body2.name}`,
                            icon: 'git-merge',
                            time: new Date(iterDate)
                        });
                    }
                }
            }
        }
        
        // 7. Venus Peak Magnitude (Approximate via Elongation check or just skip for now as it's complex)
        // We stick to the main events for now.

        iterDate.setDate(iterDate.getDate() + 1);
    }

    return events;
}

function getMoonPhase(date) {
    const phase = Astronomy.MoonPhase(date); // 0 to 360
    const illumination = Astronomy.Illumination(Astronomy.Body.Moon, date).mag_ratio * 100;
    
    const normalizedPhase = phase / 360;
    let closest = MOON_PHASES[0];
    let minDiff = 1;
    
    for (const p of MOON_PHASES) {
        let diff = Math.abs(normalizedPhase - p.phase);
        if (diff > 0.5) diff = 1 - diff;
        if (diff < minDiff) {
            minDiff = diff;
            closest = p;
        }
    }
    
    return {
        phase: phase,
        illumination: Math.round(illumination),
        name: closest.name
    };
}

function getGridEvents(date) {
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    // Copy cached events
    return [...(state.monthEvents[key] || [])];
}

function getEventsForDate(date, lat, lon) {
    const events = [];
    const observer = new Astronomy.Observer(lat, lon, 0);
    
    // 1. Sun Rise/Set
    const sunRise = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, +1, date, 1);
    const sunSet = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, -1, date, 1);
    
    if (sunRise) events.push({ type: 'Ephemeris', name: 'Lever Soleil', time: sunRise.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), icon: 'sun', action: 'Lever' });
    if (sunSet) events.push({ type: 'Ephemeris', name: 'Coucher Soleil', time: sunSet.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), icon: 'sun', action: 'Coucher' });

    // 2. Moon Rise/Set
    const moonRise = Astronomy.SearchRiseSet(Astronomy.Body.Moon, observer, +1, date, 1);
    const moonSet = Astronomy.SearchRiseSet(Astronomy.Body.Moon, observer, -1, date, 1);

    if (moonRise) events.push({ type: 'Ephemeris', name: 'Lever Lune', time: moonRise.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), icon: 'moon', action: 'Lever' });
    if (moonSet) events.push({ type: 'Ephemeris', name: 'Coucher Lune', time: moonSet.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), icon: 'moon', action: 'Coucher' });

    // Add grid events (which now include advanced events)
    const gridEvents = getGridEvents(date);
    
    // Format times for advanced events if they exist
    const formattedGridEvents = gridEvents.map(e => {
        if (e.time && e.time instanceof Date) {
            return { ...e, time: e.time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) };
        }
        return e;
    });

    return [...events, ...formattedGridEvents];
}

function isSameDay(d1, d2) {
    return d1.getDate() === d2.getDate() && 
           d1.getMonth() === d2.getMonth() && 
           d1.getFullYear() === d2.getFullYear();
}

// --- RENDER LOGIC ---

function render() {
    const app = document.getElementById('app');
    const { viewDate, selectedDate, coords, isDarkMode } = state;
    
    // Update Body Theme
    document.body.className = `h-screen overflow-hidden flex flex-col font-sans selection:bg-orange-500/30 ${isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'}`;

    // Calendar Calculations
    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
    const offset = firstDay === 0 ? 6 : firstDay - 1;
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const empties = Array.from({ length: offset }, (_, i) => i);

    const selectedEvents = getEventsForDate(selectedDate, coords.lat, coords.lon);
    const moonInfo = getMoonPhase(selectedDate);

    // HTML Construction
    let html = `
        <!-- CALENDAR AREA -->
        <div class="w-full lg:flex-1 flex flex-col lg:h-full border-b lg:border-b-0 lg:border-r border-zinc-800/50">
            <!-- Header -->
            <div class="flex items-center justify-between p-4 sm:p-6 border-b border-zinc-800/50">
                <div class="flex items-center gap-2 sm:gap-4">
                    <button onclick="changeMonth(-1)" class="p-2 hover:bg-zinc-800 rounded-full transition-colors"><i data-lucide="chevron-left"></i></button>
                    <h2 class="text-lg sm:text-2xl font-black uppercase tracking-wider">
                        ${MONTHS[viewDate.getMonth()]} <span class="text-orange-500">${viewDate.getFullYear()}</span>
                    </h2>
                    <button onclick="changeMonth(1)" class="p-2 hover:bg-zinc-800 rounded-full transition-colors"><i data-lucide="chevron-right"></i></button>
                </div>
                <button onclick="goToToday()" class="text-[10px] sm:text-xs font-mono border border-zinc-700 px-2 sm:px-3 py-1 rounded hover:border-orange-500 transition-colors">
                    AUJOURD'HUI
                </button>
            </div>

            <!-- Grid -->
            <div class="flex-1 p-2 sm:p-6 lg:overflow-y-auto">
                <div class="grid grid-cols-7 mb-2 sm:mb-4">
                    ${WEEK_DAYS.map(d => `<div class="text-center text-[10px] sm:text-xs font-mono opacity-50">${d}</div>`).join('')}
                </div>
                <div class="grid grid-cols-7 gap-1 sm:gap-2">
                    ${empties.map(() => `<div class="aspect-square"></div>`).join('')}
                    ${days.map(day => {
                        const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
                        const isSelected = isSameDay(date, selectedDate);
                        const isToday = isSameDay(date, new Date());
                        const { phase, illumination } = getMoonPhase(date);
                        const dayEvents = getGridEvents(date);
                        const specialEvents = dayEvents.filter(e => e.type === 'Conjunction' || e.type === 'Opposition');

                        return `
                            <button
                                onclick="selectDate(${date.getTime()})"
                                class="relative aspect-square p-0.5 sm:p-1 border rounded-lg flex flex-col justify-between transition-all overflow-hidden group text-left
                                    ${isSelected ? 'border-orange-500 bg-orange-500/10 ring-1 ring-orange-500' : isDarkMode ? 'border-zinc-800 bg-zinc-900 hover:border-zinc-600' : 'border-zinc-200 bg-white hover:border-zinc-400'}
                                "
                            >
                                <div class="flex justify-between items-start w-full z-10">
                                    <span class="text-[10px] sm:text-xs font-bold ${isToday ? 'text-orange-500' : ''}">${day}</span>
                                    <span class="text-[8px] sm:text-[9px] font-mono opacity-50">${illumination}%</span>
                                </div>
                                
                                <div class="flex flex-col gap-0.5 mt-0.5 sm:mt-1 w-full z-10">
                                    ${specialEvents.slice(0, 2).map(evt => `
                                        <div class="flex items-center gap-0.5 sm:gap-1 text-[8px] sm:text-[9px] opacity-80 truncate">
                                            <i data-lucide="${evt.icon}" class="w-2 h-2 sm:w-3 sm:h-3 shrink-0 ${evt.type === 'Opposition' ? "text-red-400" : "text-yellow-400"}"></i>
                                            <span class="truncate hidden sm:inline">${evt.name}</span>
                                            <span class="truncate sm:hidden">${evt.name.split(' ')[0].substring(0, 3)}</span>
                                        </div>
                                    `).join('')}
                                    ${specialEvents.length > 2 ? `<div class="text-[7px] sm:text-[8px] opacity-40 pl-1">+${specialEvents.length - 2}</div>` : ''}
                                </div>

                                <div class="absolute bottom-0 right-0 opacity-10 pointer-events-none">
                                    <i data-lucide="moon" class="w-5 h-5 sm:w-8 sm:h-8 ${phase > 180 ? "scale-x-[-1]" : ""}" ${phase > 170 && phase < 190 ? 'fill="currentColor"' : ''}></i>
                                </div>
                            </button>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>

        <!-- SIDEBAR INFO -->
        <div class="w-full lg:w-96 flex flex-col lg:h-full lg:overflow-y-auto border-l-0 lg:border-l ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200'}">
            <div class="p-4 sm:p-6 border-b border-zinc-800/50">
                <div class="flex justify-between items-start mb-4 sm:mb-6">
                    <div>
                        <h3 class="text-3xl sm:text-4xl font-black uppercase leading-none">${selectedDate.getDate()}</h3>
                        <p class="text-lg sm:text-xl font-light uppercase text-orange-500">${MONTHS[selectedDate.getMonth()]}</p>
                    </div>
                    <button onclick="handleGeolocation()" title="Localiser" class="p-2 border border-zinc-700 rounded hover:text-orange-500 hover:border-orange-500 transition-colors">
                        <i data-lucide="locate" class="w-4 h-4 sm:w-5 sm:h-5"></i>
                    </button>
                </div>
                
                <div class="flex items-center gap-2 text-[10px] sm:text-xs font-mono opacity-60 mb-4 sm:mb-6">
                    <i data-lucide="map-pin" class="w-3 h-3 sm:w-[14px] sm:h-[14px]"></i>
                    ${coords.name} (${coords.lat.toFixed(2)}, ${coords.lon.toFixed(2)})
                </div>

                <div class="p-3 sm:p-4 rounded-xl border ${isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-[10px] sm:text-xs font-bold uppercase opacity-70">Phase Lunaire</span>
                        <span class="text-[10px] sm:text-xs font-mono text-orange-500">${moonInfo.illumination}%</span>
                    </div>
                    <div class="flex items-center gap-3">
                        <i data-lucide="moon" class="w-6 h-6 sm:w-8 sm:h-8 text-zinc-400"></i>
                        <span class="font-bold text-base sm:text-lg">${moonInfo.name}</span>
                    </div>
                </div>
            </div>

            <div class="p-4 sm:p-6 flex-1">
                <h4 class="text-[10px] sm:text-xs font-bold uppercase opacity-50 mb-3 sm:mb-4 flex items-center gap-2">
                    <i data-lucide="info" class="w-3 h-3 sm:w-[14px] sm:h-[14px]"></i> Éphémérides & Événements
                </h4>
                
                <div class="space-y-2 sm:space-y-3">
                    ${selectedEvents.length > 0 ? selectedEvents.map(evt => `
                        <div class="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 rounded-lg border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}">
                            <div class="p-1.5 sm:p-2 rounded-full ${isDarkMode ? 'bg-zinc-950' : 'bg-zinc-100'}">
                                <i data-lucide="${evt.icon}" class="w-4 h-4 sm:w-[18px] sm:h-[18px] text-orange-500"></i>
                            </div>
                            <div>
                                <p class="font-bold text-xs sm:text-sm">${evt.name}</p>
                                <p class="text-[10px] sm:text-xs opacity-60 font-mono">
                                    ${evt.type === 'Ephemeris' ? `${evt.action} : ${evt.time}` : evt.time || ''}
                                </p>
                            </div>
                        </div>
                    `).join('') : `
                        <div class="text-center py-8 opacity-40">
                            <p class="text-xs sm:text-sm">Aucun événement majeur</p>
                        </div>
                    `}
                </div>
            </div>
        </div>
    `;

    app.innerHTML = html;
    lucide.createIcons();
}

// --- ACTIONS ---

window.changeMonth = (delta) => {
    state.viewDate = new Date(state.viewDate.getFullYear(), state.viewDate.getMonth() + delta, 1);
    state.monthEvents = calculateMonthEvents(state.viewDate.getFullYear(), state.viewDate.getMonth());
    render();
};

window.goToToday = () => {
    state.viewDate = new Date();
    state.selectedDate = new Date();
    state.monthEvents = calculateMonthEvents(state.viewDate.getFullYear(), state.viewDate.getMonth());
    render();
};

window.selectDate = (timestamp) => {
    state.selectedDate = new Date(timestamp);
    render();
};

window.handleGeolocation = () => {
    if (!navigator.geolocation) return alert("Géolocalisation non supportée");
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            state.coords = { lat: pos.coords.latitude, lon: pos.coords.longitude, name: "Position locale" };
            render();
        },
        () => alert("Accès à la position refusé")
    );
};

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    state.monthEvents = calculateMonthEvents(state.viewDate.getFullYear(), state.viewDate.getMonth());
    render();
});

import React, { useState, useMemo } from 'react';
import * as Astronomy from 'astronomy-engine';
import { Moon, Sun, Star, ChevronLeft, ChevronRight, Info, Rocket, Locate, Download, Leaf, GitMerge, ArrowLeftRight, Clock, MapPin } from 'lucide-react';

// --- CONFIGURATION & CONSTANTS (Static) ---
const PLANETS = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];
const MOON_PHASES = [
    { name: 'Nouvelle Lune', icon: Moon, phase: 0 },
    { name: 'Premier Croissant', icon: Moon, phase: 0.125 },
    { name: 'Premier Quartier', icon: Moon, phase: 0.25 },
    { name: 'Lune Gibbeuse', icon: Moon, phase: 0.375 },
    { name: 'Pleine Lune', icon: Moon, phase: 0.5 },
    { name: 'Lune Gibbeuse', icon: Moon, phase: 0.625 },
    { name: 'Dernier Quartier', icon: Moon, phase: 0.75 },
    { name: 'Dernier Croissant', icon: Moon, phase: 0.875 }
];

// --- HELPER FUNCTIONS ---

const getMoonPhase = (date) => {
    const phase = Astronomy.MoonPhase(date); // 0 to 360
    const illumination = Astronomy.Illumination(Astronomy.Body.Moon, date).mag_ratio * 100;
    
    // Normalize phase to 0-1 for our array mapping
    const normalizedPhase = phase / 360;
    
    // Find closest phase name
    let closest = MOON_PHASES[0];
    let minDiff = 1;
    
    for (const p of MOON_PHASES) {
        let diff = Math.abs(normalizedPhase - p.phase);
        if (diff > 0.5) diff = 1 - diff; // Handle wrap around 0/1
        if (diff < minDiff) {
            minDiff = diff;
            closest = p;
        }
    }
    
    return {
        phase: phase, // 0-360
        illumination: Math.round(illumination),
        name: closest.name
    };
};

const getEventsForDate = (date, lat, lon) => {
    const events = [];
    const observer = new Astronomy.Observer(lat, lon, 0);
    
    // 1. Sun Rise/Set
    const sunRise = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, +1, date, 1);
    const sunSet = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, -1, date, 1);
    
    if (sunRise) events.push({ type: 'Ephemeris', name: 'Lever du Soleil', time: sunRise.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), icon: Sun, action: 'Lever' });
    if (sunSet) events.push({ type: 'Ephemeris', name: 'Coucher du Soleil', time: sunSet.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), icon: Sun, action: 'Coucher' });

    // 2. Moon Rise/Set
    const moonRise = Astronomy.SearchRiseSet(Astronomy.Body.Moon, observer, +1, date, 1);
    const moonSet = Astronomy.SearchRiseSet(Astronomy.Body.Moon, observer, -1, date, 1);

    if (moonRise) events.push({ type: 'Ephemeris', name: 'Lever de la Lune', time: moonRise.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), icon: Moon, action: 'Lever' });
    if (moonSet) events.push({ type: 'Ephemeris', name: 'Coucher de la Lune', time: moonSet.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), icon: Moon, action: 'Coucher' });

    // 3. Moon Phase (Exact)
    const phase = Astronomy.MoonPhase(date);
    if (Math.abs(phase - 0) < 5) events.push({ type: 'Phase', name: 'Nouvelle Lune', time: '', icon: Moon });
    else if (Math.abs(phase - 90) < 5) events.push({ type: 'Phase', name: 'Premier Quartier', time: '', icon: Moon });
    else if (Math.abs(phase - 180) < 5) events.push({ type: 'Phase', name: 'Pleine Lune', time: '', icon: Moon });
    else if (Math.abs(phase - 270) < 5) events.push({ type: 'Phase', name: 'Dernier Quartier', time: '', icon: Moon });

    // 4. Planet Visibility (Simplified)
    // Check if planets are visible in the evening sky (altitude > 10 deg at 22:00)
    const eveningTime = new Date(date);
    eveningTime.setHours(22, 0, 0);
    
    PLANETS.forEach(planet => {
        const equ = Astronomy.Equator(planet, eveningTime, observer, true, true);
        const hor = Astronomy.Horizon(eveningTime, observer, equ.ra, equ.dec, 'normal');
        if (hor.altitude > 10) {
            events.push({ type: 'Observation', name: `${planet} visible`, time: 'Soirée', icon: Star });
        }
    });

    return events;
};

const isSameDay = (d1, d2) => {
    return d1.getDate() === d2.getDate() && 
           d1.getMonth() === d2.getMonth() && 
           d1.getFullYear() === d2.getFullYear();
};

// --- COMPONENTS ---

const AstroCalendar = ({ isDarkMode = true }) => {
    const [viewDate, setViewDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [coords, setCoords] = useState({ lat: 48.8566, lon: 2.3522, name: "Paris" }); // Default Paris

    const handlePrevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    const handleNextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

    const handleGeolocation = () => {
        if (!navigator.geolocation) return alert("Géolocalisation non supportée");
        navigator.geolocation.getCurrentPosition(
            (pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude, name: "Position locale" }),
            () => alert("Accès à la position refusé")
        );
    };

    // Calendar Grid Generation
    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
    const offset = firstDay === 0 ? 6 : firstDay - 1; // Start Monday
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const empties = Array.from({ length: offset }, (_, i) => i);

    const selectedEvents = useMemo(() => getEventsForDate(selectedDate, coords.lat, coords.lon), [selectedDate, coords]);
    const moonInfo = useMemo(() => getMoonPhase(selectedDate), [selectedDate]);

    const weekDays = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

    return (
        <div className={`flex flex-col lg:flex-row h-full w-full overflow-hidden ${isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'}`}>
            
            {/* CALENDAR AREA */}
            <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-zinc-800/50">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-800/50">
                    <div className="flex items-center gap-4">
                        <button onClick={handlePrevMonth} className="p-2 hover:bg-zinc-800 rounded-full transition-colors"><ChevronLeft /></button>
                        <h2 className="text-2xl font-black uppercase tracking-wider">
                            {months[viewDate.getMonth()]} <span className="text-orange-500">{viewDate.getFullYear()}</span>
                        </h2>
                        <button onClick={handleNextMonth} className="p-2 hover:bg-zinc-800 rounded-full transition-colors"><ChevronRight /></button>
                    </div>
                    <button onClick={() => setViewDate(new Date())} className="text-xs font-mono border border-zinc-700 px-3 py-1 rounded hover:border-orange-500 transition-colors">
                        AUJOURD'HUI
                    </button>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-7 mb-4">
                        {weekDays.map(d => <div key={d} className="text-center text-xs font-mono opacity-50">{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                        {empties.map(e => <div key={`empty-${e}`} className="aspect-square"></div>)}
                        {days.map(day => {
                            const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
                            const isSelected = isSameDay(date, selectedDate);
                            const isToday = isSameDay(date, new Date());
                            const { phase } = getMoonPhase(date);
                            
                            // Calculate events for this specific day cell
                            const dayEvents = getEventsForDate(date, coords.lat, coords.lon);
                            const specialPhase = dayEvents.find(e => e.type === 'Phase');
                            const observations = dayEvents.filter(e => e.type === 'Observation');

                            return (
                                <button
                                    key={day}
                                    onClick={() => setSelectedDate(date)}
                                    className={`relative aspect-square p-1.5 border rounded-lg flex flex-col justify-between transition-all overflow-hidden group
                                        ${isSelected ? 'border-orange-500 bg-orange-500/10 ring-1 ring-orange-500' : isDarkMode ? 'border-zinc-800 bg-zinc-900 hover:border-zinc-600' : 'border-zinc-200 bg-white hover:border-zinc-400'}
                                    `}
                                >
                                    <div className="flex justify-between items-start w-full z-10">
                                        <span className={`text-xs font-bold ${isToday ? 'text-orange-500' : ''}`}>{day}</span>
                                        {specialPhase && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" title={specialPhase.name}></div>
                                        )}
                                    </div>
                                    
                                    {/* Mini Event List */}
                                    <div className="flex flex-col gap-0.5 mt-1 w-full z-10">
                                        {observations.slice(0, 2).map((obs, idx) => (
                                            <div key={idx} className="flex items-center gap-1 text-[9px] opacity-60 truncate">
                                                <Star size={8} className="text-yellow-500 shrink-0" />
                                                <span className="truncate">{obs.name.split(' ')[0]}</span>
                                            </div>
                                        ))}
                                        {observations.length > 2 && (
                                            <div className="text-[9px] opacity-40 pl-3">+{observations.length - 2}</div>
                                        )}
                                    </div>

                                    <div className="absolute bottom-1 right-1 opacity-20 group-hover:opacity-40 transition-opacity">
                                        <Moon size={24} className={phase > 180 ? "scale-x-[-1]" : ""} fill={phase > 170 && phase < 190 ? "currentColor" : "none"} />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* SIDEBAR INFO */}
            <div className={`w-full lg:w-96 flex flex-col border-l ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200'} overflow-y-auto`}>
                <div className="p-6 border-b border-zinc-800/50">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-4xl font-black uppercase leading-none">{selectedDate.getDate()}</h3>
                            <p className="text-xl font-light uppercase text-orange-500">{months[selectedDate.getMonth()]}</p>
                        </div>
                        <button onClick={handleGeolocation} title="Localiser" className="p-2 border border-zinc-700 rounded hover:text-orange-500 hover:border-orange-500 transition-colors">
                            <Locate size={20} />
                        </button>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs font-mono opacity-60 mb-6">
                        <MapPin size={14} />
                        {coords.name} ({coords.lat.toFixed(2)}, {coords.lon.toFixed(2)})
                    </div>

                    <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold uppercase opacity-70">Phase Lunaire</span>
                            <span className="text-xs font-mono text-orange-500">{moonInfo.illumination}%</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Moon size={32} className="text-zinc-400" />
                            <span className="font-bold text-lg">{moonInfo.name}</span>
                        </div>
                    </div>
                </div>

                <div className="p-6 flex-1">
                    <h4 className="text-xs font-bold uppercase opacity-50 mb-4 flex items-center gap-2">
                        <Info size={14} /> Éphémérides & Événements
                    </h4>
                    
                    <div className="space-y-3">
                        {selectedEvents.length > 0 ? selectedEvents.map((evt, i) => (
                            <div key={i} className={`flex items-center gap-4 p-3 rounded-lg border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                                <div className={`p-2 rounded-full ${isDarkMode ? 'bg-zinc-950' : 'bg-zinc-100'}`}>
                                    <evt.icon size={18} className="text-orange-500" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm">{evt.name}</p>
                                    <p className="text-xs opacity-60 font-mono">
                                        {evt.type === 'Ephemeris' ? `${evt.action} : ${evt.time}` : evt.time}
                                    </p>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-8 opacity-40">
                                <p className="text-sm">Aucun événement majeur</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AstroCalendar;
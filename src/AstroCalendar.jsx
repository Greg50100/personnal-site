import React, { useState, useEffect, useMemo } from 'react';
import * as Astronomy from 'astronomy-engine';
import { Moon, Sun, Star, ChevronLeft, ChevronRight, Info, Rocket, Locate, Download, Leaf, GitMerge, ArrowLeftRight, Clock, MapPin } from 'lucide-react';

// --- CONFIGURATION & CONSTANTS (Static) ---

const METEOR_SHOWERS = [
    { name: "Quadrantides", month: 0, day: 4 },
    { name: "Lyrides", month: 3, day: 22 },
    { name: "Êta Aquarides", month: 4, day: 6 },
    { name: "Delta Aquarides", month: 6, day: 30 },
    { name: "Perséides", month: 7, day: 12 },
    { name: "Orionides", month: 9, day: 21 },
    { name: "Léonides", month: 10, day: 17 },
    { name: "Géminides", month: 11, day: 14 },
    { name: "Ursides", month: 11, day: 22 },
];

// --- HELPER FUNCTIONS ---

const formatTime = (t) => {
    if (!t || !t.date) return '--:--';
    try {
        return String(t.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
    } catch (e) {
        return '--:--';
    }
};

const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    return d1.getDate() === d2.getDate() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getFullYear() === d2.getFullYear();
};

const getMoonPhaseData = (date) => {
    try {
        const phase = Astronomy.MoonPhase(date);
        const illum = Astronomy.Illumination(Astronomy.Body.Moon, date);
        const illumination = Math.round(illum.phase_fraction * 100);
        
        let phaseName = "Lune";
        if (phase < 22.5 || phase > 337.5) phaseName = "Nouvelle Lune";
        else if (phase < 67.5) phaseName = "Premier Croissant";
        else if (phase < 112.5) phaseName = "Premier Quartier";
        else if (phase < 157.5) phaseName = "Lune Gibbeuse Croissante";
        else if (phase < 202.5) phaseName = "Pleine Lune";
        else if (phase < 247.5) phaseName = "Lune Gibbeuse Décroissante";
        else if (phase < 292.5) phaseName = "Dernier Quartier";
        else phaseName = "Dernier Croissant";

        return { phase, phaseName, illumination };
    } catch (e) {
        return { phase: 0, phaseName: '', illumination: 0 };
    }
};

const downloadICS = (evt, date) => {
    const formatDate = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    let startDate = evt.dateObj && evt.dateObj instanceof Date ? new Date(evt.dateObj) : new Date(date);
    if (!evt.dateObj) startDate.setHours(20,0,0,0); 
    
    const title = String(evt.text || evt.type || "Événement Astronomique");
    const description = `Événement astronomique : ${title}`;
    
    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'BEGIN:VEVENT',
        `DTSTART:${formatDate(startDate)}`,
        `DTEND:${formatDate(new Date(startDate.getTime() + 60*60*1000))}`,
        `SUMMARY:${title}`,
        `DESCRIPTION:${description}`,
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${title.replace(/[^a-z0-9]/gi, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(url), 100);
};

// --- COMPONENTS ---

const ClockDisplay = () => {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    return <span>{time.toLocaleTimeString()}</span>;
};

const PhaseIcon = ({ phase, className }) => {
    if (typeof phase !== 'number' || isNaN(phase)) return <Moon className={className} />;
    if (phase < 22.5 || phase > 337.5) return <Moon className={`${className} opacity-30`} />;
    if (phase >= 157.5 && phase <= 202.5) return <Sun className={`${className} text-yellow-200`} />;
    return <Moon className={className} />;
};

const EventIcon = ({ type, className }) => {
    switch (type) {
        case 'PhaseEvent': return <Moon size={18} className="text-purple-400" />;
        case 'Apsis': return <Rocket size={18} className="text-blue-400" />;
        case 'Conjunction': return <GitMerge size={18} className="text-yellow-400" />;
        case 'Opposition': return <ArrowLeftRight size={18} className="text-red-400" />;
        case 'MeteorShower': return <Star size={18} className="text-teal-400" />;
        case 'Season': return <Leaf size={18} className="text-green-400" />;
        default: return <Info size={18} className="text-zinc-500" />;
    }
};

const getAstronomicalEvents = (date, observer) => {
    const PLANETS = [
        { id: Astronomy.Body.Mercury, name: "Mercure" },
        { id: Astronomy.Body.Venus, name: "Vénus" },
        { id: Astronomy.Body.Mars, name: "Mars" },
        { id: Astronomy.Body.Jupiter, name: "Jupiter" },
        { id: Astronomy.Body.Saturn, name: "Saturne" },
        { id: Astronomy.Body.Uranus, name: "Uranus" },
        { id: Astronomy.Body.Neptune, name: "Neptune" }
    ];

    const events = [];
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const searchLimitDays = 1.0; 

    // 1. Rise/Set
    const sunRise = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, +1, startOfDay, 1);
    const sunSet = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, -1, startOfDay, 1);
    const moonRise = Astronomy.SearchRiseSet(Astronomy.Body.Moon, observer, +1, startOfDay, 1);
    const moonSet = Astronomy.SearchRiseSet(Astronomy.Body.Moon, observer, -1, startOfDay, 1);

    const srTime = sunRise && isSameDay(sunRise.date, date) ? formatTime(sunRise) : null;
    const ssTime = sunSet && isSameDay(sunSet.date, date) ? formatTime(sunSet) : null;
    if (srTime || ssTime) events.push({ type: 'Ephemeris', subtype: 'Sun', rise: srTime, set: ssTime });

    const mrTime = moonRise && isSameDay(moonRise.date, date) ? formatTime(moonRise) : null;
    const msTime = moonSet && isSameDay(moonSet.date, date) ? formatTime(moonSet) : null;
    if (mrTime || msTime) events.push({ type: 'Ephemeris', subtype: 'Moon', rise: mrTime, set: msTime });

    // 2. Moon Phase
    const yesterday = new Date(date); yesterday.setDate(date.getDate() - 1);
    const nextQuarter = Astronomy.SearchMoonQuarter(yesterday);
    if (nextQuarter && isSameDay(nextQuarter.time.date, date)) {
        const qNames = ["Nouvelle Lune", "Premier Quartier", "Pleine Lune", "Dernier Quartier"];
        const { illumination } = getMoonPhaseData(date);
        events.push({ 
            type: 'PhaseEvent', 
            text: `${qNames[nextQuarter.quarter]} à ${formatTime(nextQuarter.time)}`,
            quarter: nextQuarter.quarter,
            illumination,
            dateObj: nextQuarter.time.date
        });
    } else {
        const { phaseName, illumination } = getMoonPhaseData(date);
        events.push({ type: 'PhaseStatus', text: `${phaseName} (${illumination}%)` });
    }

    // 3. Apsis
    const nextApsis = Astronomy.SearchLunarApsis(yesterday);
    if (nextApsis && isSameDay(nextApsis.time.date, date)) {
        const apsisName = nextApsis.kind === 0 ? "Périgée Lunaire" : "Apogée Lunaire";
        events.push({ 
            type: 'Apsis', 
            text: `${apsisName} (${Math.round(nextApsis.dist_km).toLocaleString()} km)`,
            kind: nextApsis.kind,
            dateObj: nextApsis.time.date
        });
    }

    // 4. Conjunctions
    PLANETS.forEach(p => {
        const search = Astronomy.SearchRelativeLongitude(Astronomy.Body.Moon, p.id, 0, startOfDay, searchLimitDays);
        if (search && isSameDay(search.time.date, date)) {
             const sep = Astronomy.Separation(Astronomy.Body.Moon, p.id, search.time);
             events.push({
                type: 'Conjunction',
                text: `Lune - ${p.name} : ${sep.toFixed(1)}° de séparation`,
                planet: p.name,
                time: formatTime(search.time),
                dateObj: search.time.date
            });
        }
    });

    // 5. Planet-Planet
    for (let i = 0; i < PLANETS.length; i++) {
        for (let j = i + 1; j < PLANETS.length; j++) {
             const p1 = PLANETS[i];
             const p2 = PLANETS[j];
             const search = Astronomy.SearchRelativeLongitude(p1.id, p2.id, 0, startOfDay, searchLimitDays);
             if (search && isSameDay(search.time.date, date)) {
                 const sep = Astronomy.Separation(p1.id, p2.id, search.time);
                 events.push({
                    type: 'Conjunction',
                    text: `${p1.name} - ${p2.name} : ${sep.toFixed(1)}° de séparation`,
                    bodies: [p1.name, p2.name],
                    time: formatTime(search.time),
                    dateObj: search.time.date
                });
             }
        }
    }

    // 6. Oppositions
    PLANETS.forEach(p => {
        if (p.name === "Mercure" || p.name === "Vénus") return;
        const search = Astronomy.SearchRelativeLongitude(p.id, Astronomy.Body.Sun, 180, startOfDay, searchLimitDays);
        if (search && isSameDay(search.time.date, date)) {
             events.push({ 
                 type: 'Opposition', 
                 text: `${p.name} à l'opposition`, 
                 body: p.name,
                 time: formatTime(search.time),
                 dateObj: search.time.date
            });
        }
    });

    // 7. Seasons
    const seasons = Astronomy.Seasons(date.getFullYear());
    const seasonEvents = [
        { name: "Équinoxe de Printemps", date: seasons.mar_equinox.date, icon: "Leaf" },
        { name: "Solstice d'Été", date: seasons.jun_solstice.date, icon: "Sun" },
        { name: "Équinoxe d'Automne", date: seasons.sep_equinox.date, icon: "Leaf" },
        { name: "Solstice d'Hiver", date: seasons.dec_solstice.date, icon: "Snowflake" }
    ];
    for (const s of seasonEvents) {
        if (isSameDay(s.date, date)) {
            const tObj = { date: s.date };
            events.push({
                type: 'Season',
                text: `${s.name} (${formatTime(tObj)})`,
                seasonIcon: s.icon,
                dateObj: s.date
            });
        }
    }

    // 8. Meteor Showers
    const shower = METEOR_SHOWERS.find(s => s.month === date.getMonth() && s.day === date.getDate());
    if (shower) {
        events.push({ type: 'MeteorShower', text: `Pic : ${shower.name}`, name: shower.name });
    }

    events.sort((a, b) => {
        if (a.dateObj && b.dateObj) return a.dateObj - b.dateObj;
        return 0;
    });

    return events;
};

const getDayEventsSummary = (date) => {
    const events = [];
    try {
        // 1. Moon Phase
        const yesterday = new Date(date); yesterday.setDate(date.getDate() - 1);
        const nextQuarter = Astronomy.SearchMoonQuarter(yesterday);
        if (nextQuarter && isSameDay(nextQuarter.time.date, date)) {
            const qNames = ["Nouvelle Lune", "1er Quartier", "Pleine Lune", "Dernier Quartier"];
            events.push({ type: 'Phase', label: qNames[nextQuarter.quarter], color: 'text-purple-500' });
        }

        // 2. Apsis
        const nextApsis = Astronomy.SearchLunarApsis(yesterday);
        if (nextApsis && isSameDay(nextApsis.time.date, date)) {
            events.push({ type: 'Apsis', label: nextApsis.kind === 0 ? "Périgée" : "Apogée", color: 'text-blue-500' });
        }

        // 3. Conjunctions & Oppositions (Lightweight check for dots)
        const bodies = [
            { id: Astronomy.Body.Mercury, name: "Mercure" },
            { id: Astronomy.Body.Venus, name: "Vénus" },
            { id: Astronomy.Body.Mars, name: "Mars" },
            { id: Astronomy.Body.Jupiter, name: "Jupiter" },
            { id: Astronomy.Body.Saturn, name: "Saturne" }
        ];
        
        const time = Astronomy.MakeTime(date);

        // Moon-Planet
        for (const p of bodies) {
            const sep = Astronomy.Separation(Astronomy.Body.Moon, p.id, time);
            if (sep < 6) {
                 events.push({ type: 'Conjunction', label: `Lune-${p.name}`, color: 'text-yellow-400' });
            }
        }

        // Planet-Planet
        for (let i = 0; i < bodies.length; i++) {
            for (let j = i + 1; j < bodies.length; j++) {
                const sep = Astronomy.Separation(bodies[i].id, bodies[j].id, time);
                if (sep < 2) {
                    events.push({ type: 'Conjunction', label: `${bodies[i].name}-${bodies[j].name}`, color: 'text-yellow-400' });
                }
            }
        }

        // Oppositions
        for (const p of bodies) {
            if (p.name === "Mercure" || p.name === "Vénus") continue;
            const el = Astronomy.Elongation(p.id, time);
            if (el > 178) {
                 events.push({ type: 'Opposition', label: `Opp. ${p.name}`, color: 'text-red-400' });
            }
        }

        // 4. Meteor Showers
        const shower = METEOR_SHOWERS.find(s => s.month === date.getMonth() && s.day === date.getDate());
        if (shower) events.push({ type: 'MeteorShower', label: shower.name, color: 'text-teal-400' });

        // 5. Seasons
        const seasons = Astronomy.Seasons(date.getFullYear());
        const seasonList = [seasons.mar_equinox, seasons.jun_solstice, seasons.sep_equinox, seasons.dec_solstice];
        if (seasonList.some(s => isSameDay(s.date, date))) {
            events.push({ type: 'Season', label: "Saison", color: 'text-green-500' });
        }
    } catch (e) {
        // Silent fail for summary
    }

    return events;
};

const AstroCalendar = ({ isDarkMode = true }) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [latitude, setLatitude] = useState(46.2276);
  const [longitude, setLongitude] = useState(2.2137);
  const [locationName, setLocationName] = useState("France (Défaut)");

  const handleGeolocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLocationName("Position locale");
      }, (error) => {
        console.error("Error getting location:", error);
        alert("Impossible de récupérer votre position précise.");
      });
    } else {
      alert("Géolocalisation non supportée.");
    }
  };

  const selectedEvents = useMemo(() => {
    const observer = new Astronomy.Observer(latitude, longitude, 0);
    return getAstronomicalEvents(selectedDate, observer);
  }, [selectedDate, latitude, longitude]);

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const changeMonth = (delta) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1);
    setViewDate(newDate);
  };

  const handleDayClick = (day) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    setSelectedDate(newDate);
  };

  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() && 
           viewDate.getMonth() === today.getMonth() && 
           viewDate.getFullYear() === today.getFullYear();
  };

  const isSelected = (day) => {
      return day === selectedDate.getDate() && 
             viewDate.getMonth() === selectedDate.getMonth() &&
             viewDate.getFullYear() === selectedDate.getFullYear();
  }

  const weekDays = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];
  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  return (
    <div className={`flex flex-col lg:flex-row h-full overflow-hidden ${isDarkMode ? 'bg-zinc-950 text-zinc-200' : 'bg-zinc-50 text-zinc-800'}`}>
      
        {/* --- LEFT: CALENDAR GRID --- */}
        <div className="flex-1 flex flex-col border-r border-zinc-800/50">
            {/* Header */}
            <div className="flex items-center justify-between p-4 lg:p-6 border-b border-zinc-800/50">
                <div className="flex items-center gap-4">
                    <button onClick={() => changeMonth(-1)} className="p-2 hover:text-orange-500 transition-colors">
                        <ChevronLeft />
                    </button>
                    <h2 className="text-xl lg:text-2xl font-black uppercase tracking-widest">
                        {monthNames[viewDate.getMonth()]} <span className="text-orange-500">{viewDate.getFullYear()}</span>
                    </h2>
                    <button onClick={() => changeMonth(1)} className="p-2 hover:text-orange-500 transition-colors">
                        <ChevronRight />
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 flex flex-col p-2 lg:p-6 overflow-y-auto">
                <div className="grid grid-cols-7 mb-2">
                    {weekDays.map(day => (
                        <div key={day} className="text-center text-[10px] lg:text-xs font-mono font-bold opacity-50 py-2">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1 lg:gap-2 auto-rows-fr">
                    {[...Array(startOffset)].map((_, i) => (
                        <div key={`empty-${i}`} className={`min-h-[60px] lg:min-h-[100px] ${isDarkMode ? 'bg-zinc-800/20' : 'bg-gray-100'}`}></div>
                    ))}

                    {[...Array(daysInMonth)].map((_, i) => {
                        const day = i + 1;
                        const currentLoopDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day, 12, 0, 0);
                        
                        const { phase, illumination } = getMoonPhaseData(currentLoopDate);
                        const dayEvents = getDayEventsSummary(currentLoopDate);
                        const today = isToday(day);
                        const selected = isSelected(day);

                        return (
                            <button 
                                key={day}
                                onClick={() => handleDayClick(day)}
                                className={`relative p-2 flex flex-col justify-between transition-all border group min-h-[80px] lg:min-h-[110px] rounded-md
                                    ${selected ? 'border-orange-500 ring-1 ring-orange-500 z-10' : isDarkMode ? 'border-zinc-800 hover:bg-zinc-800' : 'border-zinc-200 hover:bg-gray-50'}
                                    ${isDarkMode ? 'bg-zinc-900' : 'bg-white'}
                                `}
                            >
                                <div className="flex justify-between items-start w-full">
                                    <span className={`text-sm font-mono font-bold ${today ? 'text-orange-500' : ''}`}>
                                        {day}
                                    </span>
                                    <div title={`${String(illumination)}%`}>
                                        <PhaseIcon phase={phase} className="w-3 h-3 lg:w-4 lg:h-4 opacity-80" />
                                    </div>
                                </div>
                                
                                <div className="flex flex-col gap-1 w-full mt-2">
                                    {dayEvents.slice(0, 3).map((evt, idx) => (
                                        <div key={idx} className="flex items-center gap-1.5 w-full">
                                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${evt.color.replace('text-', 'bg-')}`}></div>
                                            <span className="text-[9px] font-medium truncate w-full text-left opacity-70 hidden sm:block">
                                                {String(evt.label || '')}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>

        {/* --- RIGHT: SIDE PANEL --- */}
        <div className={`w-full lg:w-96 flex flex-col border-l ${isDarkMode ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-200 bg-gray-50'} overflow-y-auto min-h-[400px]`}>
            {/* Panel Header */}
            <div className="p-6 border-b border-zinc-800/50">
                 <div className="flex items-center justify-between mb-4">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-300'}`}>
                        <Clock size={12} className="text-orange-500" />
                        <ClockDisplay />
                    </div>
                    <button 
                        onClick={handleGeolocation}
                        className={`p-2 rounded-full border transition-colors ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:border-orange-500 hover:text-orange-500' : 'bg-white hover:bg-gray-100'}`}
                        title="Utiliser ma position GPS"
                    >
                        <Locate size={16} />
                    </button>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
                    <MapPin size={12} />
                    <span>{String(locationName)} ({latitude.toFixed(2)}, {longitude.toFixed(2)})</span>
                </div>

                <h3 className="text-3xl font-black uppercase mb-1">
                    {selectedDate.getDate()} {monthNames[selectedDate.getMonth()]}
                </h3>
                <p className="text-xs font-mono tracking-widest opacity-50">DONNÉES ASTRONOMIQUES</p>
            </div>

            {/* Panel Content */}
            <div className="p-6 space-y-6">
                {/* Ephemeris Grid */}
                <div className="grid grid-cols-2 gap-3">
                    {selectedEvents.filter(e => e.type === 'Ephemeris').map((evt, idx) => (
                        <div key={idx} className={`p-3 rounded-lg border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                            <div className="flex items-center gap-2 mb-3">
                                {evt.subtype === 'Sun' ? <Sun size={16} className="text-orange-500" /> : <Moon size={16} className="text-zinc-400" />}
                                <span className="text-xs font-bold uppercase tracking-wider">{String(evt.subtype === 'Sun' ? 'Soleil' : 'Lune')}</span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-[10px] opacity-50 uppercase">Lever</span>
                                    <span className="font-mono font-bold text-sm">{String(evt.rise || '--:--')}</span>
                                </div>
                                <div className="flex justify-between items-baseline">
                                    <span className="text-[10px] opacity-50 uppercase">Coucher</span>
                                    <span className="font-mono font-bold text-sm">{String(evt.set || '--:--')}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Events Feed */}
                <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase opacity-50 border-b border-zinc-800/50 pb-2 mb-4">Événements du jour</h4>
                    
                    {selectedEvents.filter(e => e.type !== 'Ephemeris' && e.type !== 'PhaseStatus').length > 0 ? (
                        selectedEvents.filter(e => e.type !== 'Ephemeris' && e.type !== 'PhaseStatus').map((evt, idx) => (
                            <div key={idx} className={`group flex items-start justify-between p-3 rounded-lg border transition-all ${isDarkMode ? 'bg-zinc-900/30 border-zinc-800 hover:border-zinc-700' : 'bg-white border-zinc-200 hover:shadow-sm'}`}>
                                <div className="flex items-start gap-3">
                                    <div className="mt-1">
                                        <EventIcon type={evt.type} />
                                    </div>
                                    
                                    <div>
                                        <p className="text-sm font-bold leading-snug">{String(evt.text || '')}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] opacity-50 font-mono uppercase">{String(evt.type || '')}</span>
                                            {evt.time && <span className="text-[10px] opacity-70 font-mono font-medium">{String(evt.time)}</span>}
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => downloadICS(evt, selectedDate)}
                                    className="opacity-0 group-hover:opacity-100 p-2 rounded hover:bg-orange-500/10 hover:text-orange-500 transition-all"
                                    title="Ajouter au calendrier"
                                >
                                    <Download size={14} />
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 opacity-30">
                            <p className="text-sm italic">Aucun événement majeur.</p>
                            <div className="mt-2 text-xs">
                                {String(selectedEvents.find(e => e.type === 'PhaseStatus')?.text || '')}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default AstroCalendar;
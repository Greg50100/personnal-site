import React, { useState, useEffect } from 'react';
import { 
  Moon, 
  Sun, 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Info, 
  Rocket, 
  MapPin, 
  Clock, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeftRight, 
  GitMerge, 
  Locate, 
  Download, 
  Snowflake, 
  Leaf, 
  CircleDot, 
  X,
  RotateCcw,
  Filter,
  Check,
  Sparkles,
  Camera,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// Importation de astronomy-engine via CDN pour garantir la précision des calculs
import * as Astronomy from 'https://esm.sh/astronomy-engine@2.1.19';

// --- ASTRONOMY UTILS ---

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

const getZodiacSign = (date) => {
    try {
        const longitude = Astronomy.Ecliptic(Astronomy.Body.Sun, date).elon;
        const signs = ["Bélier", "Taureau", "Gémeaux", "Cancer", "Lion", "Vierge", "Balance", "Scorpion", "Sagittaire", "Capricorne", "Verseau", "Poissons"];
        const index = Math.floor(longitude / 30);
        return signs[index % 12];
    } catch (e) {
        return "";
    }
};

const getPhotoHours = (date, observer) => {
    const findTime = (alt, direction) => Astronomy.SearchAltitude(Astronomy.Body.Sun, observer, direction, date, 1, alt);
    const format = (t) => t ? t.date.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--:--';
    
    try {
        // Morning: Blue Hour (-6 to -4) -> Golden Hour (-4 to 6)
        const blueStartM = findTime(-6, +1); 
        const goldenEndM = findTime(6, +1); 
        
        // Evening: Golden Hour (6 to -4) -> Blue Hour (-4 to -6)
        const goldenStartE = findTime(6, -1);
        const blueEndE = findTime(-6, -1);
        
        return {
            morning: `${format(blueStartM)} - ${format(goldenEndM)}`,
            evening: `${format(goldenStartE)} - ${format(blueEndE)}`
        };
    } catch (e) {
        return { morning: '--:-- - --:--', evening: '--:-- - --:--' };
    }
};

const getVisiblePlanets = (date, observer) => {
    try {
        const bodies = [
            { id: Astronomy.Body.Mercury, name: "Mercure" },
            { id: Astronomy.Body.Venus, name: "Vénus" },
            { id: Astronomy.Body.Mars, name: "Mars" },
            { id: Astronomy.Body.Jupiter, name: "Jupiter" },
            { id: Astronomy.Body.Saturn, name: "Saturne" }
        ];
        
        const sunSet = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, -1, date, 1);
        const sunRise = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, +1, date, 1);
        
        if (!sunSet || !sunRise) return [];

        // Check 45 mins after sunset and 45 mins before sunrise
        const eveningCheck = new Date(sunSet.date); eveningCheck.setMinutes(eveningCheck.getMinutes() + 45);
        const morningCheck = new Date(sunRise.date); morningCheck.setMinutes(morningCheck.getMinutes() - 45);
        
        const visible = [];
        
        bodies.forEach(p => {
            const altEvening = Astronomy.Horizon(eveningCheck, observer, p.id).altitude;
            const altMorning = Astronomy.Horizon(morningCheck, observer, p.id).altitude;
            
            if (altEvening > 5) visible.push({ name: p.name, time: "Soir" });
            else if (altMorning > 5) visible.push({ name: p.name, time: "Matin" });
        });
        
        return visible;
    } catch (e) {
        return [];
    }
};

const getMoonPhaseData = (date) => {
  try {
      const phase = Astronomy.MoonPhase(date); // 0 to 360
      const illum = Astronomy.Illumination(Astronomy.Body.Moon, date);
      const illumination = Math.round(illum.phase_fraction * 100);

      // 0 = New, 90 = First Quarter, 180 = Full, 270 = Last Quarter
      
      let phaseName = "";
      
      // Approximate phase names for display
      if (phase < 22.5 || phase > 337.5) phaseName = "Nouvelle Lune";
      else if (phase < 67.5) phaseName = "Premier Croissant";
      else if (phase < 112.5) phaseName = "Premier Quartier";
      else if (phase < 157.5) phaseName = "Lune Gibbeuse";
      else if (phase < 202.5) phaseName = "Pleine Lune";
      else if (phase < 247.5) phaseName = "Lune Gibbeuse";
      else if (phase < 292.5) phaseName = "Dernier Quartier";
      else phaseName = "Dernier Croissant";

      return { phase, phaseName, illumination };
  } catch (e) {
      return { phase: 0, phaseName: "", illumination: 0 };
  }
};

const getPhaseIcon = (phase, className) => {
    // phase is 0-360
    if (phase < 22.5 || phase > 337.5) return <Moon className={`${className} opacity-30`} />; // New
    if (phase >= 157.5 && phase <= 202.5) return <Sun className={`${className} text-yellow-200`} />; // Full (using Sun icon for brightness representation or a filled circle if available, but Sun is distinct)
    
    // For other phases, we could use different icons if available, but for now standard Moon
    return <Moon className={className} />;
};

const getAngleBetween = (body1, body2, date) => {
    try {
        const v1 = Astronomy.GeoVector(body1, date, true);
        const v2 = Astronomy.GeoVector(body2, date, true);
        const dot = v1.x*v2.x + v1.y*v2.y + v1.z*v2.z;
        const mag1 = Math.sqrt(v1.x*v1.x + v1.y*v1.y + v1.z*v1.z);
        const mag2 = Math.sqrt(v2.x*v2.x + v2.y*v2.y + v2.z*v2.z);
        return Math.acos(dot / (mag1 * mag2)) * (180 / Math.PI);
    } catch (e) {
        return 180; // Fail safe
    }
};

const downloadICS = (evt, date) => {
    const formatDate = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    let startDate = new Date(date);
    startDate.setHours(12,0,0,0); 
    
    const title = evt.text || evt.type;
    const description = `Événement astronomique : ${evt.text}`;
    
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
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${title.replace(/[^a-z0-9]/gi, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const isLocalExtremum = (date, getValue, isMin = true) => {
    const d = new Date(date); d.setHours(12, 0, 0, 0);
    const current = getValue(d);
    
    const prev = new Date(d); prev.setDate(d.getDate() - 1);
    const vPrev = getValue(prev);
    
    const next = new Date(d); next.setDate(d.getDate() + 1);
    const vNext = getValue(next);
    
    if (isMin) return current < vPrev && current <= vNext;
    return current > vPrev && current >= vNext;
};

const getAstronomicalEvents = (date, observer) => {
    const events = [];
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    // --- 1. Rise/Set Times (Compact) ---
    const sunRise = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, +1, startOfDay, 1);
    const sunSet = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, -1, startOfDay, 1);
    const moonRise = Astronomy.SearchRiseSet(Astronomy.Body.Moon, observer, +1, startOfDay, 1);
    const moonSet = Astronomy.SearchRiseSet(Astronomy.Body.Moon, observer, -1, startOfDay, 1);

    const formatTime = (t) => t ? t.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--';

    if ((sunRise && sunRise.date.getDate() === date.getDate()) || (sunSet && sunSet.date.getDate() === date.getDate())) {
        events.push({ 
            type: 'Ephemeris', 
            subtype: 'Sun',
            rise: (sunRise && sunRise.date.getDate() === date.getDate()) ? formatTime(sunRise) : null,
            set: (sunSet && sunSet.date.getDate() === date.getDate()) ? formatTime(sunSet) : null
        });
    }

    if ((moonRise && moonRise.date.getDate() === date.getDate()) || (moonSet && moonSet.date.getDate() === date.getDate())) {
        events.push({ 
            type: 'Ephemeris', 
            subtype: 'Moon',
            rise: (moonRise && moonRise.date.getDate() === date.getDate()) ? formatTime(moonRise) : null,
            set: (moonSet && moonSet.date.getDate() === date.getDate()) ? formatTime(moonSet) : null
        });
    }

    // --- 2. Moon Phase (Exact) ---
    // Check if a quarter change happens TODAY
    // We search for the next quarter starting from yesterday to catch any today
    const yesterday = new Date(date);
    yesterday.setDate(date.getDate() - 1);
    const nextQuarter = Astronomy.SearchMoonQuarter(yesterday);
    
    if (nextQuarter && nextQuarter.time.date.getDate() === date.getDate()) {
        const qNames = ["Nouvelle Lune", "Premier Quartier", "Pleine Lune", "Dernier Quartier"];
        const { illumination } = getMoonPhaseData(date);
        events.push({ 
            type: 'PhaseEvent', 
            text: `${qNames[nextQuarter.quarter]} (${illumination}%) à ${nextQuarter.time.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`,
            quarter: nextQuarter.quarter
        });
    } else {
        // Just show current phase name if no exact event
        const { phaseName, illumination } = getMoonPhaseData(date);
        events.push({ type: 'PhaseStatus', text: `${phaseName} (${illumination}%)` });
    }

    // --- 3. Lunar Apsis (Perigee/Apogee) ---
    const nextApsis = Astronomy.SearchLunarApsis(yesterday);
    if (nextApsis && nextApsis.time.date.getDate() === date.getDate()) {
        const apsisName = nextApsis.kind === 0 ? "Périgée Lunaire" : "Apogée Lunaire";
        events.push({ 
            type: 'Apsis', 
            text: `${apsisName} (${Math.round(nextApsis.dist_km).toLocaleString()} km)`,
            kind: nextApsis.kind
        });
    }

    // --- 4. Conjunctions & Oppositions ---
    const bodies = [
        { id: Astronomy.Body.Mercury, name: "Mercure" },
        { id: Astronomy.Body.Venus, name: "Vénus" },
        { id: Astronomy.Body.Mars, name: "Mars" },
        { id: Astronomy.Body.Jupiter, name: "Jupiter" },
        { id: Astronomy.Body.Saturn, name: "Saturne" },
        { id: Astronomy.Body.Uranus, name: "Uranus" },
        { id: Astronomy.Body.Neptune, name: "Neptune" }
    ];

    // Moon-Planet Conjunctions
    for (const p of bodies) {
        const checkDate = new Date(date); checkDate.setHours(12,0,0,0);
        const angle = getAngleBetween(Astronomy.Body.Moon, p.id, checkDate);
        const getValue = (d) => getAngleBetween(Astronomy.Body.Moon, p.id, d);

        if (angle < 6 && isLocalExtremum(date, getValue, true)) { // Less than 6 degrees separation
            events.push({
                type: 'Conjunction',
                text: `Lune - ${p.name} : ${angle.toFixed(1)}°`,
                planet: p.name
            });
        }
    }

    // Planet-Planet Conjunctions
    for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
             const checkDate = new Date(date); checkDate.setHours(12,0,0,0);
             const angle = getAngleBetween(bodies[i].id, bodies[j].id, checkDate);
             const getValue = (d) => getAngleBetween(bodies[i].id, bodies[j].id, d);

             if (angle < 2 && isLocalExtremum(date, getValue, true)) { // Very close (< 2 degrees)
                 events.push({
                    type: 'Conjunction',
                    text: `${bodies[i].name} - ${bodies[j].name} : ${angle.toFixed(1)}°`,
                    bodies: [bodies[i].name, bodies[j].name]
                });
             }
        }
    }

    // Oppositions (Sun vs Planet)
    for (const p of bodies) {
        // Elongation: angle between Sun and Planet seen from Earth
        // Near 180 means Opposition (Planet opposite to Sun)
        const checkDate = new Date(date); checkDate.setHours(12,0,0,0);
        const el = Astronomy.Elongation(p.id, checkDate);
        const getValue = (d) => Astronomy.Elongation(p.id, d).elongation;

        // Note: For inner planets (Mercury/Venus), Elongation never reaches 180, so this logic naturally excludes them.
        if (el.elongation > 178 && isLocalExtremum(date, getValue, false)) { 
             events.push({
                type: 'Opposition',
                text: `${p.name} à l'opposition`,
                body: p.name
            });
        }
    }

    // --- 5. Meteor Showers ---
    const shower = METEOR_SHOWERS.find(s => s.month === date.getMonth() && s.day === date.getDate());
    if (shower) {
        events.push({
            type: 'MeteorShower',
            text: `Pluie d'étoiles filantes : ${shower.name}`,
            name: shower.name
        });
    }

    // --- 6. Seasons ---
    const seasons = Astronomy.Seasons(date.getFullYear());
    const seasonEvents = [
        { name: "Équinoxe de Printemps", date: seasons.mar_equinox.date, icon: "Leaf" },
        { name: "Solstice d'Été", date: seasons.jun_solstice.date, icon: "Sun" },
        { name: "Équinoxe d'Automne", date: seasons.sep_equinox.date, icon: "Leaf" },
        { name: "Solstice d'Hiver", date: seasons.dec_solstice.date, icon: "Snowflake" }
    ];
    
    for (const s of seasonEvents) {
        if (s.date.getDate() === date.getDate() && s.date.getMonth() === date.getMonth()) {
            events.push({
                type: 'Season',
                text: `${s.name} (${s.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})`,
                seasonIcon: s.icon
            });
        }
    }

    // --- 7. Eclipses ---
    // Search for eclipses near this date
    const t = Astronomy.MakeTime(date);
    // We search a bit back to catch if today is the day
    const searchStart = new Date(date); searchStart.setDate(date.getDate() - 1);
    
    const solarEclipse = Astronomy.SearchGlobalSolarEclipse(searchStart);
    if (solarEclipse.peak.date.getDate() === date.getDate() && solarEclipse.peak.date.getMonth() === date.getMonth()) {
         events.push({
            type: 'Eclipse',
            text: `Éclipse Solaire (${solarEclipse.kind})`,
            kind: solarEclipse.kind
        });
    }

    const lunarEclipse = Astronomy.SearchLunarEclipse(searchStart);
    if (lunarEclipse.peak.date.getDate() === date.getDate() && lunarEclipse.peak.date.getMonth() === date.getMonth()) {
         events.push({
            type: 'Eclipse',
            text: `Éclipse Lunaire (${lunarEclipse.kind})`,
            kind: lunarEclipse.kind
        });
    }

    return events;
};

const getDayEventsSummary = (date) => {
    const events = [];
    
    try {
        // 1. Moon Phase (Exact Quarter)
        const yesterday = new Date(date);
        yesterday.setDate(date.getDate() - 1);
        const nextQuarter = Astronomy.SearchMoonQuarter(yesterday);
        if (nextQuarter && nextQuarter.time.date.getDate() === date.getDate()) {
            const qNames = ["Nouvelle Lune", "1er Quartier", "Pleine Lune", "Dernier Quartier"];
            events.push({ type: 'Phase', label: qNames[nextQuarter.quarter], color: 'text-purple-500' });
        }

        // 2. Apsis
        const nextApsis = Astronomy.SearchLunarApsis(yesterday);
        if (nextApsis && nextApsis.time.date.getDate() === date.getDate()) {
            events.push({ type: 'Apsis', label: nextApsis.kind === 0 ? "Périgée" : "Apogée", color: 'text-blue-500' });
        }

        // 3. Conjunctions & Oppositions (Restored for dots)
        const bodies = [
            { id: Astronomy.Body.Mercury, name: "Mercure" },
            { id: Astronomy.Body.Venus, name: "Vénus" },
            { id: Astronomy.Body.Mars, name: "Mars" },
            { id: Astronomy.Body.Jupiter, name: "Jupiter" },
            { id: Astronomy.Body.Saturn, name: "Saturne" }
        ];

        // Moon-Planet
        for (const p of bodies) {
             const checkDate = new Date(date); checkDate.setHours(12,0,0,0);
             const angle = getAngleBetween(Astronomy.Body.Moon, p.id, checkDate);
             if (angle < 6) {
                 const getValue = (d) => getAngleBetween(Astronomy.Body.Moon, p.id, d);
                 if (isLocalExtremum(date, getValue, true)) {
                     events.push({ type: 'Conjunction', label: `Lune-${p.name}`, color: 'text-yellow-400' });
                 }
             }
        }
        
        // Planet-Planet
        for (let i = 0; i < bodies.length; i++) {
            for (let j = i + 1; j < bodies.length; j++) {
                 const checkDate = new Date(date); checkDate.setHours(12,0,0,0);
                 const angle = getAngleBetween(bodies[i].id, bodies[j].id, checkDate);
                 if (angle < 2) {
                     const getValue = (d) => getAngleBetween(bodies[i].id, bodies[j].id, d);
                     if (isLocalExtremum(date, getValue, true)) {
                        events.push({ type: 'Conjunction', label: `${bodies[i].name}-${bodies[j].name}`, color: 'text-yellow-400' });
                     }
                 }
            }
        }

        // Oppositions
        for (const p of bodies) {
            const checkDate = new Date(date); checkDate.setHours(12,0,0,0);
            const el = Astronomy.Elongation(p.id, checkDate);
            if (el.elongation > 178) {
                const getValue = (d) => Astronomy.Elongation(p.id, d).elongation;
                if (isLocalExtremum(date, getValue, false)) {
                    events.push({ type: 'Opposition', label: `Opp. ${p.name}`, color: 'text-red-400' });
                }
            }
        }

        // 4. Meteor Showers
        const shower = METEOR_SHOWERS.find(s => s.month === date.getMonth() && s.day === date.getDate());
        if (shower) events.push({ type: 'MeteorShower', label: shower.name, color: 'text-teal-400' });

        // 5. Seasons
        const seasons = Astronomy.Seasons(date.getFullYear());
        const seasonEvents = [
            { name: "Printemps", date: seasons.mar_equinox.date },
            { name: "Été", date: seasons.jun_solstice.date },
            { name: "Automne", date: seasons.sep_equinox.date },
            { name: "Hiver", date: seasons.dec_solstice.date }
        ];
        const season = seasonEvents.find(s => s.date.getDate() === date.getDate() && s.date.getMonth() === date.getMonth());
        if (season) {
            events.push({ type: 'Season', label: season.name, color: 'text-green-500' });
        }

        // 6. Eclipses
        const searchStart = new Date(date); searchStart.setDate(date.getDate() - 1);
        
        const solarEclipse = Astronomy.SearchGlobalSolarEclipse(searchStart);
        if (solarEclipse.peak.date.getDate() === date.getDate() && solarEclipse.peak.date.getMonth() === date.getMonth()) {
             events.push({ type: 'Eclipse', label: 'Éclipse Solaire', color: 'text-purple-800' });
        }
    
        const lunarEclipse = Astronomy.SearchLunarEclipse(searchStart);
        if (lunarEclipse.peak.date.getDate() === date.getDate() && lunarEclipse.peak.date.getMonth() === date.getMonth()) {
             events.push({ type: 'Eclipse', label: 'Éclipse Lunaire', color: 'text-purple-800' });
        }

    } catch (e) {
        console.error("Error in getDayEventsSummary", e);
    }

    return events;
};

const AstroCalendar = ({ isDarkMode = true }) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEvents, setSelectedEvents] = useState([]);
  
  // New Features State
  const [filters, setFilters] = useState({ moon: true, planets: true, meteor: true, season: true, eclipse: true });
  const [photoHours, setPhotoHours] = useState({ morning: '--:-- - --:--', evening: '--:-- - --:--' });
  const [visiblePlanets, setVisiblePlanets] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Default Observer (Paris)
  const [latitude, setLatitude] = useState(48.8566);
  const [longitude, setLongitude] = useState(2.3522);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleGeolocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
      }, (error) => {
        console.error("Error getting location:", error);
        alert("Impossible de récupérer votre position.");
      });
    } else {
      alert("La géolocalisation n'est pas supportée par votre navigateur.");
    }
  };

  // Update selected events when selectedDate or location changes
  useEffect(() => {
    const observer = new Astronomy.Observer(latitude, longitude, 0);
    setSelectedEvents(getAstronomicalEvents(selectedDate, observer));
    setPhotoHours(getPhotoHours(selectedDate, observer));
    setVisiblePlanets(getVisiblePlanets(selectedDate, observer));
  }, [selectedDate, latitude, longitude]);

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay(); // 0 = Sunday
  
  // Adjust for Monday start (France standard)
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const changeMonth = (delta) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1);
    setViewDate(newDate);
  };

  const resetToToday = () => {
      const today = new Date();
      setViewDate(today);
      setSelectedDate(today);
  };

  const toggleFilter = (key) => {
      setFilters(prev => ({...prev, [key]: !prev[key]}));
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
    <div className={`w-full h-full mx-auto ${isDarkMode ? 'bg-zinc-900' : 'bg-white'} shadow-2xl border ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'} flex flex-col lg:flex-row overflow-hidden`}>
      
        {/* --- LEFT: CALENDAR --- */}
        <div className="flex-1 flex flex-col border-r border-zinc-800/50">
            {/* Header */}
            <div className="flex items-center justify-between p-4 lg:p-6 border-b border-zinc-800/50">
                <div className="flex items-center gap-2 lg:gap-4">
                    <button onClick={() => changeMonth(-1)} className={`p-2 hover:text-orange-500 transition-colors ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                        <ChevronLeft />
                    </button>
                    <div className="text-center">
                        <h2 className={`text-xl lg:text-2xl font-black uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                            {monthNames[viewDate.getMonth()]} <span className="text-orange-500">{viewDate.getFullYear()}</span>
                        </h2>
                    </div>
                    <button onClick={() => changeMonth(1)} className={`p-2 hover:text-orange-500 transition-colors ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                        <ChevronRight />
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={resetToToday}
                        className={`p-2 rounded border transition-colors ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-orange-500' : 'bg-white border-zinc-200 text-zinc-600 hover:text-orange-600'}`}
                        title="Aujourd'hui"
                    >
                        <RotateCcw size={16} />
                    </button>
                    <div className="relative">
                        <button 
                            onClick={() => setShowFilters(!showFilters)}
                            className={`p-2 rounded border transition-colors ${showFilters ? 'text-orange-500 border-orange-500' : isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900'}`}
                            title="Filtres"
                        >
                            <Filter size={16} />
                        </button>
                        {showFilters && (
                            <div className={`absolute right-0 top-full mt-2 p-2 rounded shadow-xl border z-50 w-48 ${isDarkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-zinc-200'}`}>
                                <div className="space-y-1">
                                    {[
                                        { key: 'moon', label: 'Lune', icon: Moon },
                                        { key: 'planets', label: 'Planètes', icon: GitMerge },
                                        { key: 'meteor', label: 'Météores', icon: Star },
                                        { key: 'season', label: 'Saisons', icon: Leaf },
                                        { key: 'eclipse', label: 'Éclipses', icon: CircleDot },
                                    ].map(f => (
                                        <button 
                                            key={f.key}
                                            onClick={() => toggleFilter(f.key)}
                                            className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs font-bold uppercase ${filters[f.key] ? (isDarkMode ? 'bg-zinc-800 text-white' : 'bg-gray-100 text-zinc-900') : (isDarkMode ? 'text-zinc-500 hover:bg-zinc-800' : 'text-zinc-400 hover:bg-gray-50')}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <f.icon size={12} />
                                                <span>{f.label}</span>
                                            </div>
                                            {filters[f.key] && <Check size={12} className="text-orange-500" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 flex flex-col p-2 lg:p-6 overflow-y-auto">
                <div className="grid grid-cols-7 mb-2">
                    {weekDays.map(day => (
                        <div key={day} className={`text-center text-[10px] lg:text-xs font-mono font-bold py-2 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1 lg:gap-2 auto-rows-fr">
                    {[...Array(startOffset)].map((_, i) => (
                        <div key={`empty-${i}`} className={`min-h-[60px] lg:min-h-[100px] ${isDarkMode ? 'bg-zinc-900/30' : 'bg-zinc-100'}`}></div>
                    ))}

                    {[...Array(daysInMonth)].map((_, i) => {
                        const day = i + 1;
                        const currentLoopDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day, 12, 0, 0);
                        const today = isToday(day);
                        const selected = isSelected(day);
                        
                        const { phase, illumination } = getMoonPhaseData(currentLoopDate);
                        const dayEvents = getDayEventsSummary(currentLoopDate);
                        
                        // Apply Filters
                        const filteredEvents = dayEvents.filter(evt => {
                            if (evt.type === 'Phase' && !filters.moon) return false;
                            if ((evt.type === 'Conjunction' || evt.type === 'Opposition' || evt.type === 'Apsis') && !filters.planets) return false;
                            if (evt.type === 'MeteorShower' && !filters.meteor) return false;
                            if (evt.type === 'Season' && !filters.season) return false;
                            if (evt.type === 'Eclipse' && !filters.eclipse) return false;
                            return true;
                        });

                        return (
                            <button 
                                key={day}
                                onClick={() => handleDayClick(day)}
                                className={`relative p-1 lg:p-2 flex flex-col justify-between transition-all border group min-h-[60px] lg:min-h-[100px]
                                    ${selected ? 'border-orange-500 ring-1 ring-orange-500 z-10' : isDarkMode ? 'border-zinc-800 hover:bg-zinc-800' : 'border-zinc-200 hover:bg-gray-50'}
                                    ${isDarkMode ? 'bg-zinc-900' : 'bg-white'}
                                `}
                            >
                                <div className="flex justify-between items-start w-full mb-1">
                                    <span className={`text-xs lg:text-sm font-mono font-bold ${today ? 'text-orange-500' : isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                                        {day}
                                    </span>
                                    <div className="flex items-center gap-1" title={`Illumination: ${illumination}%`}>
                                        {getPhaseIcon(phase, `w-2.5 h-2.5 lg:w-3 lg:h-3 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`)}
                                    </div>
                                </div>
                                
                                {/* Events List (Compact) */}
                                <div className="flex flex-col gap-0.5 w-full overflow-hidden">
                                    {filteredEvents.slice(0, 2).map((evt, idx) => (
                                        <div key={idx} className="flex items-center gap-1 w-full">
                                            <div className={`w-1 h-1 rounded-full shrink-0 ${evt.color.replace('text-', 'bg-')}`}></div>
                                            <span className={`text-[8px] lg:text-[9px] font-bold truncate w-full text-left ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'} hidden sm:block`}>
                                                {evt.label}
                                            </span>
                                        </div>
                                    ))}
                                    {/* Mobile Dots only if text hidden */}
                                    <div className="flex sm:hidden gap-0.5">
                                         {filteredEvents.slice(0, 3).map((evt, idx) => (
                                            <div key={idx} className={`w-1 h-1 rounded-full ${evt.color.replace('text-', 'bg-')}`}></div>
                                         ))}
                                    </div>

                                    {filteredEvents.length > 2 && (
                                        <span className="text-[8px] lg:text-[9px] text-zinc-500 italic text-left pl-2 hidden sm:block">+{filteredEvents.length - 2}</span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>

        {/* --- RIGHT: SIDE PANEL --- */}
        <div className={`w-full lg:w-96 flex flex-col border-l ${isDarkMode ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-200 bg-gray-50'} overflow-y-auto min-h-[300px] lg:min-h-0`}>
            {/* Panel Header */}
            <div className="p-6 border-b border-zinc-800/50">
                 <div className="flex items-center justify-between mb-4">
                    <div className={`flex items-center gap-2 px-2 py-1 rounded border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                        <Clock size={12} className="text-zinc-500" />
                        <span className={`text-xs font-mono font-bold ${isDarkMode ? 'text-orange-500' : 'text-orange-600'}`}>
                            {now.toLocaleTimeString()}
                        </span>
                    </div>
                    <button 
                        onClick={handleGeolocation}
                        className={`p-2 rounded border transition-colors ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-orange-500' : 'bg-white border-zinc-200 text-zinc-600 hover:text-orange-600'}`}
                        title="Utiliser ma position"
                    >
                        <Locate size={14} />
                    </button>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <h3 className={`text-2xl font-black uppercase ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                            {selectedDate.getDate()} {monthNames[selectedDate.getMonth()]}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                            <Sparkles size={12} className="text-purple-500" />
                            <span className="text-xs font-bold uppercase text-purple-500">{getZodiacSign(selectedDate)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Panel Content */}
            <div className="p-6 space-y-6">
                
                {/* Photography Hours */}
                <div className={`p-3 rounded border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                    <div className="flex items-center gap-2 mb-3 border-b border-zinc-800/50 pb-2">
                        <Camera size={14} className="text-orange-500" />
                        <span className="text-xs font-bold uppercase text-zinc-500">Heures Dorées & Bleues</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="text-[10px] font-bold uppercase text-zinc-500 block mb-1">Matin</span>
                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-blue-400">Bleue</span>
                                    <span className={`font-mono ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>{photoHours.morning.split(' - ')[0]}</span>
                                </div>
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-orange-400">Dorée</span>
                                    <span className={`font-mono ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>{photoHours.morning.split(' - ')[1]}</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold uppercase text-zinc-500 block mb-1">Soir</span>
                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-orange-400">Dorée</span>
                                    <span className={`font-mono ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>{photoHours.evening.split(' - ')[0]}</span>
                                </div>
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-blue-400">Bleue</span>
                                    <span className={`font-mono ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>{photoHours.evening.split(' - ')[1]}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Visible Planets */}
                {visiblePlanets.length > 0 && (
                    <div className={`p-3 rounded border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                        <div className="flex items-center gap-2 mb-3 border-b border-zinc-800/50 pb-2">
                            <Eye size={14} className="text-teal-500" />
                            <span className="text-xs font-bold uppercase text-zinc-500">Planètes Visibles</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {visiblePlanets.map((p, idx) => (
                                <div key={idx} className={`px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1.5 ${isDarkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-700'}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${p.time === 'Matin' ? 'bg-blue-400' : 'bg-orange-400'}`}></div>
                                    <span>{p.name}</span>
                                    <span className="text-zinc-500 text-[8px]">({p.time})</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Ephemeris */}
                <div className="grid grid-cols-2 gap-3">
                    {selectedEvents.filter(e => e.type === 'Ephemeris').map((evt, idx) => (
                        <div key={idx} className={`p-3 rounded border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                            <div className="flex items-center gap-2 mb-2">
                                {evt.subtype === 'Sun' ? <Sun size={14} className="text-orange-500" /> : <Moon size={14} className="text-zinc-400" />}
                                <span className="text-[10px] font-bold uppercase">{evt.subtype === 'Sun' ? 'Soleil' : 'Lune'}</span>
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-zinc-500">Lever</span>
                                    <span className="font-mono font-bold text-green-500">{evt.rise || '--:--'}</span>
                                </div>
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-zinc-500">Coucher</span>
                                    <span className="font-mono font-bold text-red-500">{evt.set || '--:--'}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Events List */}
                <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase text-zinc-500 border-b border-zinc-800 pb-2">Événements</h4>
                    {selectedEvents.filter(e => e.type !== 'Ephemeris' && e.type !== 'PhaseStatus').length > 0 ? (
                        selectedEvents.filter(e => e.type !== 'Ephemeris' && e.type !== 'PhaseStatus').map((evt, idx) => (
                            <div key={idx} className={`flex items-center justify-between p-3 rounded border ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                                <div className="flex items-center gap-3">
                                    {evt.type === 'PhaseEvent' ? <Moon size={16} className="text-purple-400" /> :
                                    evt.type === 'Apsis' ? <Rocket size={16} className="text-blue-400" /> :
                                    evt.type === 'Conjunction' ? <GitMerge size={16} className="text-yellow-400" /> :
                                    evt.type === 'Opposition' ? <ArrowLeftRight size={16} className="text-red-400" /> :
                                    evt.type === 'MeteorShower' ? <Star size={16} className="text-teal-400" /> :
                                    evt.type === 'Season' ? (evt.seasonIcon === 'Sun' ? <Sun size={16} className="text-orange-400" /> : evt.seasonIcon === 'Snowflake' ? <Snowflake size={16} className="text-blue-300" /> : <Leaf size={16} className="text-green-400" />) :
                                    evt.type === 'Eclipse' ? <CircleDot size={16} className="text-purple-800" /> :
                                    <Info size={16} className="text-zinc-500" />}
                                    
                                    <div>
                                        <p className={`text-sm font-bold leading-tight ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>{evt.text}</p>
                                        <p className="text-[10px] text-zinc-500 font-mono uppercase mt-0.5">{evt.type}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => downloadICS(evt, selectedDate)}
                                    className={`p-1.5 rounded transition-colors ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-500 hover:text-white' : 'hover:bg-gray-100 text-zinc-400 hover:text-zinc-600'}`}
                                    title="Ajouter au calendrier"
                                >
                                    <Download size={14} />
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-sm text-zinc-500 italic">Aucun événement majeur.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default AstroCalendar;
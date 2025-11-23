import React, { useState, useEffect, useRef } from 'react';
import { Github, Linkedin, Mail, ExternalLink, Code, Moon, Sun, Menu, X, ChevronRight, Terminal, Database, Cpu, Zap, Shield, Monitor, Activity, GitCommit } from 'lucide-react';

// --- MOCK DATA ---
const PROJECTS = [
    {
        id: 1,
        title: "Ganymede",
        description: "Protocole central hébergé sur GitHub. Exploration avancée des systèmes logiciels et architectures complexes.",
        tags: ["System", "GitHub", "Open Source"],
        link: "https://github.com/Greg50100/Ganymede",
        github: "https://github.com/Greg50100/Ganymede",
        featured: true,
        status: "ONLINE"
    },
    {
        id: 2,
        title: "Dashboard Analytics",
        description: "Interface de commandement responsive avec télémétrie en temps réel et gestion des opérateurs.",
        tags: ["React", "Tailwind", "Data Viz"],
        link: "#",
        github: "#",
        featured: false,
        status: "STABLE"
    },
    {
        id: 3,
        title: "API RESTful Secure",
        description: "Backend blindé avec authentification JWT et documentation technique intégrée.",
        tags: ["Node.js", "Security", "DB"],
        link: "#",
        github: "#",
        featured: false,
        status: "ACTIVE"
    }
];

const SKILLS = [
    { name: "Frontend Core", icon: <Monitor size={20} />, items: ["React", "TypeScript", "Tailwind", "Next.js"] },
    { name: "Backend Systems", icon: <Terminal size={20} />, items: ["Node.js", "Python", "Go", "Express"] },
    { name: "Data Storage", icon: <Database size={20} />, items: ["PostgreSQL", "MongoDB", "Redis"] },
    { name: "Infrastructure", icon: <Cpu size={20} />, items: ["Docker", "AWS", "CI/CD", "Git"] },
];

// --- COMPONENTS ---

const Navbar = ({ isDarkMode, toggleTheme, isMenuOpen, setIsMenuOpen }) => {
    const navLinks = [
        { name: 'ACCUEIL', href: '#home' },
        { name: 'PROJETS', href: '#projects' },
        { name: 'MODULES', href: '#skills' },
        { name: 'LIAISON', href: '#contact' },
    ];

    return (
        <nav className={`fixed w-full z-50 transition-all duration-300 border-b ${isDarkMode ? 'bg-zinc-950/95 border-orange-500/30' : 'bg-zinc-100/95 border-orange-500/20'} backdrop-blur-md`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex-shrink-0 flex items-center group cursor-pointer">
                        <div className={`mr-2 p-1 border ${isDarkMode ? 'border-orange-500 text-orange-500' : 'border-orange-600 text-orange-600'}`}>
                            <Zap size={18} />
                        </div>
                        <span className={`font-mono text-xl tracking-widest font-bold ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
                            GREG<span className="text-orange-500">.MECH</span>
                        </span>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-8">
                        {navLinks.map((link) => (
                            <a
                                key={link.name}
                                href={link.href}
                                className={`text-xs font-mono tracking-widest transition-colors hover:text-orange-500 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}
                            >
                                <span className="text-orange-500 mr-1">{`//`}</span>{link.name}
                            </a>
                        ))}
                        <button
                            onClick={toggleTheme}
                            className={`p-2 border transition-all hover:shadow-[0_0_10px_rgba(249,115,22,0.5)] ${isDarkMode ? 'bg-zinc-900 border-zinc-700 text-orange-400 hover:border-orange-500' : 'bg-zinc-200 border-zinc-300 text-zinc-700 hover:border-orange-500'}`}
                        >
                            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className={`p-2 border ${isDarkMode ? 'text-orange-500 border-orange-500/30 bg-zinc-900' : 'text-orange-600 border-orange-600/30 bg-zinc-100'}`}
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMenuOpen && (
                <div className={`md:hidden border-b ${isDarkMode ? 'bg-zinc-900 border-orange-500/30' : 'bg-zinc-100 border-orange-500/20'}`}>
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {navLinks.map((link) => (
                            <a
                                key={link.name}
                                href={link.href}
                                onClick={() => setIsMenuOpen(false)}
                                className={`block px-3 py-2 font-mono text-sm ${isDarkMode ? 'text-zinc-300 hover:bg-orange-500/10 hover:text-orange-400' : 'text-zinc-700 hover:bg-orange-100'
                                    }`}
                            >
                                {`> ${link.name}`}
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </nav>
    );
};

// Typewriter Hook for Hero
const useTypewriter = (text, speed = 50) => {
    const [displayText, setDisplayText] = useState('');

    useEffect(() => {
        let i = 0;
        setDisplayText(''); // Reset text when input changes
        const timer = setInterval(() => {
            if (i < text.length) {
                setDisplayText(prev => text.substring(0, i + 1));
                i++;
            } else {
                clearInterval(timer);
            }
        }, speed);
        return () => clearInterval(timer);
    }, [text, speed]);

    return displayText;
};

const Hero = ({ isDarkMode }) => {
    const typedTitle = useTypewriter("Codeur et Maker", 100);
    const [showSubtitle, setShowSubtitle] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShowSubtitle(true), 1500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <section id="home" className={`relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden ${isDarkMode ? 'bg-zinc-950' : 'bg-zinc-50'}`}>

            {/* Grid Background Effect */}
            <div className="absolute inset-0 z-0 opacity-[0.03]"
                style={{ backgroundImage: `linear-gradient(${isDarkMode ? '#fff' : '#000'} 1px, transparent 1px), linear-gradient(90deg, ${isDarkMode ? '#fff' : '#000'} 1px, transparent 1px)`, backgroundSize: '40px 40px' }}>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center lg:text-left lg:grid lg:grid-cols-2 lg:gap-12 items-center">
                    <div>
                        <div className={`inline-flex items-center gap-2 px-3 py-1 mb-6 text-xs font-mono border animate-pulse ${isDarkMode ? 'border-orange-500/50 text-orange-400 bg-orange-500/10' : 'border-orange-600/50 text-orange-700 bg-orange-100'}`}>
                            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                            SYSTEM_STATUS: ONLINE
                        </div>

                        <h1 className={`h-32 sm:h-auto text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter mb-6 uppercase ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                            {typedTitle} <span className="animate-blink">_</span> <br />
                            <span className={`transition-opacity duration-1000 ${showSubtitle ? 'opacity-100' : 'opacity-0'} text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600`}>
                                Autodidacte
                            </span>
                        </h1>

                        <p className={`text-lg sm:text-xl mb-8 max-w-2xl mx-auto lg:mx-0 font-light transition-all duration-1000 delay-500 ${showSubtitle ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                            Construction d'outils numériques et d'architectures logicielles par la pratique.
                            Initialisation du portfolio et chargement du module <span className="font-mono text-orange-500">Ganymede</span>.
                        </p>

                        <div className={`flex flex-col sm:flex-row justify-center lg:justify-start gap-4 transition-all duration-1000 delay-700 ${showSubtitle ? 'opacity-100' : 'opacity-0'}`}>
                            <a
                                href="#projects"
                                className="group relative inline-flex items-center justify-center px-8 py-3 text-base font-bold text-white transition-all bg-orange-600 hover:bg-orange-700 clip-path-slant"
                                style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                            >
                                <span className="mr-2">ACCÉDER AUX PROJETS</span>
                                <ChevronRight className="transition-transform group-hover:translate-x-1" size={20} />
                            </a>
                            <a
                                href="https://github.com/Greg50100"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`group inline-flex items-center justify-center px-8 py-3 text-base font-bold border-2 transition-all ${isDarkMode
                                        ? 'border-zinc-700 text-zinc-300 hover:border-orange-500 hover:text-orange-500'
                                        : 'border-zinc-300 text-zinc-700 hover:border-orange-600 hover:text-orange-600'
                                    }`}
                                style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                            >
                                <Github className="mr-2 group-hover:animate-pulse" size={20} />
                                GITHUB_LINK
                            </a>
                        </div>
                    </div>

                    {/* Tech Decoration */}
                    <div className="mt-12 lg:mt-0 relative hidden lg:block">
                        <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg blur opacity-20"></div>
                        <div className={`relative p-1 ${isDarkMode ? 'bg-zinc-900' : 'bg-white'} clip-path-tech`}
                            style={{ clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)' }}>
                            <div className={`border-l-2 border-orange-500 p-6 h-full ${isDarkMode ? 'bg-zinc-950 text-zinc-300' : 'bg-zinc-50 text-zinc-800'}`}>
                                <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-2">
                                    <span className="text-xs font-mono text-orange-500">CONFIDENTIAL // GREG_DEV</span>
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-orange-500 animate-pulse"></div>
                                        <div className="w-2 h-2 bg-zinc-700"></div>
                                        <div className="w-2 h-2 bg-zinc-700"></div>
                                    </div>
                                </div>

                                <div className="font-mono text-sm space-y-2">
                                    <p><span className="text-orange-600">const</span> <span className="text-blue-400">entity</span> = <span className="text-zinc-500">{`{`}</span></p>
                                    <p className="pl-4 border-l border-zinc-800 ml-1">ID: <span className="text-green-500">'Greg50100'</span>,</p>
                                    <p className="pl-4 border-l border-zinc-800 ml-1">Type: <span className="text-green-500">'Maker & Coder'</span>,</p>
                                    <p className="pl-4 border-l border-zinc-800 ml-1">Core_Repo: <span className="text-green-500">'Ganymede'</span>,</p>
                                    <p className="pl-4 border-l border-zinc-800 ml-1">Learning: <span className="text-orange-500">SELF_TAUGHT</span></p>
                                    <p><span className="text-zinc-500">{`}`}</span>;</p>
                                    <p className="mt-4 text-xs text-zinc-500">// Initialize connection...</p>
                                    <p className="text-xs animate-pulse text-orange-500">{`>_ Connection established.`}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const ProjectCard = ({ project, isDarkMode }) => (
    <div className={`group relative border transition-all duration-300 hover:-translate-y-1 ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:border-orange-500/50' : 'bg-white border-zinc-200 hover:border-orange-500/50'}`}>
        {/* Decorative corners */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-orange-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-orange-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-orange-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-orange-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

        <div className={`h-40 w-full overflow-hidden flex items-center justify-center border-b ${isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-100 border-zinc-200'}`}>
            <Code size={40} className={`transition-colors ${isDarkMode ? 'text-zinc-700 group-hover:text-orange-500' : 'text-zinc-400 group-hover:text-orange-600'}`} />
        </div>

        <div className="p-6">
            <div className="flex justify-between items-start mb-3">
                <h3 className={`text-lg font-bold uppercase tracking-wide ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>{project.title}</h3>
                <div className={`text-[10px] font-mono px-1 border ${isDarkMode ? 'border-orange-500/30 text-orange-500' : 'border-orange-600/30 text-orange-600'}`}>
                    {project.status}
                </div>
            </div>

            <p className={`mb-4 text-sm font-light ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {project.description}
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
                {project.tags.map((tag) => (
                    <span
                        key={tag}
                        className={`px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider border ${isDarkMode ? 'bg-zinc-950 border-zinc-700 text-zinc-400' : 'bg-zinc-50 border-zinc-300 text-zinc-600'}`}
                    >
                        {tag}
                    </span>
                ))}
            </div>

            <div className="flex space-x-4 mt-auto pt-4 border-t border-zinc-800/50">
                <a href={project.github} target="_blank" rel="noopener noreferrer" className={`text-sm font-bold flex items-center transition-colors ${isDarkMode ? 'text-zinc-500 hover:text-orange-500' : 'text-zinc-500 hover:text-orange-600'}`}>
                    <Github size={16} className="mr-2" /> CODE
                </a>
                <a href={project.link} target="_blank" rel="noopener noreferrer" className={`text-sm font-bold flex items-center transition-colors ${isDarkMode ? 'text-zinc-500 hover:text-orange-500' : 'text-zinc-500 hover:text-orange-600'}`}>
                    <ExternalLink size={16} className="mr-2" /> DEPLOY
                </a>
            </div>
        </div>
    </div>
);

const Skills = ({ isDarkMode }) => {
    return (
        <section id="skills" className={`py-20 border-y ${isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center mb-16">
                    <h2 className={`text-3xl font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Modules Techniques</h2>
                    <div className="w-24 h-1 bg-orange-600"></div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {SKILLS.map((skillGroup) => (
                        <div key={skillGroup.name} className={`p-6 border-l-2 transition-all hover:translate-x-1 ${isDarkMode ? 'bg-zinc-900/50 border-orange-500/50' : 'bg-white border-orange-600/30 shadow-sm'}`}>
                            <div className="flex items-center mb-4 space-x-3">
                                <div className={`${isDarkMode ? 'text-orange-500' : 'text-orange-600'}`}>
                                    {skillGroup.icon}
                                </div>
                                <h3 className={`font-bold font-mono uppercase text-sm ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>{skillGroup.name}</h3>
                            </div>
                            <ul className="space-y-2">
                                {skillGroup.items.map((item) => (
                                    <li key={item} className={`flex items-center text-xs font-mono ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                                        <span className="mr-2 text-orange-500">{`>>`}</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const Contact = ({ isDarkMode }) => {
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });
    const [status, setStatus] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setStatus('sending');
        setTimeout(() => {
            setStatus('sent');
            setFormData({ name: '', email: '', message: '' });
        }, 1500);
    };

    return (
        <section id="contact" className={`py-20 ${isDarkMode ? 'bg-zinc-900' : 'bg-white'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                    <div>
                        <div className="inline-block mb-4 border-b border-orange-500 pb-1">
                            <h2 className={`text-3xl font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Initialiser Liaison</h2>
                        </div>
                        <p className={`text-lg mb-8 font-light ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                            Protocole de communication ouvert. Pour toute demande de collaboration ou accès aux données supplémentaires.
                        </p>

                        <div className="space-y-4">
                            <a href="mailto:contact@example.com" className={`group flex items-center p-4 border transition-colors ${isDarkMode ? 'border-zinc-800 bg-zinc-950 hover:border-orange-500/50' : 'border-zinc-200 bg-zinc-50 hover:border-orange-400/50'}`}>
                                <div className={`p-2 mr-4 ${isDarkMode ? 'bg-zinc-900 text-orange-500' : 'bg-zinc-200 text-orange-600'}`}>
                                    <Mail size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-mono uppercase text-zinc-500">Canal Email</p>
                                    <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>greg@example.com</p>
                                </div>
                            </a>
                            <a href="https://github.com/Greg50100" target="_blank" rel="noopener noreferrer" className={`group flex items-center p-4 border transition-colors ${isDarkMode ? 'border-zinc-800 bg-zinc-950 hover:border-orange-500/50' : 'border-zinc-200 bg-zinc-50 hover:border-orange-400/50'}`}>
                                <div className={`p-2 mr-4 ${isDarkMode ? 'bg-zinc-900 text-orange-500' : 'bg-zinc-200 text-orange-600'}`}>
                                    <Github size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-mono uppercase text-zinc-500">Base GitHub</p>
                                    <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Greg50100</p>
                                </div>
                            </a>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className={`p-1 ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`} style={{ clipPath: 'polygon(20px 0, 100% 0, 100% 100%, 0 100%, 0 20px)' }}>
                        <div className={`h-full p-8 ${isDarkMode ? 'bg-zinc-950' : 'bg-white'}`}>
                            <div className="mb-6 relative group">
                                <label htmlFor="name" className={`block text-xs font-mono uppercase mb-2 ${isDarkMode ? 'text-zinc-500 group-focus-within:text-orange-500' : 'text-zinc-500 group-focus-within:text-orange-600'}`}>Identifiant</label>
                                <input
                                    type="text"
                                    id="name"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className={`w-full bg-transparent border-b-2 px-2 py-2 outline-none font-mono transition-colors ${isDarkMode ? 'border-zinc-800 text-white focus:border-orange-500' : 'border-zinc-300 text-zinc-900 focus:border-orange-600'}`}
                                    placeholder="NOM_UTILISATEUR"
                                />
                            </div>
                            <div className="mb-6 relative group">
                                <label htmlFor="email" className={`block text-xs font-mono uppercase mb-2 ${isDarkMode ? 'text-zinc-500 group-focus-within:text-orange-500' : 'text-zinc-500 group-focus-within:text-orange-600'}`}>Fréquence de contact</label>
                                <input
                                    type="email"
                                    id="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className={`w-full bg-transparent border-b-2 px-2 py-2 outline-none font-mono transition-colors ${isDarkMode ? 'border-zinc-800 text-white focus:border-orange-500' : 'border-zinc-300 text-zinc-900 focus:border-orange-600'}`}
                                    placeholder="EMAIL@DOMAINE.COM"
                                />
                            </div>
                            <div className="mb-8 relative group">
                                <label htmlFor="message" className={`block text-xs font-mono uppercase mb-2 ${isDarkMode ? 'text-zinc-500 group-focus-within:text-orange-500' : 'text-zinc-500 group-focus-within:text-orange-600'}`}>Transmission de données</label>
                                <textarea
                                    id="message"
                                    rows="4"
                                    required
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    className={`w-full bg-transparent border-b-2 px-2 py-2 outline-none font-mono transition-colors ${isDarkMode ? 'border-zinc-800 text-white focus:border-orange-500' : 'border-zinc-300 text-zinc-900 focus:border-orange-600'}`}
                                    placeholder="..."
                                ></textarea>
                            </div>
                            <button
                                type="submit"
                                disabled={status === 'sending' || status === 'sent'}
                                className={`w-full py-3 px-6 font-bold uppercase tracking-widest text-white transition-all flex items-center justify-center ${status === 'sent' ? 'bg-green-600' : 'bg-orange-600 hover:bg-orange-700 hover:shadow-[0_0_15px_rgba(234,88,12,0.4)]'}`}
                                style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                            >
                                {status === 'sending' ? 'TRANSMISSION...' : status === 'sent' ? 'ENVOYÉ' : 'TRANSMETTRE'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </section>
    );
};

const Footer = ({ isDarkMode }) => (
    <footer className={`py-8 border-t ${isDarkMode ? 'bg-zinc-950 border-zinc-900' : 'bg-zinc-100 border-zinc-200'}`}>
        <div className="max-w-7xl mx-auto px-4 text-center">
            <p className={`text-xs font-mono uppercase tracking-widest ${isDarkMode ? 'text-zinc-600' : 'text-zinc-500'}`}>
                SYSTEM_ID: GREG.DEV // © {new Date().getFullYear()} // STATUS: OPERATIONAL
            </p>
        </div>
    </footer>
);

// --- MAIN APP COMPONENT ---

export default function App() {
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setIsDarkMode(true);
        }
    }, []);

    const toggleTheme = () => setIsDarkMode(!isDarkMode);

    return (
        <div className={`min-h-screen transition-colors duration-300 font-sans ${isDarkMode ? 'bg-zinc-950' : 'bg-zinc-50'}`}>
            <Navbar
                isDarkMode={isDarkMode}
                toggleTheme={toggleTheme}
                isMenuOpen={isMenuOpen}
                setIsMenuOpen={setIsMenuOpen}
            />

            <main>
                <Hero isDarkMode={isDarkMode} />

                <section id="projects" className={`py-20 border-t ${isDarkMode ? 'border-zinc-900' : 'border-zinc-200'}`}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col md:flex-row justify-between items-end mb-12">
                            <div>
                                <h2 className={`text-3xl font-black uppercase tracking-tighter mb-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                                    Archives <span className="text-orange-500">Projets</span>
                                </h2>
                                <div className="w-12 h-1 bg-orange-600 mb-4"></div>
                                <p className={`font-mono text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                   // Chargement des modules récents...
                                </p>
                            </div>
                            <div className={`hidden md:block font-mono text-xs ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>
                                DISPLAY_MODE: GRID
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {PROJECTS.map((project) => (
                                <ProjectCard key={project.id} project={project} isDarkMode={isDarkMode} />
                            ))}
                        </div>
                    </div>
                </section>

                <Skills isDarkMode={isDarkMode} />
                <Contact isDarkMode={isDarkMode} />
            </main>

            <Footer isDarkMode={isDarkMode} />
        </div>
    );
}
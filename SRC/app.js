import { createElement as h, useState, useEffect, useRef } from 'react';
import BackgroundManager from './background-engine/background-manager.js';
import ClimateConsciousness from './ai-climate-entity/climate-consciousness.js';
import ThreatDetector from './security-system/threat-detector.js';
import GeoLocator from './utils/geo-locator.js';

// SVG Icons as components
const Cloud = ({ size = 24, className = "" }) => h('svg', { 
    xmlns: 'http://www.w3.org/2000/svg', 
    width: size, 
    height: size, 
    viewBox: '0 0 24 24', 
    fill: 'none', 
    stroke: 'currentColor', 
    strokeWidth: '2', 
    strokeLinecap: 'round', 
    strokeLinejoin: 'round',
    className 
}, h('path', { d: 'M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z' }));

const Wind = ({ size = 24, className = "" }) => h('svg', { 
    xmlns: 'http://www.w3.org/2000/svg', 
    width: size, 
    height: size, 
    viewBox: '0 0 24 24', 
    fill: 'none', 
    stroke: 'currentColor', 
    strokeWidth: '2', 
    strokeLinecap: 'round', 
    strokeLinejoin: 'round',
    className 
}, [
    h('path', { d: 'M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2' }),
    h('path', { d: 'M9.6 4.6A2 2 0 1 1 11 8H2' }),
    h('path', { d: 'M12.6 19.4A2 2 0 1 0 14 16H2' })
]);

const Droplets = ({ size = 24, className = "" }) => h('svg', { 
    xmlns: 'http://www.w3.org/2000/svg', 
    width: size, 
    height: size, 
    viewBox: '0 0 24 24', 
    fill: 'none', 
    stroke: 'currentColor', 
    strokeWidth: '2', 
    strokeLinecap: 'round', 
    strokeLinejoin: 'round',
    className 
}, [
    h('path', { d: 'M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z' }),
    h('path', { d: 'M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97' })
]);

const Sun = ({ size = 24, className = "" }) => h('svg', { 
    xmlns: 'http://www.w3.org/2000/svg', 
    width: size, 
    height: size, 
    viewBox: '0 0 24 24', 
    fill: 'none', 
    stroke: 'currentColor', 
    strokeWidth: '2', 
    strokeLinecap: 'round', 
    strokeLinejoin: 'round',
    className 
}, [
    h('circle', { cx: '12', cy: '12', r: '4' }),
    h('path', { d: 'M12 2v2' }),
    h('path', { d: 'M12 20v2' }),
    h('path', { d: 'm4.93 4.93 1.41 1.41' }),
    h('path', { d: 'm17.66 17.66 1.41 1.41' }),
    h('path', { d: 'M2 12h2' }),
    h('path', { d: 'M20 12h2' }),
    h('path', { d: 'm6.34 17.66-1.41 1.41' }),
    h('path', { d: 'm19.07 4.93-1.41 1.41' })
]);

const Moon = ({ size = 24, className = "" }) => h('svg', { 
    xmlns: 'http://www.w3.org/2000/svg', 
    width: size, 
    height: size, 
    viewBox: '0 0 24 24', 
    fill: 'none', 
    stroke: 'currentColor', 
    strokeWidth: '2', 
    strokeLinecap: 'round', 
    strokeLinejoin: 'round',
    className 
}, h('path', { d: 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z' }));

const Search = ({ size = 24, className = "" }) => h('svg', { 
    xmlns: 'http://www.w3.org/2000/svg', 
    width: size, 
    height: size, 
    viewBox: '0 0 24 24', 
    fill: 'none', 
    stroke: 'currentColor', 
    strokeWidth: '2', 
    strokeLinecap: 'round', 
    strokeLinejoin: 'round',
    className 
}, [
    h('circle', { cx: '11', cy: '11', r: '8' }),
    h('path', { d: 'm21 21-4.3-4.3' })
]);

const MapPin = ({ size = 24, className = "" }) => h('svg', { 
    xmlns: 'http://www.w3.org/2000/svg', 
    width: size, 
    height: size, 
    viewBox: '0 0 24 24', 
    fill: 'none', 
    stroke: 'currentColor', 
    strokeWidth: '2', 
    strokeLinecap: 'round', 
    strokeLinejoin: 'round',
    className 
}, [
    h('path', { d: 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z' }),
    h('circle', { cx: '12', cy: '10', r: '3' })
]);

const Satellite = ({ size = 24, className = "" }) => h('svg', { 
    xmlns: 'http://www.w3.org/2000/svg', 
    width: size, 
    height: size, 
    viewBox: '0 0 24 24', 
    fill: 'none', 
    stroke: 'currentColor', 
    strokeWidth: '2', 
    strokeLinecap: 'round', 
    strokeLinejoin: 'round',
    className 
}, [
    h('path', { d: 'M13 10.5l4.5 4.5' }),
    h('path', { d: 'M16.5 13L21 8.5' }),
    h('path', { d: 'M8.5 21L3 15.5' }),
    h('path', { d: 'M11 13.5l4.5 4.5' }),
    h('path', { d: 'M13.5 16L18 11.5' }),
    h('path', { d: 'M6 15l-3 3' }),
    h('path', { d: 'M15 6l3-3' }),
    h('path', { d: 'M6 9L3 6' }),
    h('path', { d: 'M9 6L6 3' })
]);

const Brain = ({ size = 24, className = "" }) => h('svg', { 
    xmlns: 'http://www.w3.org/2000/svg', 
    width: size, 
    height: size, 
    viewBox: '0 0 24 24', 
    fill: 'none', 
    stroke: 'currentColor', 
    strokeWidth: '2', 
    strokeLinecap: 'round', 
    strokeLinejoin: 'round',
    className 
}, [
    h('path', { d: 'M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588 4 4 0 0 0 7.936 0A4 4 0 0 0 20 10.895a4 4 0 0 0-2.003-3.77A3 3 0 1 0 12 5' }),
    h('path', { d: 'M12 13v4' }),
    h('path', { d: 'M12 5v4' }),
    h('path', { d: 'M8 9h8' }),
    h('path', { d: 'M8 15h8' })
]);

const Shield = ({ size = 24, className = "" }) => h('svg', { 
    xmlns: 'http://www.w3.org/2000/svg', 
    width: size, 
    height: size, 
    viewBox: '0 0 24 24', 
    fill: 'none', 
    stroke: 'currentColor', 
    strokeWidth: '2', 
    strokeLinecap: 'round', 
    strokeLinejoin: 'round',
    className 
}, h('path', { d: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10' }));

const AlertTriangle = ({ size = 24, className = "" }) => h('svg', { 
    xmlns: 'http://www.w3.org/2000/svg', 
    width: size, 
    height: size, 
    viewBox: '0 0 24 24', 
    fill: 'none', 
    stroke: 'currentColor', 
    strokeWidth: '2', 
    strokeLinecap: 'round', 
    strokeLinejoin: 'round',
    className 
}, [
    h('path', { d: 'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z' }),
    h('path', { d: 'M12 9v4' }),
    h('path', { d: 'M12 17h.01' })
]);

const API_BASE_URL = 'http://localhost:3000/api';

export default function ClimateZillaApp() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [searchCity, setSearchCity] = useState('');
    const [weatherData, setWeatherData] = useState(null);
    const [issData, setIssData] = useState(null);
    const [apodData, setApodData] = useState(null);
    const [securityStatus, setSecurityStatus] = useState('secure');
    const [aiConsciousness, setAiConsciousness] = useState(0);
    const [loading, setLoading] = useState(false);
    const [animated, setAnimated] = useState(false);
    const backgroundManagerRef = useRef(null);
    const climateEntityRef = useRef(null);

    useEffect(() => {
        // Initialize systems
        const initSystems = async () => {
            setAnimated(true);
            
            // Initialize background engine
            backgroundManagerRef.current = new BackgroundManager();
            await backgroundManagerRef.current.initialize();
            
            // Initialize AI climate entity
            climateEntityRef.current = new ClimateConsciousness();
            await climateEntityRef.current.awaken();
            setAiConsciousness(climateEntityRef.current.awarenessLevel);
            
            // Initialize security system
            const threatDetector = new ThreatDetector();
            threatDetector.startMonitoring();
            
            // Auto-detect location and load data
            const location = await GeoLocator.getCurrentLocation();
            if (location) {
                setSearchCity(location.city);
                fetchWeatherData(location.city);
            }
            
            // Load space data
            fetchISSLocation();
            fetchAPOD();
            
            // Update AI consciousness level periodically
            const consciousnessInterval = setInterval(() => {
                if (climateEntityRef.current) {
                    setAiConsciousness(climateEntityRef.current.awarenessLevel);
                }
            }, 5000);
            
            return () => clearInterval(consciousnessInterval);
        };

        initSystems();
    }, []);

    const fetchWeatherData = async (cityName) => {
        setLoading(true);
        try {
            const response = await fetch(
                `${API_BASE_URL}/weather/forecast?city=${encodeURIComponent(cityName)}`
            );
            const data = await response.json();
            
            if (data.error) {
                alert(data.error.message || data.error);
                setLoading(false);
                return;
            }
            
            setWeatherData(data);
            
            // Update background based on weather
            if (backgroundManagerRef.current) {
                backgroundManagerRef.current.updateBackground(data);
            }
            
            // Inform AI entity about new weather data
            if (climateEntityRef.current) {
                climateEntityRef.current.processWeatherData(data);
            }
            
        } catch (error) {
            alert('Failed to fetch weather data. Make sure the backend server is running.');
        }
        setLoading(false);
    };

    const fetchISSLocation = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/astronomy/iss`);
            const data = await response.json();
            setIssData(data);
        } catch (error) {
            console.error('Failed to fetch ISS data');
        }
    };

    const fetchAPOD = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/astronomy/apod`);
            const data = await response.json();
            setApodData(data);
        } catch (error) {
            console.error('Failed to fetch APOD');
        }
    };

    const handleSearch = () => {
        if (searchCity.trim()) {
            fetchWeatherData(searchCity);
        }
    };

    const getWeatherIcon = (condition) => {
        const text = condition?.toLowerCase() || '';
        if (text.includes('rain') || text.includes('drizzle')) return h(Droplets, { size: 64 });
        if (text.includes('cloud')) return h(Cloud, { size: 64 });
        if (text.includes('sun') || text.includes('clear')) return h(Sun, { size: 64 });
        if (text.includes('storm') || text.includes('thunder')) return h(AlertTriangle, { size: 64 });
        return h(Cloud, { size: 64 });
    };

    const getSecurityStatusColor = () => {
        switch(securityStatus) {
            case 'secure': return 'status-secure';
            case 'warning': return 'status-warning';
            case 'danger': return 'status-danger';
            default: return 'status-secure';
        }
    };

    // Render the complete application
    return h('div', { className: 'min-h-screen text-white overflow-hidden' },
        // Main Content Container
        h('div', { className: 'container mx-auto px-4 py-6 relative z-10' },
            
            // Header Section
            h('div', { className: `text-center mb-8 transition-all duration-1000 transform ${animated ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}` },
                h('h1', { className: 'text-6xl font-bold mb-4 tracking-tight' },
                    h('span', { className: 'bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400' }, 'Climate-ZiLLA©')
                ),
                h('p', { className: 'text-xl text-gray-300 mb-2' }, 'Enterprise Weather & Security Platform'),
                h('p', { className: 'text-sm text-gray-400' }, 'FJ-cyberzilla™ - MMXXV')
            ),

            // System Status Bar
            h('div', { className: `glass rounded-2xl p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 transition-all duration-1000 delay-200 transform ${animated ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}` },
                // AI Consciousness
                h('div', { className: 'flex items-center justify-between' },
                    h('div', { className: 'flex items-center gap-3' },
                        h(Brain, { className: 'text-purple-400' }),
                        h('div', null,
                            h('p', { className: 'text-sm text-gray-300' }, 'AI Consciousness'),
                            h('p', { className: 'text-2xl font-bold text-purple-400' }, `${aiConsciousness}%`)
                        )
                    ),
                    h('div', { className: 'w-20 bg-gray-700 rounded-full h-2' },
                        h('div', { 
                            className: 'bg-purple-500 h-2 rounded-full transition-all duration-1000',
                            style: { width: `${aiConsciousness}%` }
                        })
                    )
                ),

                // Security Status
                h('div', { className: 'flex items-center justify-between' },
                    h('div', { className: 'flex items-center gap-3' },
                        h(Shield, { className: 'text-green-400' }),
                        h('div', null,
                            h('p', { className: 'text-sm text-gray-300' }, 'Security Status'),
                            h('p', { className: 'text-lg font-bold text-green-400' }, 'ACTIVE')
                        )
                    ),
                    h('div', { className: `px-3 py-1 rounded-full text-xs font-bold ${getSecurityStatusColor()}` },
                        'SECURE'
                    )
                ),

                // ISS Tracker
                issData && h('div', { className: 'flex items-center justify-between' },
                    h('div', { className: 'flex items-center gap-3' },
                        h(Satellite, { className: 'text-cyan-400 animate-pulse' }),
                        h('div', null,
                            h('p', { className: 'text-sm text-gray-300' }, 'ISS Location'),
                            h('p', { className: 'text-lg font-bold text-cyan-400' }, 
                                `${issData.latitude?.toFixed(2)}°, ${issData.longitude?.toFixed(2)}°`
                            )
                        )
                    ),
                    h('div', { className: 'text-right' },
                        h('p', { className: 'text-xs text-gray-400' }, 'Altitude'),
                        h('p', { className: 'text-sm font-bold text-white' }, `${issData.altitude} km`)
                    )
                )
            ),

            // Search Bar
            h('div', { className: `mb-8 transition-all duration-1000 delay-300 transform ${animated ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}` },
                h('div', { className: 'relative max-w-2xl mx-auto' },
                    h('input', {
                        type: 'text',
                        value: searchCity,
                        onChange: (e) => setSearchCity(e.target.value),
                        onKeyPress: (e) => e.key === 'Enter' && handleSearch(),
                        placeholder: 'Search for a city...',
                        className: 'w-full px-6 py-4 pl-14 glass rounded-2xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-lg'
                    }),
                    h('div', { className: 'absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-300' }, 
                        h(Search, { size: 24 })
                    ),
                    h('button', {
                        onClick: handleSearch,
                        className: 'absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-2 rounded-xl transition-all duration-300 font-semibold'
                    }, 'Search')
                )
            ),

            // Loading Indicator
            loading && h('div', { className: 'flex justify-center items-center py-20' },
                h('div', { className: 'animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500' })
            ),

            // Main Content Tabs
            !loading && h('div', null,
                // Navigation Tabs
                h('div', { className: `flex gap-2 mb-6 overflow-x-auto pb-2 transition-all duration-1000 delay-400 transform ${animated ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}` },
                    [
                        { id: 'dashboard', label: 'Dashboard', icon: h(Cloud, { size: 16 }) },
                        { id: 'weather', label: 'Weather', icon: h(Wind, { size: 16 }) },
                        { id: 'space', label: 'Space', icon: h(Satellite, { size: 16 }) },
                        { id: 'security', label: 'Security', icon: h(Shield, { size: 16 }) },
                        { id: 'ai', label: 'AI Entity', icon: h(Brain, { size: 16 }) },
                        { id: 'astronomy', label: 'Astronomy', icon: h(Moon, { size: 16 }) }
                    ].map(tab =>
                        h('button', {
                            key: tab.id,
                            onClick: () => setActiveTab(tab.id),
                            className: `flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap ${
                                activeTab === tab.id
                                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-105'
                                    : 'glass text-gray-300 hover:bg-white/20'
                            }`
                        }, tab.icon, tab.label)
                    )
                ),

                // Tab Content
                h('div', { className: 'animate-fadeInUp' },
                    // Dashboard Tab
                    activeTab === 'dashboard' && weatherData && h('div', { className: 'space-y-6' },
                        // Current Weather Card
                        h('div', { className: 'glass rounded-3xl p-8 shadow-2xl' },
                            h('div', { className: 'flex items-center justify-between mb-6' },
                                h('div', null,
                                    h('h2', { className: 'text-3xl font-bold text-white flex items-center gap-2' },
                                        h(MapPin, { size: 32 }),
                                        weatherData.location.name
                                    ),
                                    h('p', { className: 'text-gray-300' }, 
                                        `${weatherData.location.country} • ${weatherData.location.localtime}`
                                    )
                                ),
                                h('div', { className: 'text-purple-400' }, 
                                    getWeatherIcon(weatherData.current.condition.text)
                                )
                            ),

                            h('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-6' },
                                h('div', null,
                                    h('div', { className: 'text-7xl font-bold text-white mb-2' }, 
                                        `${weatherData.current.temp_c}°C`
                                    ),
                                    h('p', { className: 'text-2xl text-gray-300 mb-4' }, 
                                        weatherData.current.condition.text
                                    ),
                                    h('div', { className: 'flex gap-4 text-sm' },
                                        h('div', { className: 'bg-white/5 rounded-lg p-3' },
                                            h('p', { className: 'text-gray-400' }, 'Feels like'),
                                            h('p', { className: 'text-white font-bold' }, `${weatherData.current.feelslike_c}°C`)
                                        ),
           

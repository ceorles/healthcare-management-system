import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Popup, CircleMarker, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { Map as MapIcon, MapPin, Clock, Filter, Search } from 'lucide-react';
import '../../assets/css/GISMap.css';

// import markerIcon from 'leaflet/dist/images/marker-icon.png';
// import markerShadow from 'leaflet/dist/images/marker-shadow.png';
// let DefaultIcon = L.icon({ iconUrl: markerIcon, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
// L.Marker.prototype.options.icon = DefaultIcon;

const BARANGAY_COORDS = {
    "Poblacion 1":              [13.9626, 121.5222], // GOODS
    "Poblacion 2":              [13.9646, 121.5266], // GOODS
    "Poblacion 3":              [13.9655, 121.5291], // GOODS
    "Poblacion 4":              [13.9639, 121.5291], // GOODS
    "Poblacion 5":              [13.9624, 121.5266], // GOODS
    "Poblacion 6":              [13.9610, 121.5249], // GOODS
    "Antipolo":                 [13.9150, 121.5655], // GOODS
    "Balubal":                  [13.9659, 121.5350], // GOODS
    "Bignay 1":                 [13.8645, 121.4882], // GOODS
    "Bignay 2":                 [13.8485, 121.4663], // GOODS
    "Bucal":                    [13.9134, 121.5434], // GOODS
    "Canda":                    [13.9105, 121.5251], // GOODS
    "Castañas":                 [13.8825, 121.5528], // GOODS
    "Concepcion 1":             [13.9457, 121.4667], // GOODS
    "Concepcion Banahaw":       [13.9877, 121.4733], // GOODS
    "Concepcion Palasan":       [13.9226, 121.4623], // GOODS
    "Concepcion Pinagbukuran":  [13.9676, 121.4786], // GOODS
    "Gibanga":                  [13.9664, 121.5439], // GOODS
    "Guisguis San Roque":       [13.8659, 121.5206], // GOODS
    "Guisguis Talon":           [13.8572, 121.5003], // GOODS
    "Janagdong 1":              [13.9255, 121.5034], // GOODS
    "Janagdong 2":              [13.8954, 121.5064], // GOODS
    "Limbon":                   [13.8993, 121.5422], // GOODS
    "Lutucan 1":                [13.9303, 121.4919], // GOODS
    "Lutucan Bata":             [13.8905, 121.4895], // GOODS
    "Lutucan Malabag":          [13.9079, 121.4905], // GOODS
    "Mamala 1":                 [14.0029, 121.5164], // GOODS
    "Mamala 2":                 [13.9689, 121.5262], // GOODS
    "Manggalang 1":             [13.8774, 121.4632], // GOODS
    "Manggalang Bantilan":      [13.8392, 121.4315], // GOODS
    "Manggalang Kiling":        [13.8402, 121.4433], // GOODS
    "Manggalang Tulo-Tulo":     [13.8867, 121.4513], // GOODS
    "Montecillo":               [13.8887, 121.4764], // GOODS
    "Morong":                   [13.9274, 121.5540],
    "Pili":                     [13.9443, 121.5401], // GOODS
    "Sampaloc 1":               [13.9882, 121.5126], // GOODS
    "Sampaloc 2":               [13.9543, 121.5057], // GOODS
    "Sampaloc Bogon":           [13.9883, 121.5019], // GOODS
    "Sto. Cristo":              [13.9427, 121.4931], // GOODS
    "Talaan Aplaya":            [13.8901, 121.5641], // GOODS
    "Talaan Pantoc":            [13.9040, 121.5608], // GOODS
    "Tumbaga 1":                [13.9489, 121.5256], // GOODS
    "Tumbaga 2":                [13.9296, 121.5183] // GOODS
};

function buildBarangayPolygon([lat, lng]) {
    const latRadius = 0.009;
    const lngRadius = 0.011;

    return [
        [lat + latRadius, lng],
        [lat + latRadius * 0.5, lng + lngRadius],
        [lat - latRadius * 0.5, lng + lngRadius],
        [lat - latRadius, lng],
        [lat - latRadius * 0.5, lng - lngRadius],
        [lat + latRadius * 0.5, lng - lngRadius],
    ];
}

function getChoroplethColor(count, maxCount) {
    if (!count) return '#f8fafc';
    const intensity = count / Math.max(maxCount, 1);
    if (intensity >= 0.75) return '#ef4444';
    if (intensity >= 0.5) return '#f97316';
    if (intensity >= 0.25) return '#eab308';
    return '#22c55e';
}

export default function GISMap() {
    const [stats, setStats] = useState([]);
    const [diseases, setDiseases] = useState([]);
    const [selectedDisease, setSelectedDisease] = useState('');
    const [diseaseSearch, setDiseaseSearch] = useState('');
    const [isDiseaseDropdownOpen, setIsDiseaseDropdownOpen] = useState(false);
    const [mapMode, setMapMode] = useState('dotted');
    const [currentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

    useEffect(() => {
        axios.get('http://127.0.0.1:8000/api/patients/map-data/', {
            params: selectedDisease ? { disease: selectedDisease } : {},
            headers: { Authorization: `Bearer ${localStorage.getItem('access')}` }
        }).then(res => {
            setStats(res.data);
        }).catch(err => console.error(err));
    }, [selectedDisease]);

    useEffect(() => {
        axios.get('http://127.0.0.1:8000/api/patients/diseases/', {
            headers: { Authorization: `Bearer ${localStorage.getItem('access')}` }
        }).then(res => {
            setDiseases(Array.isArray(res.data) ? res.data : []);
        }).catch(err => console.error(err));
    }, []);

    const filteredDiseases = useMemo(() => {
        const search = diseaseSearch.trim().toLowerCase();
        return diseases
            .filter((disease) => disease.toLowerCase().includes(search))
            .sort((a, b) => a.localeCompare(b));
    }, [diseaseSearch, diseases]);

    const maxCount = useMemo(() => (
        Math.max(...stats.map((s) => s.count), 1)
    ), [stats]);

    const choroplethPolygons = useMemo(() => (
        stats
            .map((s) => {
                const coords = BARANGAY_COORDS[s.barangay];
                if (!coords) return null;
                return {
                    ...s,
                    polygon: buildBarangayPolygon(coords),
                    color: getChoroplethColor(s.count, maxCount),
                };
            })
            .filter(Boolean)
    ), [maxCount, stats]);

    const handleDiseaseSelect = (disease) => {
        setSelectedDisease(disease);
        setDiseaseSearch(disease);
        setIsDiseaseDropdownOpen(false);
    };

    const handleFilter = () => {
        const search = diseaseSearch.trim();
        if (!search) {
            handleDiseaseSelect('');
            return;
        }

        const exactMatch = diseases.find((disease) => disease.toLowerCase() === search.toLowerCase());
        handleDiseaseSelect(exactMatch || search);
    };

    return (
        <div className="gis-map-container">
            <div className="page-header">
                <div className="page-title"><MapPin size={24}/> GIS Patient Distribution</div>
                <div className="page-time"><Clock size={16}/> {currentTime}</div>
            </div>

            <div className="gis-filter-bar">
                <div className="gis-filter-group">
                    <label>Filter by Diseases</label>
                    <div className="gis-disease-combobox" onBlur={() => setIsDiseaseDropdownOpen(false)}>
                        <Search size={16} className="gis-disease-search-icon" />
                        <input
                            type="text"
                            className="gis-select gis-disease-input"
                            placeholder="All Diseases"
                            value={diseaseSearch}
                            onChange={(e) => {
                                setDiseaseSearch(e.target.value);
                                setIsDiseaseDropdownOpen(true);
                            }}
                            onFocus={() => setIsDiseaseDropdownOpen(true)}
                        />
                        {isDiseaseDropdownOpen && (
                            <div className="gis-disease-dropdown">
                                <button type="button" onMouseDown={() => handleDiseaseSelect('')}>
                                    All Diseases
                                </button>
                                {filteredDiseases.length > 0 ? filteredDiseases.map((disease) => (
                                    <button
                                        type="button"
                                        key={disease}
                                        onMouseDown={() => handleDiseaseSelect(disease)}
                                    >
                                        {disease}
                                    </button>
                                )) : (
                                    <span>No diseases found</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <button className="gis-btn-filter" onClick={handleFilter}><Filter size={16}/> Filter</button>
                <div className="gis-map-mode-toggle">
                    <button
                        type="button"
                        className={mapMode === 'dotted' ? 'active' : ''}
                        onClick={() => setMapMode('dotted')}
                    >
                        Dotted Heatmap
                    </button>
                    <button
                        type="button"
                        className={mapMode === 'geospatial' ? 'active' : ''}
                        onClick={() => setMapMode('geospatial')}
                    >
                        Geospatial Heatmap
                    </button>
                </div>
            </div>

            <div className="gis-main-layout">
                <div className="gis-map-panel">
                    <div className="gis-section-title"><MapIcon size={20}/> Patient Distribution by Barangay</div>
                    <MapContainer center={[13.9667, 121.5167]} zoom={13} className="gis-leaflet">
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        {mapMode === 'geospatial' && choroplethPolygons.map((s) => (
                            <Polygon
                                key={`polygon-${s.barangay}-${s.count}`}
                                positions={s.polygon}
                                pathOptions={{
                                    color: '#1f2937',
                                    weight: 1.2,
                                    opacity: 0.75,
                                    fillColor: s.color,
                                    fillOpacity: 0.46,
                                }}
                            >
                                <Popup>
                                    <strong>{s.barangay}</strong><br/>
                                    Total Patients: {s.count}<br/>
                                    {selectedDisease ? `Disease Count: ${s.count}` : ''}
                                </Popup>
                            </Polygon>
                        ))}
                        {mapMode === 'dotted' && stats.map((s) => {
                            const coords = BARANGAY_COORDS[s.barangay] || [13.9667, 121.5167];

                            // console.log(`Mapping ${s.barangay} (${s.count} patients) to coords:`, coords);
                            // if (!coords) {
                            //     console.error(`MISSING COORDINATES FOR: ${s.barangay}`);
                            //     return null;
                            // }

                            let color = '#22c55e'; // GREEN (1-4)
                            let radius = 8;

                            if (s.count >= 10) {
                                color = '#ef4444'; // RED (10+)
                                radius = 16;
                            } else if (s.count >= 5) {
                                color = '#eab308'; // YELLOW (5-9)
                                radius = 12;
                            }

                            return (
                                <CircleMarker 
                                    key={`marker-${s.barangay}-${s.count}`} 
                                    center={coords} 
                                    radius={radius} 
                                    fillColor={color} 
                                    color={color} 
                                    fillOpacity={0.7}
                                >
                                    <Popup>
                                        <strong>{s.barangay}</strong><br/>
                                        Total Patients: {s.count}
                                    </Popup>
                                </CircleMarker>
                            );
                        })}
                    </MapContainer>
                </div>

                <div className="gis-sidebar-panel">
                    <div className="gis-info-card">
                        <h3>Top Barangay by Cases</h3>
                        {stats.length === 0 ? <p style={{textAlign: 'center'}}>No records</p> : 
                            [...stats].sort((a,b) => b.count - a.count).slice(0,5).map((s,i) => (
                                <div key={i} className="gis-stat-item"><span>{s.barangay}</span> <strong>{s.count}</strong></div>
                            ))
                        }
                    </div>

                    <div className="gis-info-card">
                        <h3>Legend</h3>
                        <div className="gis-legend-item"><div className="dot" style={{ background: '#22c55e' }}></div> 1-4 patients</div>
                        <div className="gis-legend-item"><div className="dot" style={{ background: '#eab308' }}></div> 5-9 patients</div>
                        <div className="gis-legend-item"><div className="dot" style={{ background: '#ef4444' }}></div> 10+ patients</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
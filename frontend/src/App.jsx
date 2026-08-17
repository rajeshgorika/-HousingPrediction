import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import MetricCards from './components/MetricCards';
import InputPanel from './components/InputPanel';
import MapView from './components/MapView';
import ShapChart from './components/ShapChart';
import WhatIfSimulator from './components/WhatIfSimulator';
import CompsTable from './components/CompsTable';
import BenchmarkTab from './components/BenchmarkTab';
import { Map, BarChart3, Sliders, Building, Award } from 'lucide-react';

export default function App() {
  const [theme, setTheme] = useState('dark'); // Dark Mode by default
  const [heroTheme, setHeroTheme] = useState('gold'); // Luxury Gold Valuation Dashboard Accent!
  const [cities, setCities] = useState(null);
  const [economicHubs, setEconomicHubs] = useState(null);
  const [selectedCity, setSelectedCity] = useState('Los Angeles');
  const [searchAddress, setSearchAddress] = useState('1234 Maple Ave, Los Angeles, CA 90028');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeDashboardSubTab, setActiveDashboardSubTab] = useState('map');
  const [isExporting, setIsExporting] = useState(false);
  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);

  // Property Inputs State
  const [inputs, setInputs] = useState({
    Latitude: 34.0522,
    Longitude: -118.2437,
    MedInc: 7.5,
    HouseAge: 22.0,
    TotalRooms: 6.0,
    TotalBedrooms: 3.0,
    AskingPrice: 845000.0
  });

  // API Responses State
  const [prediction, setPrediction] = useState(null);
  const [mispricing, setMispricing] = useState(null);
  const [shapData, setShapData] = useState([]);
  const [compsData, setCompsData] = useState([]);

  // Apply dark/light theme attribute to root HTML
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Fetch Cities on Load
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/cities')
      .then(res => res.json())
      .then(data => {
        setCities(data.cities);
        setEconomicHubs(data.economic_hubs);
        if (data.cities['Los Angeles']) {
          const la = data.cities['Los Angeles'];
          setInputs(prev => ({
            ...prev,
            Latitude: la.lat,
            Longitude: la.lon,
            MedInc: la.med_inc
          }));
        }
      })
      .catch(err => console.error('Failed to fetch cities:', err));
  }, []);

  // Fetch Predictions & Analytics when inputs change
  useEffect(() => {
    const payload = { ...inputs, CityName: selectedCity };

    // 1. Predict Valuation
    fetch('http://127.0.0.1:8000/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        setPrediction(data.prediction);
        setMispricing(data.mispricing);
      })
      .catch(err => console.error(err));

    // 2. Fetch SHAP Impact
    fetch('http://127.0.0.1:8000/api/shap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => setShapData(data))
      .catch(err => console.error(err));

    // 3. Fetch Comps
    fetch('http://127.0.0.1:8000/api/comps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => setCompsData(data))
      .catch(err => console.error(err));
  }, [inputs, selectedCity]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleExportReport = async () => {
    setIsExporting(true);
    try {
      const payload = { ...inputs, CityName: selectedCity };
      const res = await fetch('http://127.0.0.1:8000/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      const blob = new Blob([data.report], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Valuation_Report_${selectedCity.replace(/ /g, '_')}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to export report:', e);
    } finally {
      setIsExporting(false);
    }
  };

  const cityZoom = cities && cities[selectedCity] ? cities[selectedCity].zoom : 11;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)' }}>
      {/* Left Sidebar matching Screenshot 1 */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header Bar matching Screenshot 1 */}
        <Navbar
          theme={theme}
          toggleTheme={toggleTheme}
          heroTheme={heroTheme}
          setHeroTheme={setHeroTheme}
          onExportReport={handleExportReport}
          onToggleAddProperty={() => setIsAddPropertyOpen(prev => !prev)}
          searchAddress={searchAddress}
          setSearchAddress={setSearchAddress}
        />

        {/* Main Body Layout with Active Tab View Switching */}
        <main style={{ padding: '32px', flex: 1, overflowY: 'auto' }}>
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <>
              {/* Header Title Section */}
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  Valuation Dashboard
                </h2>
                <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {searchAddress}
                </p>
              </div>

              {/* Grid Layout */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px', alignItems: 'start' }}>
                {/* Left Column: Hero Valuation Card + SHAP Chart + Controls */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <MetricCards prediction={prediction} mispricing={mispricing} selectedCity={selectedCity} heroTheme={heroTheme} />

                  <div className="ui-card">
                    <ShapChart shapData={shapData} />
                  </div>

                  <InputPanel
                    cities={cities}
                    selectedCity={selectedCity}
                    setSelectedCity={setSelectedCity}
                    inputs={inputs}
                    setInputs={setInputs}
                    prediction={prediction}
                    isOpen={false}
                  />
                </div>

                {/* Right Column: Leaflet Map View + Sub-tabs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div className="ui-card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                        Geospatial Location Map
                      </h3>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>
                        Leaflet Map View
                      </span>
                    </div>

                    <MapView
                      lat={inputs.Latitude}
                      lon={inputs.Longitude}
                      zoom={cityZoom}
                      theme={theme}
                      prediction={prediction}
                      economicHubs={economicHubs}
                      selectedCity={selectedCity}
                    />
                  </div>

                  {/* Analytics Sub-Tabs Container (What-If, Comps, Benchmark) */}
                  <div className="ui-card">
                    <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '20px' }}>
                      <button
                        onClick={() => setActiveDashboardSubTab('simulator')}
                        style={{
                          padding: '8px 14px', borderRadius: '8px', border: 'none',
                          background: activeDashboardSubTab === 'simulator' ? 'var(--accent-primary)' : 'transparent',
                          color: activeDashboardSubTab === 'simulator' ? '#FFF' : 'var(--text-muted)',
                          fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                        }}
                      >
                        <Sliders size={15} /> What-If Simulator
                      </button>

                      <button
                        onClick={() => setActiveDashboardSubTab('comps')}
                        style={{
                          padding: '8px 14px', borderRadius: '8px', border: 'none',
                          background: activeDashboardSubTab === 'comps' ? 'var(--accent-primary)' : 'transparent',
                          color: activeDashboardSubTab === 'comps' ? '#FFF' : 'var(--text-muted)',
                          fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                        }}
                      >
                        <Building size={15} /> Comps Table
                      </button>

                      <button
                        onClick={() => setActiveDashboardSubTab('benchmark')}
                        style={{
                          padding: '8px 14px', borderRadius: '8px', border: 'none',
                          background: activeDashboardSubTab === 'benchmark' ? 'var(--accent-primary)' : 'transparent',
                          color: activeDashboardSubTab === 'benchmark' ? '#FFF' : 'var(--text-muted)',
                          fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                        }}
                      >
                        <Award size={15} /> Cluster Accuracy Benchmark
                      </button>
                    </div>

                    {activeDashboardSubTab === 'simulator' && (
                      <WhatIfSimulator currentInputs={inputs} basePrediction={prediction} />
                    )}

                    {activeDashboardSubTab === 'comps' && (
                      <CompsTable compsData={compsData} clusterId={prediction?.cluster_id} />
                    )}

                    {activeDashboardSubTab === 'benchmark' && (
                      <BenchmarkTab />
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* MY VALUATIONS TAB */}
          {activeTab === 'valuations' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  My Saved Valuations
                </h2>
                <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Manage and review your saved property estimates
                </p>
              </div>

              <div className="ui-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    Saved Property Records
                  </h3>
                  <button
                    onClick={handleExportReport}
                    style={{
                      padding: '8px 16px', borderRadius: '8px', border: 'none',
                      background: 'var(--accent-primary)', color: '#FFF',
                      fontSize: '13px', fontWeight: '700', cursor: 'pointer'
                    }}
                  >
                    Export Current Report (.TXT)
                  </button>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                      <th style={{ padding: '12px' }}>Address</th>
                      <th style={{ padding: '12px' }}>City</th>
                      <th style={{ padding: '12px' }}>AI Fair Value</th>
                      <th style={{ padding: '12px' }}>Confidence Range</th>
                      <th style={{ padding: '12px' }}>Verdict</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-main)' }}>
                      <td style={{ padding: '14px 12px', fontWeight: '700' }}>{searchAddress}</td>
                      <td style={{ padding: '14px 12px' }}>{selectedCity}</td>
                      <td style={{ padding: '14px 12px', fontWeight: '800', color: '#10B981' }}>
                        ${prediction ? Math.round(prediction.predicted_price).toLocaleString() : '---'}
                      </td>
                      <td style={{ padding: '14px 12px' }}>
                        ${prediction ? Math.round(prediction.lower_bound).toLocaleString() : '---'} - ${prediction ? Math.round(prediction.upper_bound).toLocaleString() : '---'}
                      </td>
                      <td style={{ padding: '14px 12px' }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '800',
                          background: mispricing?.status === 'Overpriced' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: mispricing?.status === 'Overpriced' ? '#EF4444' : '#10B981'
                        }}>
                          {mispricing ? mispricing.status : 'Fair Value'}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* COMPARABLES TAB */}
          {activeTab === 'comparables' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  Comparable Properties
                </h2>
                <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Nearest historical sold properties in Micro-Market Cluster #{prediction?.cluster_id ?? 3}
                </p>
              </div>

              <div className="ui-card">
                <CompsTable compsData={compsData} clusterId={prediction?.cluster_id} />
              </div>
            </div>
          )}

          {/* ANALYTICS TAB */}
          {activeTab === 'analytics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  Advanced Analytics & Simulators
                </h2>
                <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  What-if renovation modeling and LightGBM model performance benchmarks
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div className="ui-card">
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '16px' }}>
                    What-If Renovation Simulator
                  </h3>
                  <WhatIfSimulator currentInputs={inputs} basePrediction={prediction} />
                </div>

                <div className="ui-card">
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '16px' }}>
                    Cluster Accuracy Benchmark
                  </h3>
                  <BenchmarkTab />
                </div>
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  System Settings & Preferences
                </h2>
                <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Customize theme, API options, and UI preferences
                </p>
              </div>

              <div className="ui-card" style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>
                    Appearance Mode
                  </label>
                  <button
                    onClick={toggleTheme}
                    style={{
                      padding: '10px 18px', borderRadius: '8px', border: '1px solid var(--border-color)',
                      background: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '13.5px', fontWeight: '700', cursor: 'pointer'
                    }}
                  >
                    Current Mode: {theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'} (Click to Toggle)
                  </button>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>
                    Hero Valuation Accent Theme
                  </label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {['gold', 'crimson', 'emerald'].map(t => (
                      <button
                        key={t}
                        onClick={() => setHeroTheme(t)}
                        style={{
                          padding: '8px 16px', borderRadius: '8px', border: 'none',
                          background: heroTheme === t ? 'var(--accent-primary)' : 'var(--input-bg)',
                          color: heroTheme === t ? '#FFF' : 'var(--text-muted)',
                          fontSize: '13px', fontWeight: '700', cursor: 'pointer', textTransform: 'capitalize'
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>
                    FastAPI Backend Endpoint
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="http://127.0.0.1:8000"
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '8px',
                      border: '1px solid var(--border-color)', background: 'var(--input-bg)',
                      color: 'var(--text-muted)', fontSize: '13.5px', fontFamily: 'monospace'
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Slide-over Drawer for + Add property button */}
      {isAddPropertyOpen && (
        <InputPanel
          cities={cities}
          selectedCity={selectedCity}
          setSelectedCity={setSelectedCity}
          inputs={inputs}
          setInputs={setInputs}
          prediction={prediction}
          isOpen={true}
          onClose={() => setIsAddPropertyOpen(false)}
        />
      )}
    </div>
  );
}

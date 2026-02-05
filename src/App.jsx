import React, { useState, useEffect, useMemo } from "react";
import InmateSearch from './components/InmateSearch';
import { Clock, Moon, Sun, Shield } from 'lucide-react';
import logo from './logo.png';
import inmatesData from './components/wbp.json';

const App = () => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const { totalData, lastUpdate } = useMemo(() => {
    const dateKey = Object.keys(inmatesData)[0];
    const rawList = dateKey ? inmatesData[dateKey] : [];
    const total = Math.max((rawList?.length || 0) - 1, 0);

    const formatDateKey = (key) => {
      if (!key) return "-";
      const parts = key.split("_");
      if (parts.length !== 3) return key;
      const [day, month, year] = parts;
      const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ];
      const monthIndex = Number(month) - 1;
      const monthLabel = months[monthIndex] || month;
      return `${day} ${monthLabel} ${year}`;
    };

    return {
      totalData: total,
      lastUpdate: formatDateKey(dateKey),
    };
  }, []);

  // Efek untuk loading indicator saat mengetik
  useEffect(() => {
    if (query) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500); // Waktu loading disesuaikan agar lebih responsif (0.5 detik)
      return () => clearTimeout(timer);
    } else {
      setIsLoading(false);
    }
  }, [query]);

  const handleInputChange = (e) => {
    setQuery(e.target.value);
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    document.body.classList.toggle("dark-mode", newDarkMode);
  };

  return (
    <div className="App">
      {/* Animated Background Elements */}
      <div className="bg-decoration">
        <div className="circle-1"></div>
        <div className="circle-2"></div>
        <div className="circle-3"></div>
      </div>

      <header className="App-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-wrapper">
              <img src={logo} alt="Logo" className="App-logo" />
            </div>
            <div className="title-section">
              <h1>Warga Binaan</h1>
              <p className="subtitle">Lapas Kerobokan</p>
            </div>
          </div>
          <button className="toggle-mode-btn" onClick={toggleDarkMode}>
            {darkMode ? (
              <>
                <Sun size={18} />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon size={18} />
                <span>Dark</span>
              </>

      
            )}
          </button>
        </div>
        <div className="header-stats">
          <div className="stat-item">
            <Shield size={20} />
            <div>
              <span className="stat-label">Total Data</span>
              <span className="stat-value">{totalData.toLocaleString('id-ID')}</span>
            </div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <Clock size={20} />
            <div>
              <span className="stat-label">Last Update</span>
              <span className="stat-value">{lastUpdate}</span>
            </div>
          </div>
        </div>
      </header>

      <main>
        <InmateSearch
          query={query}
          isLoading={isLoading}
          handleInputChange={handleInputChange}
        />
      </main>

      <footer className="App-footer">
        <div className="footer-content">
          <div className="footer-badge">
            <Shield size={16} />
            <span>Riwantoro Tracker</span>
          </div>
          <div className="footer-divider"></div>
          <div className="footer-info">
            <p>All rights RiwantoroTech</p>
          </div>
        </div>
        <div className="footer-wave"></div>
      </footer>
    </div>
  );
};

export default App;

import React, { useState, useMemo } from "react";
import './App.css';
import InmateSearch from './components/InmateSearch';
import { Clock, LockKeyhole, LogOut, Moon, Shield, Sun, User } from 'lucide-react';
import logo from './logo.png';
import loginLogo from './assets/logo1.png';
import inmatesData from './components/wbp.json';

const USERS = ['Kamtib', 'Bimker', 'Binadik', 'KPLP', 'Umum'];

const App = () => {
  const [query, setQuery] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(() => localStorage.getItem('riwantoro-user'));
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

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

  const handleInputChange = (e) => {
    setQuery(e.target.value);
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    document.body.classList.toggle("dark-mode", newDarkMode);
  };

  const handleLogin = (event) => {
    event.preventDefault();
    const username = USERS.find((user) => user.toLowerCase() === credentials.username.trim().toLowerCase());

    if (!username || credentials.password !== 'Kerobokan86') {
      setLoginError('Username atau password tidak sesuai.');
      return;
    }

    localStorage.setItem('riwantoro-user', username);
    setLoggedInUser(username);
    setLoginError('');
  };

  const handleLogout = () => {
    localStorage.removeItem('riwantoro-user');
    setLoggedInUser(null);
  };

  if (!loggedInUser) {
    return (
      <div className="login-page">
        <div className="login-card">
          <img src={loginLogo} alt="Riwantoro Tracker" className="login-logo" />
          <div className="login-heading">
            <p className="login-eyebrow">Lapas Kerobokan</p>
            <h1>Riwantoro Tracker</h1>
            <p>Masuk untuk mengakses data warga binaan.</p>
          </div>
          <form className="login-form" onSubmit={handleLogin}>
            <label>
              <span>Username</span>
              <div className="login-input"><User size={18} /><input autoComplete="username" value={credentials.username} onChange={(event) => setCredentials({ ...credentials, username: event.target.value })} placeholder="Masukkan username" required /></div>
            </label>
            <label>
              <span>Password</span>
              <div className="login-input"><LockKeyhole size={18} /><input type="password" autoComplete="current-password" value={credentials.password} onChange={(event) => setCredentials({ ...credentials, password: event.target.value })} placeholder="Masukkan password" required /></div>
            </label>
            {loginError && <p className="login-error" role="alert">{loginError}</p>}
            <button className="login-button" type="submit">Masuk ke Tracker</button>
          </form>
        </div>
      </div>
    );
  }

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

      <div className="user-session">
        <span>Masuk sebagai <strong>{loggedInUser}</strong></span>
        <button onClick={handleLogout}><LogOut size={16} /> Keluar</button>
      </div>

      <main>
        <InmateSearch
          query={query}
          isLoading={false}
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

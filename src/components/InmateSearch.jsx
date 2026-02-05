import React, { useMemo, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import inmatesData from './wbp.json';
import './InmateSearch.css';

const InmateSearch = ({ query, isLoading, handleInputChange }) => {
  const [fieldFilters, setFieldFilters] = useState({
    nama: true,
    wisma: true,
    pidana: true,
    no_registrasi: true,
  });

  // 1. Ambil Key Tanggal
  const dateKey = Object.keys(inmatesData)[0];
  const rawList = inmatesData[dateKey];

  // 2. FIX: Buang Header (Index 0) SEBELUM filter agar tidak mengganggu hasil pencarian
  const dataWbp = rawList.slice(1);

  const activeFields = Object.entries(fieldFilters)
    .filter(([, isActive]) => isActive)
    .map(([key]) => key);

  const hasActiveFields = activeFields.length > 0;

  const normalizedQuery = query.trim().toLowerCase();

  const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const highlightText = (text, rawQuery) => {
    if (!rawQuery || !text) return text || "";
    const safeQuery = escapeRegExp(rawQuery);
    const regex = new RegExp(`(${safeQuery})`, "ig");
    const parts = String(text).split(regex);

    return parts.map((part, index) => {
      if (part.toLowerCase() === rawQuery.toLowerCase()) {
        return (
          <mark className="highlight" key={`${part}-${index}`}>
            {part}
          </mark>
        );
      }
      return <span key={`${part}-${index}`}>{part}</span>;
    });
  };

  // 3. Filter inmates berdasarkan query (live search)
  const filteredInmates = dataWbp.filter((inmate) => {
    if (!normalizedQuery || !hasActiveFields) return false;
    const searchQuery = normalizedQuery;

    return activeFields.some((field) => {
      const value = inmate[field] ? String(inmate[field]).toLowerCase() : "";
      return value.includes(searchQuery);
    });
  });

  const wismaStats = useMemo(() => {
    const counts = dataWbp.reduce((acc, inmate) => {
      const wisma = (inmate.wisma || "Tidak diketahui").trim();
      acc[wisma] = (acc[wisma] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [dataWbp]);

  const toggleFilter = (field) => {
    setFieldFilters((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="inmate-search-container">
      <div className="search-container">
        <input
          type="text"
          placeholder="🔍 Cari nama, wisma, pidana, atau no. registrasi..."
          value={query}
          onChange={handleInputChange}
          className="search-input"
        />
        <Search className="search-icon" size={22} />
      </div>

      <div className="filter-row">
        <div className="filter-title">
          <SlidersHorizontal size={16} />
          <span>Filter Pencarian</span>
        </div>
        <div className="filter-chips">
          <button
            type="button"
            className={`filter-chip ${fieldFilters.nama ? "active" : ""}`}
            onClick={() => toggleFilter("nama")}
          >
            Nama
          </button>
          <button
            type="button"
            className={`filter-chip ${fieldFilters.wisma ? "active" : ""}`}
            onClick={() => toggleFilter("wisma")}
          >
            Wisma
          </button>
          <button
            type="button"
            className={`filter-chip ${fieldFilters.pidana ? "active" : ""}`}
            onClick={() => toggleFilter("pidana")}
          >
            Pidana
          </button>
          <button
            type="button"
            className={`filter-chip ${fieldFilters.no_registrasi ? "active" : ""}`}
            onClick={() => toggleFilter("no_registrasi")}
          >
            No. Registrasi
          </button>
        </div>
      </div>

      <div className="stats-panel">
        <div className="stats-header">
          <span>Statistik Wisma (Top 6)</span>
          <span className="stats-total">Total: {dataWbp.length}</span>
        </div>
        <div className="stats-grid">
          {wismaStats.map(([wisma, total]) => (
            <div className="stats-pill" key={wisma}>
              <span className="stats-name">{wisma}</span>
              <span className="stats-count">{total}</span>
            </div>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p className="loading-text">Mencari data...</p>
        </div>
      )}

      <div className="inmate-display">
        {/* Pesan tidak ditemukan */}
        {!isLoading && query && (!hasActiveFields || filteredInmates.length === 0) && (
          <p>
            {!hasActiveFields ? (
              <>
                ❗ Pilih minimal satu filter pencarian di atas.
                <br /><br />
                💡 Coba aktifkan Nama atau Wisma terlebih dulu.
              </>
            ) : (
              <>
                ❌ Pencarian tidak ditemukan untuk: "<strong>{query}</strong>"
                <br /><br />
                💡 Coba gunakan kata kunci lain atau periksa ejaan.
              </>
            )}
          </p>
        )}

        {/* Hasil pencarian */}
        {!isLoading && query && filteredInmates.length > 0 && (
          <>
            <p style={{ 
              color: 'var(--color-primary)', 
              fontWeight: '700', 
              marginBottom: '1rem',
              fontSize: '14px',
              textAlign: 'left',
              padding: '0 0.5rem'
            }}>
              {/* FIX: Tidak perlu dikurangi 1 lagi karena header sudah dibuang di awal */}
              ✅ Ditemukan {filteredInmates.length} hasil
            </p>
            <ul className="suggestions">
              {/* FIX: Hapus .slice(1) disini, langsung map semua hasil filter */}
              {filteredInmates.map((inmate, index) => (
                <li key={inmate.no_registrasi || index} className="suggestion-item">
                  <div style={{ marginBottom: '8px' }}>
                    <strong>👤 Nama:</strong> {highlightText(inmate.nama, normalizedQuery)}
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>🆔 No. Reg:</strong> {highlightText(inmate.no_registrasi, normalizedQuery)}
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>🏠 Wisma:</strong> {highlightText(inmate.wisma, normalizedQuery)}
                  </div>
                  <div>
                    <strong>⚖️ Pidana:</strong> {highlightText(inmate.pidana, normalizedQuery)}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        {/* Pesan panduan awal */}
        {!isLoading && !query && (
          <p style={{ 
            color: 'var(--text-secondary)', 
            fontWeight: '500', 
            padding: '3rem 1rem',
            lineHeight: '1.8'
          }}>
            💡 <strong style={{ color: 'var(--color-primary)' }}>Cara Penggunaan:</strong>
            <br /><br />
            Ketik <strong>nama</strong> atau <strong>wisma</strong> WBP di kolom pencarian di atas.
            <br />
            Hasil akan muncul secara <strong>real-time</strong> saat Anda mengetik!
            <br /><br />
            {/* Menggunakan dataWbp.length untuk hitungan akurat tanpa header */}
            📊 Total data tersedia: <strong style={{ color: 'var(--color-primary)' }}>{dataWbp.length} Warga Binaan</strong>
          </p>
        )}
      </div>
    </div>
  );
};

export default InmateSearch;

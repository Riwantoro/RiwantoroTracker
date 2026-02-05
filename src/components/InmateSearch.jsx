import React, { useMemo, useDeferredValue } from 'react';
import { Search } from 'lucide-react';
import inmatesData from './wbp.json';
import './InmateSearch.css';

const InmateSearch = ({ query, isLoading, handleInputChange }) => {
  // 1. Ambil Key Tanggal
  const dateKey = Object.keys(inmatesData)[0];
  const rawList = inmatesData[dateKey];

  // 2. FIX: Buang Header (Index 0) SEBELUM filter agar tidak mengganggu hasil pencarian
  const dataWbp = rawList.slice(1);

  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();

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

  const normalizedData = useMemo(() => {
    return dataWbp.map((inmate) => ({
      raw: inmate,
      nama: (inmate.nama || "").toLowerCase(),
      wisma: (inmate.wisma || "").toLowerCase(),
      pidana: (inmate.pidana || "").toLowerCase(),
      no_registrasi: (inmate.no_registrasi || "").toLowerCase(),
    }));
  }, [dataWbp]);

  // 3. Filter inmates berdasarkan query (live search) - di-defer agar typing lebih ringan
  const filteredInmates = useMemo(() => {
    if (!normalizedQuery) return [];
    return normalizedData
      .filter((inmate) => (
        inmate.nama.includes(normalizedQuery) ||
        inmate.wisma.includes(normalizedQuery) ||
        inmate.pidana.includes(normalizedQuery) ||
        inmate.no_registrasi.includes(normalizedQuery)
      ))
      .map((inmate) => inmate.raw);
  }, [normalizedData, normalizedQuery]);

  const normalizePidana = (value) => {
    if (!value) return "Tidak diketahui";
    const cleaned = String(value).trim();
    const main = cleaned.split(" - ")[0];
    return main || cleaned;
  };

  const pidanaStats = useMemo(() => {
    const counts = dataWbp.reduce((acc, inmate) => {
      const pidanaRaw = inmate.pidana || "Tidak diketahui";
      const pidanaKey = normalizePidana(pidanaRaw);
      const shouldInclude = normalizedQuery
        ? String(pidanaRaw).toLowerCase().includes(normalizedQuery)
        : true;

      if (!shouldInclude) return acc;

      acc[pidanaKey] = (acc[pidanaKey] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1]);
  }, [dataWbp, normalizedQuery]);

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

      <div className="stats-panel">
        <div className="stats-header">
          <span>
            Statistik Pidana {normalizedQuery ? `(filter: "${normalizedQuery}")` : "(Semua)"}
          </span>
          <span className="stats-total">Total: {dataWbp.length}</span>
        </div>
        <div className="stats-grid">
          {pidanaStats.map(([pidana, total]) => (
            <div className="stats-pill" key={pidana}>
              <span className="stats-name">{pidana}</span>
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
        {!isLoading && query && filteredInmates.length === 0 && (
          <p>
            ❌ Pencarian tidak ditemukan untuk: "<strong>{query}</strong>"
            <br /><br />
            💡 Coba gunakan kata kunci lain atau periksa ejaan.
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

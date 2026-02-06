import React, { useMemo, useDeferredValue } from 'react';
import { Search } from 'lucide-react';
import inmatesData from './wbp.json';
import complexData from './kompleks.json';
import './InmateSearch.css';

const InmateSearch = ({ query, isLoading, handleInputChange }) => {
  // 1. Ambil Key Tanggal
  const dateKey = Object.keys(inmatesData)[0];
  const rawList = inmatesData[dateKey];

  // 2. FIX: Buang Header (Index 0) SEBELUM filter agar tidak mengganggu hasil pencarian
  const dataWbp = rawList.slice(1);

  const complexKey = Object.keys(complexData)[0];
  const complexList = complexKey ? complexData[complexKey] : [];
  const complexRows = Array.isArray(complexList) ? complexList.slice(1) : [];

  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();

  const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const formatDate = (value) => {
    if (!value) return "";
    const text = String(value).trim();
    const matchDMY = text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
    const matchYMD = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    let day;
    let month;
    let year;

    if (matchDMY) {
      [, day, month, year] = matchDMY;
    } else if (matchYMD) {
      [, year, month, day] = matchYMD;
    } else {
      return text;
    }

    day = String(day).padStart(2, "0");
    month = String(month).padStart(2, "0");
    year = String(year).length === 2 ? `20${year}` : String(year);
    const months = [
      "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
      "Jul", "Agt", "Sep", "Okt", "Nov", "Des",
    ];
    const monthIndex = Number(month) - 1;
    const monthLabel = months[monthIndex] || month;
    return `${day} ${monthLabel} ${year}`;
  };

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

  const mergedData = useMemo(() => {
    const complexMap = complexRows.reduce((acc, row) => {
      const key = String(row?.Column2 || row?.no_registrasi || "").trim();
      if (!key) return acc;
      acc[key] = {
        negara: row?.negara || "",
        masa_2_3: row?.["masa_2/3"] || "",
        vonis: row?.vonis || "",
        nik: row?.nik || "",
      };
      return acc;
    }, {});

    return dataWbp.map((inmate) => {
      const key = String(inmate?.no_registrasi || "").trim();
      const extra = complexMap[key] || {};
      return {
        ...inmate,
        negara: extra.negara || "",
        masa_2_3: extra.masa_2_3 || "",
        vonis: extra.vonis || "",
        nik: extra.nik || "",
      };
    });
  }, [dataWbp, complexRows]);

  const normalizedData = useMemo(() => {
    return mergedData.map((inmate) => ({
      raw: inmate,
      nama: (inmate.nama || "").toLowerCase(),
      wisma: (inmate.wisma || "").toLowerCase(),
      pidana: (inmate.pidana || "").toLowerCase(),
      no_registrasi: (inmate.no_registrasi || "").toLowerCase(),
      negara: (inmate.negara || "").toLowerCase(),
      masa_2_3: (inmate.masa_2_3 || "").toLowerCase(),
      vonis: (inmate.vonis || "").toLowerCase(),
      nik: (inmate.nik || "").toLowerCase(),
    }));
  }, [mergedData]);

  // 3. Filter inmates berdasarkan query (live search) - di-defer agar typing lebih ringan
  const filteredInmates = useMemo(() => {
    if (!normalizedQuery) return [];
    return normalizedData
      .filter((inmate) => (
        inmate.nama.includes(normalizedQuery) ||
        inmate.wisma.includes(normalizedQuery) ||
        inmate.pidana.includes(normalizedQuery) ||
        inmate.no_registrasi.includes(normalizedQuery) ||
        inmate.negara.includes(normalizedQuery) ||
        inmate.masa_2_3.includes(normalizedQuery) ||
        inmate.vonis.includes(normalizedQuery) ||
        inmate.nik.includes(normalizedQuery)
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
    const counts = mergedData.reduce((acc, inmate) => {
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
  }, [mergedData, normalizedQuery]);

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
                    <strong>📅 Tgl Masuk:</strong> {highlightText(formatDate(inmate.tanggal_masuk), normalizedQuery)}
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>🏠 Wisma:</strong> {highlightText(inmate.wisma, normalizedQuery)}
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>⚖️ Pidana:</strong> {highlightText(inmate.pidana, normalizedQuery)}
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>🌍 Negara:</strong> {highlightText(inmate.negara, normalizedQuery)}
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>🗓️ Masa 2/3:</strong> {highlightText(formatDate(inmate.masa_2_3), normalizedQuery)}
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>📜 Vonis:</strong> {highlightText(inmate.vonis, normalizedQuery)}
                  </div>
                  <div>
                    <strong>🆔 NIK:</strong> {highlightText(inmate.nik, normalizedQuery)}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        {/* Kosongkan area saat belum ada pencarian */}
      </div>
    </div>
  );
};

export default InmateSearch;

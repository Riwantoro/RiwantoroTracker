import React, { useMemo, useDeferredValue, useState } from 'react';
import { Search } from 'lucide-react';
import inmatesData from './wbp.json';
import complexData from './kompleks.json';
import './InmateSearch.css';

const InmateSearch = ({ query, isLoading, handleInputChange }) => {
  const [filters, setFilters] = useState({ wisma: '', pidana: '', negara: '', remisi: '' });
  const [expanded, setExpanded] = useState(null);
  // 1. Ambil Key Tanggal
  const dateKey = Object.keys(inmatesData)[0];
  const rawList = inmatesData[dateKey];

  // 2. FIX: Buang Header (Index 0) SEBELUM filter agar tidak mengganggu hasil pencarian
  const dataWbp = rawList.slice(1);

  const complexRows = useMemo(
    () => {
      const complexKey = Object.keys(complexData)[0];
      const complexList = complexKey ? complexData[complexKey] : [];
      return Array.isArray(complexList) ? complexList.slice(1) : [];
    },
    [],
  );

  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const hasActiveFilters = Object.values(filters).some(Boolean);

  const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const formatDate = (value) => {
    if (!value) return "";
    const text = String(value).trim();
    const matchDMY = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
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
        remisi: row?.remisi || "",
        kategori_remisi: row?.kategori_remisi || "",
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
        remisi: extra.remisi || "",
        kategori_remisi: extra.kategori_remisi || "",
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
      remisi: (inmate.remisi || "").toLowerCase(),
      kategori_remisi: (inmate.kategori_remisi || "").toLowerCase(),
    }));
  }, [mergedData]);

  const filterOptions = useMemo(() => {
    const values = (field) => [...new Set(mergedData.map((item) => String(item[field] || '').trim()).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, 'id'));
    return { wisma: values('wisma'), pidana: values('pidana'), negara: values('negara'), remisi: values('kategori_remisi') };
  }, [mergedData]);

  // 3. Filter inmates berdasarkan query (live search) - di-defer agar typing lebih ringan
  const filteredInmates = useMemo(() => {
    if (!normalizedQuery && !hasActiveFilters) return [];
    return normalizedData
      .filter((inmate) => (
        (!normalizedQuery || inmate.nama.includes(normalizedQuery) || inmate.wisma.includes(normalizedQuery) ||
        inmate.pidana.includes(normalizedQuery) || inmate.no_registrasi.includes(normalizedQuery) ||
        inmate.negara.includes(normalizedQuery) || inmate.masa_2_3.includes(normalizedQuery) ||
        inmate.vonis.includes(normalizedQuery) || inmate.nik.includes(normalizedQuery) ||
        inmate.remisi.includes(normalizedQuery) || inmate.kategori_remisi.includes(normalizedQuery)) &&
        (!filters.wisma || inmate.wisma === filters.wisma.toLowerCase()) &&
        (!filters.pidana || inmate.pidana === filters.pidana.toLowerCase()) &&
        (!filters.negara || inmate.negara === filters.negara.toLowerCase()) &&
        (!filters.remisi || inmate.kategori_remisi === filters.remisi.toLowerCase())
      ))
      .map((inmate) => inmate.raw);
  }, [normalizedData, normalizedQuery, filters, hasActiveFilters]);

  return (
    <div className="inmate-search-container">
      <div className="search-container">
        <input
          type="text"
          placeholder="🔍 Cari nama, NIK, remisi, wisma, atau no. registrasi..."
          value={query}
          onChange={handleInputChange}
          className="search-input"
        />
        <Search className="search-icon" size={22} />
      </div>

      <div className="quick-filters" aria-label="Filter cepat">
        {['wisma', 'pidana', 'negara', 'remisi'].map((field) => (
          <select key={field} value={filters[field]} onChange={(event) => setFilters({ ...filters, [field]: event.target.value })}>
            <option value="">Semua {field === 'pidana' ? 'pidana' : field === 'remisi' ? 'kategori remisi' : field}</option>
            {filterOptions[field].map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        ))}
        {hasActiveFilters && <button className="clear-filters" onClick={() => setFilters({ wisma: '', pidana: '', negara: '', remisi: '' })}>Reset filter</button>}
      </div>

      {isLoading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p className="loading-text">Mencari data...</p>
        </div>
      )}

      <div className="inmate-display">
        {/* Pesan tidak ditemukan */}
        {!isLoading && (query || hasActiveFilters) && filteredInmates.length === 0 && (
          <p>
            ❌ Data tidak ditemukan.
            <br /><br />
            💡 Coba gunakan kata kunci lain atau periksa ejaan.
          </p>
        )}

        {/* Hasil pencarian */}
        {!isLoading && (query || hasActiveFilters) && filteredInmates.length > 0 && (
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
              {filteredInmates.map((inmate, index) => {
                const key = inmate.no_registrasi || index;
                const isExpanded = expanded === key;
                const isTahanan = /^AIII\//i.test(String(inmate.no_registrasi || '').trim());
                return (
                  <li key={key} className="suggestion-item result-card">
                    <div className="result-card-header">
                      <div><span className="result-reg">{highlightText(inmate.no_registrasi, normalizedQuery)}</span><h3>{highlightText(inmate.nama, normalizedQuery)}</h3></div>
                      {inmate.tanggal_ekspirasi && <span className="expiration-badge">Ekspirasi {formatDate(inmate.tanggal_ekspirasi)}</span>}
                    </div>
                    <div className="result-core">
                      {isTahanan && <span className="inmate-status">Tahanan · Belum Vonis</span>}
                      {inmate.wisma && <span>🏠 {highlightText(inmate.wisma, normalizedQuery)}</span>}
                      {inmate.pidana && <span>⚖️ {highlightText(inmate.pidana, normalizedQuery)}</span>}
                      {inmate.tanggal_masuk && <span>📅 Masuk {formatDate(inmate.tanggal_masuk)}</span>}
                    </div>
                    <button className="detail-toggle" onClick={() => setExpanded(isExpanded ? null : key)} aria-expanded={isExpanded}>{isExpanded ? 'Sembunyikan detail' : 'Lihat detail'}</button>
                    {isExpanded && <div className="detail-sections">
                      {((inmate.vonis && !isTahanan) || inmate.masa_2_3) && <section><h4>Pidana</h4>{inmate.vonis && !isTahanan && <p><b>Vonis</b>{inmate.vonis}</p>}{inmate.masa_2_3 && <p><b>Masa 2/3</b>{formatDate(inmate.masa_2_3)}</p>}</section>}
                      {(inmate.remisi || inmate.kategori_remisi) && <section><h4>Remisi</h4>{inmate.remisi && <p><b>Total remisi</b>{inmate.remisi}</p>}{inmate.kategori_remisi && <p><b>Kategori</b>{inmate.kategori_remisi}</p>}</section>}
                      {(inmate.negara || inmate.nik) && <section><h4>Identitas</h4>{inmate.negara && <p><b>Negara</b>{inmate.negara}</p>}{inmate.nik && <p><b>NIK</b>{inmate.nik}</p>}</section>}
                    </div>}
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {/* Kosongkan area saat belum ada pencarian */}
      </div>
    </div>
  );
};

export default InmateSearch;

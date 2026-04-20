/**
 * data-loader.js — Caricamento dati OHLCV con cache IndexedDB.
 * Pipeline: JSON locale → Cache IndexedDB → Binance API live.
 */

import { aggregateWeekly } from './candles.js';

const DB_NAME = 'BTC_PatternAnalyzer';
const DB_VERSION = 1;
const STORE_NAME = 'ohlcv';
const BINANCE_BASE = 'https://api.binance.com/api/v3/klines';
const CHUNK_LIMIT = 1000;
const DATA_START_MS = new Date('2017-08-17').getTime();
const CACHE_TTL_HOURS = 20;

/* ─── IndexedDB ─────────────────────────────────────────────── */
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function cacheGet(key) {
  try {
    const db = await openDB();
    return new Promise(resolve => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch { return null; }
}

export async function cacheSet(key, data) {
  try {
    const db = await openDB();
    return new Promise(resolve => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put({ id: key, data, timestamp: Date.now() });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch { return false; }
}

export async function cacheClear() {
  try {
    const db = await openDB();
    return new Promise(resolve => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch { return false; }
}

function isCacheFresh(cached) {
  if (!cached || !cached.timestamp) return false;
  return Date.now() - cached.timestamp < CACHE_TTL_HOURS * 3600 * 1000;
}

/* ─── Binance Fetcher ───────────────────────────────────────── */
function parseBinanceKline(k) {
  return {
    date: new Date(k[0]).toISOString().split('T')[0],
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5])
  };
}

async function fetchBinanceChunk(startTime) {
  const url = `${BINANCE_BASE}?symbol=BTCUSDT&interval=1d&limit=${CHUNK_LIMIT}&startTime=${startTime}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Binance API error: ${res.status}`);
  return (await res.json()).map(parseBinanceKline);
}

export async function fetchAllBinanceDaily(onProgress) {
  const allCandles = [];
  let startTime = DATA_START_MS;
  const now = Date.now();
  let chunkNum = 0;
  const totalEstChunks = Math.ceil((now - DATA_START_MS) / (CHUNK_LIMIT * 86400000));

  while (startTime < now) {
    chunkNum++;
    if (onProgress) onProgress(chunkNum, totalEstChunks);
    const chunk = await fetchBinanceChunk(startTime);
    if (chunk.length === 0) break;
    allCandles.push(...chunk);
    const lastDate = new Date(chunk[chunk.length - 1].date);
    startTime = lastDate.getTime() + 86400000;
    await new Promise(r => setTimeout(r, 200));
  }

  const seen = new Set();
  return allCandles.filter(c => !seen.has(c.date) && seen.add(c.date));
}

/* ─── Main orchestrator ─────────────────────────────────────── */
export async function loadData({ forceRefresh = false, onStatus = () => {} } = {}) {
  // 1. Try local JSON
  if (!forceRefresh) {
    try {
      onStatus('Ricerca file JSON locali…');
      const dailyRes = await fetch('./data/btc_daily_data.json');
      if (dailyRes.ok) {
        const daily = await dailyRes.json();
        let weekly;
        try {
          const wRes = await fetch('./data/btc_weekly_data.json');
          weekly = wRes.ok ? await wRes.json() : aggregateWeekly(daily);
        } catch { weekly = aggregateWeekly(daily); }
        return { daily, weekly, source: 'local' };
      }
    } catch { /* continue */ }
  }

  // 2. Try IndexedDB
  if (!forceRefresh) {
    onStatus('Ricerca cache locale (IndexedDB)…');
    const cached = await cacheGet('btc_daily');
    if (cached?.data?.length > 100 && isCacheFresh(cached)) {
      const cachedW = await cacheGet('btc_weekly');
      const weekly = cachedW?.data || aggregateWeekly(cached.data);
      return { daily: cached.data, weekly, source: 'cache', cachedAt: cached.timestamp };
    }
  }

  // 3. Fetch from Binance
  onStatus('Download da Binance API…');
  const daily = await fetchAllBinanceDaily((chunk, total) => {
    const pct = Math.min(100, Math.round((chunk / total) * 100));
    onStatus(`Download OHLCV… ${pct}% (chunk ${chunk}/${total})`);
  });
  if (daily.length < 100) throw new Error('Dati insufficienti da Binance');

  const weekly = aggregateWeekly(daily);
  onStatus('Salvataggio in cache…');
  await cacheSet('btc_daily', daily);
  await cacheSet('btc_weekly', weekly);

  return { daily, weekly, source: 'binance' };
}

export function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Download,
  Settings,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Globe,
  WifiOff,
  Database,
  X,
  Languages,
  Eye
} from 'lucide-react';
import { incrementCounter, getLocalCounter, setLocalCounter } from './utils/kvdbHelper';
import { generateCertificateDataUrl, triggerDownload } from './utils/canvasHelper';
import { ConfettiEffect } from './components/ConfettiEffect';

// Helper to get dynamic prefix based on date (DDMM format)
const getDynamicPrefix = () => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `I-PWT-BTK-${day}${month}-`;
};

const DEFAULT_SETTINGS = {
  nameX: 2863,
  nameY: 1404,
  nameFontSize: 250,
  nameColor: '#f75014',
  nameFontFamily: 'Italianno',
  nameFontWeight: 'normal',
  idX: 1959,
  idY: 3361,
  idFontSize: 75,
  idColor: '#000000',
  idFontFamily: 'GlacialIndifference',
  idFontWeight: 'bold',
  idPrefix: getDynamicPrefix(),
  idDigits: 4,
  bucketId: 'sertif_ayc_booth_2026_a8d7',
  counterKey: 'cert_counter_v4',
  counterOffset: 1,
  isOfflineMode: false,
  templateType: 'ID' as 'EN' | 'ID',
  dateX: 2863,
  dateY: 2139,
  dateFontSize: 91,
  dateColor: '#000000',
  dateFontFamily: 'GlacialIndifference',
  dateFontWeight: 'normal',
  designType: 1,
};

// Title Case Helper
const toTitleCase = (str: string) => {
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
  });
};

const INDO_MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const EN_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const getFormattedDate = (templateType: 'EN' | 'ID') => {
  const now = new Date();
  const day = now.getDate();
  const year = now.getFullYear();
  if (templateType === 'EN') {
    const month = EN_MONTHS[now.getMonth()];
    return `Bogor, ${month} ${day}, ${year}`;
  } else {
    const month = INDO_MONTHS[now.getMonth()];
    return `Bogor, ${day} ${month} ${year}`;
  }
};

export default function App() {
  // Main states
  const [userName, setUserName] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStep, setDownloadStep] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [triggerConfetti, setTriggerConfetti] = useState(false);
  const [lastGeneratedId, setLastGeneratedId] = useState('');
  
  // Settings / Admin Panel state
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('sertif_ayc_settings_v8');
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  const [localCounterVal, setLocalCounterVal] = useState(0);

  // Hidden Canvas Ref for high-res drawing
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Image container Ref for dragging and measuring preview
  const containerRef = useRef<HTMLDivElement>(null);
  const [previewWidth, setPreviewWidth] = useState(600);

  // Monitor preview element size
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setPreviewWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    
    // Sync local counter state
    setLocalCounterVal(getLocalCounter(settings.bucketId, settings.counterKey));

    return () => observer.disconnect();
  }, [settings.bucketId, settings.counterKey]);

  // Save settings helper
  const updateSetting = <K extends keyof typeof DEFAULT_SETTINGS>(
    key: K,
    value: (typeof DEFAULT_SETTINGS)[K]
  ) => {
    setSettings((prev: typeof DEFAULT_SETTINGS) => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem('sertif_ayc_settings_v8', JSON.stringify(updated));
      return updated;
    });
  };

  // Get current template path
  const templatePath = useMemo(() => {
    return `/assets/${settings.designType} ${settings.templateType}.png`;
  }, [settings.designType, settings.templateType]);

  // Format ID helper
  const formatId = useCallback((num: number) => {
    const offsetNum = num + settings.counterOffset - 1;
    const padded = String(offsetNum).padStart(settings.idDigits, '0');
    return `${settings.idPrefix}${padded}`;
  }, [settings.counterOffset, settings.idDigits, settings.idPrefix]);

  // Computed next ID for preview
  const nextPreviewId = useMemo(() => {
    const nextNum = localCounterVal + 1;
    return formatId(nextNum);
  }, [localCounterVal, formatId]);



  // Current dynamic formatted date based on active template language
  const currentFormattedDate = useMemo(() => {
    return getFormattedDate(settings.templateType);
  }, [settings.templateType]);

  // Formatted display name
  const displayName = useMemo(() => {
    return userName ? toTitleCase(userName.trim()) : '';
  }, [userName]);

  // Download Handler
  const handleDownload = async () => {
    if (!userName.trim()) {
      alert('Silakan masukkan nama lengkap Anda terlebih dahulu!');
      return;
    }

    setIsDownloading(true);
    setShowSuccess(false);
    setDownloadStep('Menghubungkan ke server nomor ID...');

    try {
      // 1. Fetch incremented ID
      const result = await incrementCounter(
        settings.bucketId,
        settings.counterKey,
        settings.isOfflineMode
      );

      // Sync local counter state
      setLocalCounterVal(result.value);

      const generatedIdStr = formatId(result.value);
      setLastGeneratedId(generatedIdStr);

      setDownloadStep('Membuat sertifikat resolusi tinggi...');

      // 2. Render on high-res canvas
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas element not found');

      const finalName = displayName;

      const dataUrl = await generateCertificateDataUrl(canvas, {
        imageUrl: templatePath,
        userName: finalName,
        certId: generatedIdStr,
        certDate: currentFormattedDate,
        nameX: settings.nameX,
        nameY: settings.nameY,
        nameFontSize: settings.nameFontSize,
        nameColor: settings.nameColor,
        nameFontFamily: settings.nameFontFamily,
        nameFontWeight: settings.nameFontWeight,
        idX: settings.idX,
        idY: settings.idY,
        idFontSize: settings.idFontSize,
        idColor: settings.idColor,
        idFontFamily: settings.idFontFamily,
        idFontWeight: settings.idFontWeight,
        dateX: settings.dateX,
        dateY: settings.dateY,
        dateFontSize: settings.dateFontSize,
        dateColor: settings.dateColor,
        dateFontFamily: settings.dateFontFamily,
        dateFontWeight: settings.dateFontWeight,
      });

      setDownloadStep('Mengunduh sertifikat...');

      // 3. Trigger download
      const cleanFileName = `Sertifikat_${finalName.replace(/\s+/g, '_')}.png`;
      triggerDownload(dataUrl, cleanFileName);

      // 4. Success state
      setIsDownloading(false);
      setShowSuccess(true);
      setTriggerConfetti(true);
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat memproses sertifikat. Coba aktifkan Mode Offline di pengaturan.');
      setIsDownloading(false);
    }
  };

  // Reset local counter settings option
  const resetCounter = () => {
    if (confirm('Apakah Anda yakin ingin menyetel ulang counter lokal ke 0?')) {
      setLocalCounter(settings.bucketId, settings.counterKey, 0);
      setLocalCounterVal(0);
    }
  };

  // Sync manual counter offset
  const syncServerCounter = async () => {
    const rawVal = prompt('Masukkan angka counter saat ini di server (atau kosongkan untuk batalkan):');
    if (rawVal === null) return;
    const parsed = parseInt(rawVal, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      setLocalCounter(settings.bucketId, settings.counterKey, parsed);
      setLocalCounterVal(parsed);
      
      // If online, set value on server by writing
      if (!settings.isOfflineMode) {
        try {
          const url = `https://kvdb.io/${settings.bucketId}/${settings.counterKey}`;
          await fetch(url, {
            method: 'POST',
            body: String(parsed),
          });
          alert('Counter server berhasil diperbarui!');
        } catch {
          alert('Gagal memperbarui counter di server. Nilai disimpan secara lokal.');
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-glacial select-none antialiased">
      {/* Background Gradient Decorative Dots */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-900 to-slate-950 pointer-events-none z-0" />

      {/* Confetti Animation */}
      <ConfettiEffect active={triggerConfetti} onComplete={() => setTriggerConfetti(false)} />

      {/* TOP HEADER */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-400 to-indigo-600 flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-indigo-500/20">
            A
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-indigo-300 bg-clip-text text-transparent m-0 leading-tight">
              AYC Youth Booth
            </h1>
            <p className="text-xs text-slate-400 font-medium">Batik Making @ Youth Day 2026</p>
          </div>
        </div>
        
        <button
          onClick={() => setIsAdminOpen(!isAdminOpen)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all border ${
            isAdminOpen
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 text-slate-300'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">
            {isAdminOpen ? 'Tutup Pengaturan' : 'Pengaturan (Admin)'}
          </span>
        </button>
      </header>

      {/* MAIN CONTAINER */}
      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: CONTROL & INPUT */}
        <div className="lg:col-span-5 flex flex-col gap-6 w-full">
          
          {/* Status Indicator */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-850 border border-slate-800/80 rounded-2xl text-xs font-semibold">
            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400">ID Berikutnya:</span>
              <code className="text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                {nextPreviewId}
              </code>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              {settings.isOfflineMode ? (
                <>
                  <WifiOff className="w-3 h-3 text-amber-400" />
                  <span className="text-amber-400">Offline Mode</span>
                </>
              ) : (
                <>
                  <Globe className="w-3 h-3" />
                  <span>Cloud Counter</span>
                </>
              )}
            </div>
          </div>

          {!showSuccess ? (
            <div className="bg-slate-800/40 border border-slate-700/40 rounded-3xl p-6 shadow-xl backdrop-blur-sm flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <h2 className="text-xl font-bold text-slate-100">Ketik Nama Anda</h2>
                <p className="text-sm text-slate-400">
                  Ketikkan nama lengkap Anda di bawah ini. Kapitalisasi akan disesuaikan secara otomatis.
                </p>
              </div>

              {/* Form Input */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Contoh: Yeremia Ega"
                  className="w-full bg-slate-900/85 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-2xl px-5 py-4 text-lg font-medium text-slate-100 placeholder-slate-500 outline-none transition-all shadow-inner"
                  disabled={isDownloading}
                />
              </div>

              {/* Layout Config: Template Selector */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => updateSetting('templateType', 'ID')}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                    settings.templateType === 'ID'
                      ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-300'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Languages className="w-5 h-5 mb-1.5" />
                  <span className="text-xs font-bold">Bahasa Indonesia</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => updateSetting('templateType', 'EN')}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                    settings.templateType === 'EN'
                      ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-300'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Globe className="w-5 h-5 mb-1.5" />
                  <span className="text-xs font-bold">English Version</span>
                </button>
              </div>

              {/* Pilih Desain Variasi */}
              <div className="flex flex-col gap-2.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Pilih Desain Sertifikat
                </label>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none select-none">
                  {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => updateSetting('designType', num)}
                      className={`flex-shrink-0 px-4.5 py-3 rounded-2xl border text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                        settings.designType === num
                          ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-300 shadow-md shadow-indigo-500/10'
                          : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Desain {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Info Font */}
              <div className="flex items-center justify-between p-3.5 bg-slate-900/40 border border-slate-800 rounded-2xl text-xs font-semibold">
                <span className="text-slate-400">Gaya Huruf Nama:</span>
                <span className="font-italianno text-2xl text-emerald-400">Italianno Script</span>
              </div>

              {/* Slider Ukuran Huruf Nama */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <span>Ukuran Nama</span>
                  <span className="text-emerald-400 font-semibold">{settings.nameFontSize}px</span>
                </div>
                <input
                  type="range"
                  min="120"
                  max="400"
                  value={settings.nameFontSize}
                  onChange={(e) => updateSetting('nameFontSize', parseInt(e.target.value))}
                  className="w-full accent-emerald-500 h-1.5 bg-slate-900 rounded-lg cursor-pointer"
                />
              </div>

              {/* Download Button */}
              <button
                onClick={handleDownload}
                disabled={isDownloading || !userName.trim()}
                className="w-full relative overflow-hidden group bg-gradient-to-r from-emerald-500 to-teal-600 disabled:from-slate-800 disabled:to-slate-800 text-slate-950 disabled:text-slate-500 font-extrabold text-base py-5 px-6 rounded-2xl shadow-xl shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer disabled:cursor-not-allowed"
              >
                {isDownloading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin text-slate-500" />
                    <span className="text-slate-400">{downloadStep}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 text-slate-950 group-hover:-translate-y-0.5 transition-transform" />
                    <span>Download Sertifikat</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* SUCCESS CARD */
            <div className="bg-slate-800/60 border-2 border-emerald-500/30 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center gap-6 animate-fade-in-up">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold text-emerald-400">Selesai!</h2>
                <p className="text-slate-200 text-sm font-semibold">
                  Sertifikat berhasil diunduh ke perangkat Anda.
                </p>
                <div className="mt-3 p-3 bg-slate-900/60 rounded-xl border border-slate-700/50 text-xs">
                  <div className="text-slate-400 mb-1">ID Terdaftar:</div>
                  <code className="text-emerald-300 font-bold tracking-wider text-sm">{lastGeneratedId}</code>
                </div>
              </div>
              
              <button
                onClick={() => {
                  setUserName('');
                  setShowSuccess(false);
                }}
                className="w-full bg-slate-700 hover:bg-slate-600 active:bg-slate-650 text-slate-200 font-bold py-4 px-6 rounded-2xl transition-all shadow-md"
              >
                Buat Sertifikat Baru
              </button>
            </div>
          )}

          {/* CALIBRATION / ADMIN CONTROLS IN SIDEBAR (ONLY SHOWN IF OPEN) */}
          {isAdminOpen && (
            <div className="bg-slate-850 border border-slate-850 rounded-3xl p-5 flex flex-col gap-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Sliders className="w-4 h-4" />
                  <span className="font-extrabold text-sm uppercase tracking-wider">Panel Kalibrasi</span>
                </div>
                <button
                  onClick={() => setIsAdminOpen(false)}
                  className="text-slate-400 hover:text-slate-200 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Mode Offline Switch */}
              <div className="flex items-center justify-between p-3.5 bg-slate-900/50 border border-slate-800 rounded-2xl">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-slate-300">Mode Mandiri (Offline)</span>
                  <span className="text-[10px] text-slate-500">Gunakan counter local tanpa server</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.isOfflineMode}
                    onChange={(e) => updateSetting('isOfflineMode', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:height after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {/* Database and Key configurations */}
              <div className="flex flex-col gap-3 bg-slate-900/30 p-3.5 border border-slate-800 rounded-2xl">
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wide">Pengaturan Database</span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Bucket ID</label>
                    <input
                      type="text"
                      value={settings.bucketId}
                      onChange={(e) => updateSetting('bucketId', e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-300 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Key Counter</label>
                    <input
                      type="text"
                      value={settings.counterKey}
                      onChange={(e) => updateSetting('counterKey', e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-300 focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Prefix ID</label>
                    <input
                      type="text"
                      value={settings.idPrefix}
                      onChange={(e) => updateSetting('idPrefix', e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-300 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Digit Counter</label>
                    <input
                      type="number"
                      value={settings.idDigits}
                      onChange={(e) => updateSetting('idDigits', parseInt(e.target.value) || 4)}
                      className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-300 focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>
                
                {/* Counter Management */}
                <div className="flex gap-2 mt-2 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={syncServerCounter}
                    className="flex-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs py-1.5 px-2.5 rounded hover:bg-indigo-500/20 transition-all font-bold"
                  >
                    Setel Counter Server
                  </button>
                  <button
                    onClick={resetCounter}
                    className="flex-1 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs py-1.5 px-2.5 rounded hover:bg-rose-500/20 transition-all font-bold"
                  >
                    Reset Lokal
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: PREVIEW SCREEN */}
        <div className="lg:col-span-7 flex flex-col gap-4 w-full">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold px-2">
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>Preview Sertifikat:</span>
            {/* Help guidelines deleted */}
          </div>

          {/* DRAGGABLE PREVIEW WRAPPER */}
          <div
            ref={containerRef}
            className="relative border border-slate-700/60 rounded-3xl overflow-hidden bg-slate-950 aspect-[5000/3535] w-full shadow-2xl flex items-center justify-center"
          >
            {/* The Certificate Image */}
            <img
              src={templatePath}
              alt="Background Certificate Template"
              className="w-full h-full object-contain pointer-events-none select-none"
            />

            {/* Name Preview Overlay */}
            <div
              style={{
                left: `${(settings.nameX / 5000) * 100}%`,
                top: `${(settings.nameY / 3535) * 100}%`,
                transform: 'translate(-50%, -50%)',
                fontSize: `${(settings.nameFontSize / 5000) * previewWidth}px`,
                color: settings.nameColor,
                fontFamily: settings.nameFontFamily === 'Italianno' ? 'Italianno' : 'GlacialIndifference',
                fontWeight: settings.nameFontWeight,
              }}
              className="absolute whitespace-nowrap text-center select-none pointer-events-none"
            >
              {displayName || 'Ketik Nama Anda'}
            </div>

            {/* ID Preview Overlay */}
            <div
              style={{
                left: `${(settings.idX / 5000) * 100}%`,
                top: `${(settings.idY / 3535) * 100}%`,
                transform: 'translate(-50%, -50%)',
                fontSize: `${(settings.idFontSize / 5000) * previewWidth}px`,
                color: settings.idColor,
                fontFamily: 'GlacialIndifference',
                fontWeight: settings.idFontWeight,
              }}
              className="absolute whitespace-nowrap text-center select-none pointer-events-none"
            >
              {nextPreviewId}
            </div>

            {/* Date Preview Overlay */}
            <div
              style={{
                left: `${(settings.dateX / 5000) * 100}%`,
                top: `${(settings.dateY / 3535) * 100}%`,
                transform: 'translate(-50%, -50%)',
                fontSize: `${(settings.dateFontSize / 5000) * previewWidth}px`,
                color: settings.dateColor,
                fontFamily: 'GlacialIndifference',
                fontWeight: settings.dateFontWeight,
              }}
              className="absolute whitespace-nowrap text-center select-none pointer-events-none"
            >
              {currentFormattedDate}
            </div>
          </div>
        </div>

      </main>

      {/* Hidden high-res canvas factory */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}

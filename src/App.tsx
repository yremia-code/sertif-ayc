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
import { incrementCounter, getLocalCounter, setLocalCounter, getRemoteCounter } from './utils/kvdbHelper';
import { generateCertificateDataUrl, triggerDownload } from './utils/canvasHelper';
import { ConfettiEffect } from './components/ConfettiEffect';

// Helper to get prefix
const getDynamicPrefix = () => {
  return 'AYC-PWT-BTK-';
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

const TRANSLATIONS = {
  ID: {
    appTitle: 'AYC Youth Booth',
    appSubtitle: 'Membatik @ Youth Day 2026',
    adminOpen: 'Tutup Pengaturan',
    adminClosed: 'Pengaturan (Admin)',
    nextId: 'ID Berikutnya:',
    offlineMode: 'Mode Offline',
    cloudCounter: 'Cloud Counter',
    typeNameTitle: 'Ketik Nama Anda',
    typeNameDesc: 'Ketikkan nama lengkap Anda di bawah ini. Kapitalisasi akan disesuaikan secara otomatis.',
    fullNameLabel: 'Nama Lengkap',
    inputPlaceholder: 'Contoh: Yeremia Ega',
    fontStyleLabel: 'Gaya Huruf Nama:',
    fontStyleValue: 'Italianno Script',
    fontSizeLabel: 'Ukuran Nama',
    downloadBtn: 'Download Sertifikat',
    downloadingConnect: 'Menghubungkan ke server nomor ID...',
    downloadingRender: 'Membuat sertifikat resolusi tinggi...',
    downloadingTrigger: 'Mengunduh sertifikat...',
    successTitle: 'Selesai!',
    successDesc: 'Sertifikat berhasil diunduh ke perangkat Anda.',
    registeredIdLabel: 'ID Terdaftar:',
    createNewBtn: 'Buat Sertifikat Baru',
    previewTitle: 'Preview Sertifikat:',
    
    // Calibration Panel
    calibrationPanelTitle: 'Panel Kalibrasi',
    offlineModeLabel: 'Mode Mandiri (Offline)',
    offlineModeSub: 'Gunakan counter local tanpa server',
    databaseSettingsTitle: 'Pengaturan Database',
    bucketIdLabel: 'Bucket ID',
    counterKeyLabel: 'Key Counter',
    prefixIdLabel: 'Prefix ID',
    digitCounterLabel: 'Digit Counter',
    setServerCounterBtn: 'Setel Counter Server',
    resetLocalBtn: 'Reset Lokal',
    
    // Alerts and prompts
    alertEmptyName: 'Silakan masukkan nama lengkap Anda terlebih dahulu!',
    alertError: 'Terjadi kesalahan saat memproses sertifikat. Coba aktifkan Mode Offline di pengaturan.',
    confirmReset: 'Apakah Anda yakin ingin menyetel ulang counter lokal ke 0?',
    promptServerCounter: 'Masukkan angka counter saat ini di server (atau kosongkan untuk batalkan):',
    alertServerUpdated: 'Counter server berhasil diperbarui!',
    alertServerFail: 'Gagal memperbarui counter di server. Nilai disimpan secara lokal.',
  },
  EN: {
    appTitle: 'AYC Youth Booth',
    appSubtitle: 'Batik Making @ Youth Day 2026',
    adminOpen: 'Close Settings',
    adminClosed: 'Settings (Admin)',
    nextId: 'Next ID:',
    offlineMode: 'Offline Mode',
    cloudCounter: 'Cloud Counter',
    typeNameTitle: 'Type Your Name',
    typeNameDesc: 'Enter your full name below. Capitalization will be auto-adjusted.',
    fullNameLabel: 'Full Name',
    inputPlaceholder: 'e.g. Yeremia Ega',
    fontStyleLabel: 'Name Font Style:',
    fontStyleValue: 'Italianno Script',
    fontSizeLabel: 'Name Size',
    downloadBtn: 'Download Certificate',
    downloadingConnect: 'Connecting to ID server...',
    downloadingRender: 'Generating high-res certificate...',
    downloadingTrigger: 'Downloading certificate...',
    successTitle: 'Success!',
    successDesc: 'Certificate successfully downloaded to your device.',
    registeredIdLabel: 'Registered ID:',
    createNewBtn: 'Create New Certificate',
    previewTitle: 'Certificate Preview:',
    
    // Calibration Panel
    calibrationPanelTitle: 'Calibration Panel',
    offlineModeLabel: 'Standalone Mode (Offline)',
    offlineModeSub: 'Use local counter without server',
    databaseSettingsTitle: 'Database Settings',
    bucketIdLabel: 'Bucket ID',
    counterKeyLabel: 'Counter Key',
    prefixIdLabel: 'ID Prefix',
    digitCounterLabel: 'Counter Digits',
    setServerCounterBtn: 'Set Server Counter',
    resetLocalBtn: 'Reset Local',
    
    // Alerts and prompts
    alertEmptyName: 'Please enter your full name first!',
    alertError: 'An error occurred while processing the certificate. Try enabling Offline Mode in settings.',
    confirmReset: 'Are you sure you want to reset the local counter to 0?',
    promptServerCounter: 'Enter current server counter value (or leave blank to cancel):',
    alertServerUpdated: 'Server counter updated successfully!',
    alertServerFail: 'Failed to update server counter. Value saved locally.',
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
    const saved = localStorage.getItem('sertif_ayc_settings_v9');
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  const t = TRANSLATIONS[settings.templateType as 'ID' | 'EN'];

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

    return () => observer.disconnect();
  }, []);

  // Sync and periodically poll the counter from remote server to prevent ID collisions in UI
  useEffect(() => {
    let active = true;

    const syncCounter = async () => {
      // Step 1: Immediately set local value for instant load
      const localVal = getLocalCounter(settings.bucketId, settings.counterKey);
      if (active) {
        setLocalCounterVal(localVal);
      }

      // Step 2: Fetch current server value if online
      if (settings.isOfflineMode) return;

      try {
        const result = await getRemoteCounter(settings.bucketId, settings.counterKey, false);
        if (active && !result.isFallback) {
          setLocalCounterVal(result.value);
        }
      } catch (err) {
        console.warn('Failed to sync counter from server on load/poll:', err);
      }
    };

    syncCounter();

    // Poll every 10 seconds to keep concurrent devices in sync
    const interval = setInterval(syncCounter, 10000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [settings.bucketId, settings.counterKey, settings.isOfflineMode]);

  // Save settings helper
  const updateSetting = <K extends keyof typeof DEFAULT_SETTINGS>(
    key: K,
    value: (typeof DEFAULT_SETTINGS)[K]
  ) => {
    setSettings((prev: typeof DEFAULT_SETTINGS) => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem('sertif_ayc_settings_v9', JSON.stringify(updated));
      return updated;
    });
  };

  // Get current template path
  const templatePath = useMemo(() => {
    return `/assets/1 ${settings.templateType}.png`;
  }, [settings.templateType]);

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
      alert(t.alertEmptyName);
      return;
    }

    setIsDownloading(true);
    setShowSuccess(false);
    setDownloadStep(t.downloadingConnect);

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

      setDownloadStep(t.downloadingRender);

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

      setDownloadStep(t.downloadingTrigger);

      // 3. Trigger download
      const cleanFileName = `Sertifikat_${finalName.replace(/\s+/g, '_')}.png`;
      triggerDownload(dataUrl, cleanFileName);

      // 4. Success state
      setIsDownloading(false);
      setShowSuccess(true);
      setTriggerConfetti(true);
    } catch (err) {
      console.error(err);
      alert(t.alertError);
      setIsDownloading(false);
    }
  };

  // Reset local counter settings option
  const resetCounter = () => {
    if (confirm(t.confirmReset)) {
      setLocalCounter(settings.bucketId, settings.counterKey, 0);
      setLocalCounterVal(0);
    }
  };

  // Sync manual counter offset
  const syncServerCounter = async () => {
    const rawVal = prompt(t.promptServerCounter);
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
          alert(t.alertServerUpdated);
        } catch {
          alert(t.alertServerFail);
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#faf7f0] text-slate-800 flex flex-col font-glacial select-none antialiased bg-batik">
      {/* Soft overlay gradient to emphasize center */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/30 via-transparent to-[#ebdcc5]/20 pointer-events-none z-0" />

      {/* Confetti Animation */}
      <ConfettiEffect active={triggerConfetti} onComplete={() => setTriggerConfetti(false)} />

      {/* TOP HEADER */}
      <header className="relative z-10 border-b border-[#e2cca9]/60 bg-white/60 backdrop-blur-md px-6 py-4 flex items-center justify-between shadow-sm shadow-[#451a03]/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#d97706] to-[#7c2d12] flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-[#b45309]/20">
            A
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-[#451a03] m-0 leading-tight tracking-wide">
              {t.appTitle}
            </h1>
            <p className="text-xs text-[#9a3412] font-semibold">{t.appSubtitle}</p>
          </div>
        </div>
        
        <button
          onClick={() => setIsAdminOpen(!isAdminOpen)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all border cursor-pointer ${
            isAdminOpen
              ? 'bg-[#c2410c]/10 border-[#c2410c]/30 text-[#c2410c]'
              : 'bg-white/80 border-[#d4bca3] hover:bg-slate-50 text-[#7c2d12] shadow-sm'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">
            {isAdminOpen ? t.adminOpen : t.adminClosed}
          </span>
        </button>
      </header>

      {/* MAIN CONTAINER */}
      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: CONTROL & INPUT */}
        <div className="lg:col-span-5 flex flex-col gap-6 w-full">
          
          {/* Status Indicator */}
          <div className="flex items-center justify-between px-4 py-3 bg-white/80 border border-[#e5d5be] rounded-2xl text-xs font-semibold shadow-sm">
            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-[#7c2d12]" />
              <span className="text-[#451a03]">{t.nextId}</span>
              <code className="text-[#c2410c] bg-[#c2410c]/5 px-2 py-0.5 rounded border border-[#c2410c]/20 font-bold">
                {nextPreviewId}
              </code>
            </div>
            <div className="flex items-center gap-1.5 text-[#c2410c] bg-[#c2410c]/5 px-2.5 py-0.5 rounded-full border border-[#c2410c]/20">
              {settings.isOfflineMode ? (
                <>
                  <WifiOff className="w-3 h-3 text-amber-600" />
                  <span className="text-amber-700 font-bold">{t.offlineMode}</span>
                </>
              ) : (
                <>
                  <Globe className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">{t.cloudCounter}</span>
                </>
              )}
            </div>
          </div>

          {!showSuccess ? (
            <div className="bg-white/80 border border-[#e5d5be] rounded-3xl p-6 shadow-xl shadow-[#b45309]/5 backdrop-blur-sm flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <h2 className="text-xl font-extrabold text-[#451a03]">{t.typeNameTitle}</h2>
                <p className="text-sm text-slate-650 leading-relaxed">
                  {t.typeNameDesc}
                </p>
              </div>

              {/* Form Input */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-[#7c2d12] uppercase tracking-wider">
                  {t.fullNameLabel}
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder={t.inputPlaceholder}
                  className="w-full bg-[#fdfcf7] border border-[#d4bca3] focus:border-[#b45309] focus:ring-2 focus:ring-[#b45309]/20 rounded-2xl px-5 py-4 text-lg font-semibold text-[#451a03] placeholder-slate-400 outline-none transition-all shadow-inner"
                  disabled={isDownloading}
                />
              </div>

              {/* Layout Config: Template Selector */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => updateSetting('templateType', 'ID')}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer active:scale-95 ${
                    settings.templateType === 'ID'
                      ? 'bg-[#b45309]/15 border-[#b45309]/50 text-[#7c2d12] font-extrabold shadow-sm'
                      : 'bg-white border-[#e5d5be] text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <Languages className="w-5 h-5 mb-1.5 text-[#b45309]" />
                  <span className="text-xs font-bold">Bahasa Indonesia</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => updateSetting('templateType', 'EN')}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer active:scale-95 ${
                    settings.templateType === 'EN'
                      ? 'bg-[#b45309]/15 border-[#b45309]/50 text-[#7c2d12] font-extrabold shadow-sm'
                      : 'bg-white border-[#e5d5be] text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <Globe className="w-5 h-5 mb-1.5 text-[#b45309]" />
                  <span className="text-xs font-bold">English Version</span>
                </button>
              </div>

              {/* Info Font */}
              <div className="flex items-center justify-between p-3.5 bg-[#faf7f0]/60 border border-[#e5d5be] rounded-2xl text-xs font-semibold">
                <span className="text-slate-500">{t.fontStyleLabel}</span>
                <span className="font-italianno text-2xl text-[#b45309] font-bold">{t.fontStyleValue}</span>
              </div>

              {/* Slider Ukuran Huruf Nama */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-bold text-[#7c2d12] uppercase tracking-wider">
                  <span>{t.fontSizeLabel}</span>
                  <span className="text-[#b45309] font-extrabold">{settings.nameFontSize}px</span>
                </div>
                <input
                  type="range"
                  min="120"
                  max="400"
                  value={settings.nameFontSize}
                  onChange={(e) => updateSetting('nameFontSize', parseInt(e.target.value))}
                  className="w-full accent-[#b45309] h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>

              {/* Download Button */}
              <button
                onClick={handleDownload}
                disabled={isDownloading || !userName.trim()}
                className="w-full relative overflow-hidden group bg-gradient-to-r from-[#d97706] to-[#b45309] disabled:from-slate-200 disabled:to-slate-200 text-white disabled:text-slate-400 font-extrabold text-base py-5 px-6 rounded-2xl shadow-xl shadow-[#b45309]/10 hover:shadow-[#b45309]/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer disabled:cursor-not-allowed"
              >
                {isDownloading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin text-slate-400" />
                    <span className="text-slate-400">{downloadStep}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 text-white group-hover:-translate-y-0.5 transition-transform" />
                    <span>{t.downloadBtn}</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* SUCCESS CARD */
            <div className="bg-white/90 border-2 border-[#b45309]/30 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center gap-6 animate-fade-in-up">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-extrabold text-emerald-700">{t.successTitle}</h2>
                <p className="text-slate-700 text-sm font-semibold">
                  {t.successDesc}
                </p>
                <div className="mt-3 p-3 bg-[#faf7f0] rounded-xl border border-[#e5d5be] text-xs">
                  <div className="text-slate-500 mb-1">{t.registeredIdLabel}</div>
                  <code className="text-[#b45309] font-bold tracking-wider text-sm">{lastGeneratedId}</code>
                </div>
              </div>
              
              <button
                onClick={() => {
                  setUserName('');
                  setShowSuccess(false);
                }}
                className="w-full bg-[#faf7f0] border border-[#d4bca3] hover:bg-[#ebdcc5]/40 text-[#7c2d12] font-bold py-4 px-6 rounded-2xl transition-all shadow-md cursor-pointer"
              >
                {t.createNewBtn}
              </button>
            </div>
          )}

          {/* CALIBRATION / ADMIN CONTROLS IN SIDEBAR (ONLY SHOWN IF OPEN) */}
          {isAdminOpen && (
            <div className="bg-white border border-[#e5d5be] rounded-3xl p-5 flex flex-col gap-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#7c2d12]">
                  <Sliders className="w-4 h-4 text-[#b45309]" />
                  <span className="font-extrabold text-sm uppercase tracking-wider">{t.calibrationPanelTitle}</span>
                </div>
                <button
                  onClick={() => setIsAdminOpen(false)}
                  className="text-slate-400 hover:text-[#7c2d12] p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Mode Offline Switch */}
              <div className="flex items-center justify-between p-3.5 bg-[#faf7f0]/60 border border-[#e5d5be] rounded-2xl">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-[#451a03]">{t.offlineModeLabel}</span>
                  <span className="text-[10px] text-slate-500">{t.offlineModeSub}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.isOfflineMode}
                    onChange={(e) => updateSetting('isOfflineMode', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:height after:h-5 after:w-5 after:transition-all peer-checked:bg-[#b45309]"></div>
                </label>
              </div>

              {/* Database and Key configurations */}
              <div className="flex flex-col gap-3 bg-[#faf7f0]/30 p-3.5 border border-[#e5d5be] rounded-2xl">
                <span className="text-xs font-extrabold text-[#7c2d12] uppercase tracking-wide">{t.databaseSettingsTitle}</span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">{t.bucketIdLabel}</label>
                    <input
                      type="text"
                      value={settings.bucketId}
                      onChange={(e) => updateSetting('bucketId', e.target.value)}
                      className="bg-white border border-[#d4bca3] text-[#451a03] focus:border-[#b45309] rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-[#b45309] outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">{t.counterKeyLabel}</label>
                    <input
                      type="text"
                      value={settings.counterKey}
                      onChange={(e) => updateSetting('counterKey', e.target.value)}
                      className="bg-white border border-[#d4bca3] text-[#451a03] focus:border-[#b45309] rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-[#b45309] outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">{t.prefixIdLabel}</label>
                    <input
                      type="text"
                      value={settings.idPrefix}
                      onChange={(e) => updateSetting('idPrefix', e.target.value)}
                      className="bg-white border border-[#d4bca3] text-[#451a03] focus:border-[#b45309] rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-[#b45309] outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">{t.digitCounterLabel}</label>
                    <input
                      type="number"
                      value={settings.idDigits}
                      onChange={(e) => updateSetting('idDigits', parseInt(e.target.value) || 4)}
                      className="bg-white border border-[#d4bca3] text-[#451a03] focus:border-[#b45309] rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-[#b45309] outline-none"
                    />
                  </div>
                </div>
                
                {/* Counter Management */}
                <div className="flex gap-2 mt-2 pt-2 border-t border-[#e5d5be]">
                  <button
                    onClick={syncServerCounter}
                    className="flex-1 bg-[#b45309]/10 border border-[#b45309]/20 text-[#7c2d12] text-xs py-1.5 px-2.5 rounded hover:bg-[#b45309]/20 transition-all font-bold cursor-pointer"
                  >
                    {t.setServerCounterBtn}
                  </button>
                  <button
                    onClick={resetCounter}
                    className="flex-1 bg-rose-500/10 border border-rose-500/20 text-rose-700 text-xs py-1.5 px-2.5 rounded hover:bg-rose-500/20 transition-all font-bold cursor-pointer"
                  >
                    {t.resetLocalBtn}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: PREVIEW SCREEN */}
        <div className="lg:col-span-7 flex flex-col gap-4 w-full">
          <div className="flex items-center gap-2 text-[#7c2d12] text-xs font-semibold px-2">
            <Eye className="w-3.5 h-3.5 text-[#b45309]" />
            <span>{t.previewTitle}</span>
          </div>

          {/* DRAGGABLE PREVIEW WRAPPER */}
          <div
            ref={containerRef}
            className="relative border border-[#d4bca3] rounded-3xl overflow-hidden bg-[#efeae2] aspect-[5000/3535] w-full shadow-2xl flex items-center justify-center shadow-[#b45309]/5"
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
              {displayName || (settings.templateType === 'EN' ? 'Type Your Name' : 'Ketik Nama Anda')}
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

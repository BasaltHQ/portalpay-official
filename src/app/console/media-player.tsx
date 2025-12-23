"use client";

import { Play, ChevronDown, Ellipsis, SkipBack, SkipForward, ChevronsLeft, ChevronsRight, Music, Trash } from "lucide-react";

import React, { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/modal";

type Props = {
  mediaAudioRef: React.MutableRefObject<HTMLAudioElement | null>;
  analyserMediaRef: React.MutableRefObject<AnalyserNode | null>;
  rafMediaRef: React.MutableRefObject<number | null>;
  audioCtxRef: React.MutableRefObject<AudioContext | null>;
};

export default function MediaPlayerPanel({ mediaAudioRef, analyserMediaRef, rafMediaRef, audioCtxRef }: Props) {
  const UploadIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
  const EQ_FREQS = [60, 170, 310, 600, 1000, 3000, 6000, 12000];
  const [fileName, setFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dropZoneRef = useRef<HTMLDivElement | null>(null);
  const dragCounterRef = useRef<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [ytUrl, setYtUrl] = useState<string>("");
  const [sunoUrl, setSunoUrl] = useState<string>("");
  const [sunoEmbed, setSunoEmbed] = useState<string>("");
  const [active, setActive] = useState<'upload' | 'youtube' | 'suno'>('upload');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastObjectUrlRef = useRef<string | null>(null);
  const lastUploadTimeRef = useRef<number>(0);
  const shouldAutoPlayRef = useRef<boolean>(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [eqPreset, setEqPreset] = useState<string>("flat");
  const [eqGains, setEqGains] = useState<number[]>(() => EQ_FREQS.map(()=>0));
  const eqNodesRef = useRef<BiquadFilterNode[] | null>(null);
  const bandPathsRef = useRef<Path2D[] | null>(null);
  const preGainRef = useRef<GainNode | null>(null);
  const timeAnalyserRef = useRef<AnalyserNode | null>(null);
  const [truePeak, setTruePeak] = useState<number>(0);
  const [preGainDb, setPreGainDb] = useState<number>(0);
  const [eqFreqs, setEqFreqs] = useState<number[]>(() => EQ_FREQS.slice());
  const [eqQs, setEqQs] = useState<number[]>(() => EQ_FREQS.map(()=>0.9));
  const [eqTypes, setEqTypes] = useState<BiquadFilterType[]>(() => EQ_FREQS.map(()=> 'peaking'));
  const selectedBandRef = useRef<number | null>(0);
  const [selectedBand, setSelectedBand] = useState<number | null>(0);
  const draggingRef = useRef<{ index: number } | null>(null);
  const eqCanvasRef = useRef<HTMLCanvasElement | null>(null); // dedicated canvas for EQ + meter
  const preAnalyserRef = useRef<AnalyserNode | null>(null);
  const postAnalyserRef = useRef<AnalyserNode | null>(null);
  const compRef = useRef<DynamicsCompressorNode | null>(null);
  const limiterRef = useRef<DynamicsCompressorNode | null>(null);
  const postGainNodeRef = useRef<GainNode | null>(null);
  const handlePosRef = useRef<{ x: number; y: number }[] | null>(null);
  // Routing for tab capture
  const elementGainRef = useRef<GainNode | null>(null);
  const streamGainRef = useRef<GainNode | null>(null);
  const streamSourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isTabCapturing, setIsTabCapturing] = useState<boolean>(false);
  const [ytStableVolume, setYtStableVolume] = useState<boolean>(true);
  const ytIframeRef = useRef<HTMLIFrameElement | null>(null);
  const [visTheme, setVisTheme] = useState<string>('sunset');
  const peaksRef = useRef<number[] | null>(null);
  const [autoTrim, setAutoTrim] = useState<boolean>(true);
  const [limiterHits, setLimiterHits] = useState<number>(0);
  const lastPosUpdateRef = useRef<number>(0);
  // Info modal to replace native alerts
  const [infoOpen, setInfoOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalDesc, setModalDesc] = useState("");
  const [modalMicrotexts, setModalMicrotexts] = useState<Array<{ label: string; value?: string }>>([]);
  function showInfo(title: string, desc: string, microtexts: Array<{ label: string; value?: string }> = []) {
    try {
      setModalTitle(title);
      setModalDesc(desc);
      setModalMicrotexts(microtexts);
      setInfoOpen(true);
    } catch {}
  }

  // Playlist types and state (Upload, YouTube, Suno)
  type PlaylistItemBase = {
    id: string;
    type: "upload" | "youtube" | "suno";
    title: string;
  };
  type UploadPlaylistItem = PlaylistItemBase & {
    type: "upload";
    fileName?: string;
    linked?: boolean; // whether a blob/objectURL is available in this session
    objectUrl?: string; // session-only; not persisted
  };
  type YtPlaylistItem = PlaylistItemBase & {
    type: "youtube";
    videoId: string;
    authorName?: string;
    thumbnailUrl?: string;
  };
  type SunoPlaylistItem = PlaylistItemBase & {
    type: "suno";
    sunoId: string;
    embedSrc?: string;
  };
  type PlaylistItem = UploadPlaylistItem | YtPlaylistItem | SunoPlaylistItem;

  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [autoSequence, setAutoSequence] = useState<boolean>(true);

  type SavedPlaylist = { id: string; name: string; items: Omit<PlaylistItem, "objectUrl" | "linked">[] };
  const [savedPlaylists, setSavedPlaylists] = useState<SavedPlaylist[]>([]);
  const [playlistNameDraft, setPlaylistNameDraft] = useState<string>("");
  const [savedDropdownOpen, setSavedDropdownOpen] = useState<boolean>(false);
  const savedDropdownRef = useRef<HTMLDivElement | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const PLAYLIST_STORAGE_KEY = "cb:media:playlists";

  function sanitizeForStorage(items: PlaylistItem[]): Omit<PlaylistItem, "objectUrl" | "linked">[] {
    return items.map((it) => {
      const base = { id: it.id, type: it.type, title: it.title } as any;
      if (it.type === "upload") {
        return { ...base, fileName: (it as UploadPlaylistItem).fileName };
      }
      if (it.type === "youtube") {
        return { ...base, videoId: (it as YtPlaylistItem).videoId };
      }
      return { ...base, sunoId: (it as SunoPlaylistItem).sunoId, embedSrc: (it as SunoPlaylistItem).embedSrc };
    });
  }
  function loadPlaylistsFromStorage(): void {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(PLAYLIST_STORAGE_KEY) : null;
      if (!raw) return;
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        setSavedPlaylists(
          arr
            .filter((p: any) => p && typeof p.id === "string" && typeof p.name === "string" && Array.isArray(p.items))
            .map((p: any) => ({ id: p.id, name: p.name, items: p.items }))
        );
      }
    } catch {}
  }
  function savePlaylistsToStorage(next: SavedPlaylist[]): void {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(PLAYLIST_STORAGE_KEY, JSON.stringify(next));
      }
    } catch {}
  }
  useEffect(() => {
    loadPlaylistsFromStorage();
  }, []);
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!savedDropdownOpen) return;
      const el = savedDropdownRef.current;
      if (el && e.target instanceof Node && el.contains(e.target)) return;
      setSavedDropdownOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
    };
  }, [savedDropdownOpen]);

  // Playlist Builder (modal)
  const [builderOpen, setBuilderOpen] = useState(false);
  const [builderType, setBuilderType] = useState<"upload" | "youtube" | "suno">("upload");
  const builderFileInputRef = useRef<HTMLInputElement | null>(null);
  const [builderYtUrl, setBuilderYtUrl] = useState<string>("");
  const [builderSunoInput, setBuilderSunoInput] = useState<string>("");

  function builderAddUpload() {
    const f = builderFileInputRef.current?.files?.[0] || null;
    if (!isSupportedAudio(f)) {
      showInfo("Invalid file", "Choose an MP3 or WAV file for upload.", [
        { label: "Selected", value: "none or unsupported" },
        { label: "Accepted", value: "MP3, WAV" },
      ]);
      return;
    }
    const url = URL.createObjectURL(f!);
    const id = `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const item: UploadPlaylistItem = {
      id,
      type: "upload",
      title: f!.name || "Upload",
      fileName: f!.name || "Upload",
      linked: true,
      objectUrl: url,
    };
    setPlaylist((prev) => [...prev, item]);
    try { if (builderFileInputRef.current) builderFileInputRef.current.value = ""; } catch {}
  }
  function builderAddYouTube() {
    const vid = parseYouTube(builderYtUrl.trim());
    if (!vid) {
      showInfo("Invalid YouTube URL", "Enter a valid YouTube URL.", [
        { label: "Input", value: builderYtUrl },
      ]);
      return;
    }
    const id = `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const item: YtPlaylistItem = { id, type: "youtube", title: `YouTube: ${vid}`, videoId: vid };
    setPlaylist((prev) => [...prev, item]);
    setBuilderYtUrl("");
    // Enrich with YouTube metadata (title, author, thumbnail)
    try { enrichYouTubeItem(id, vid); } catch {}
  }
  function builderAddSuno() {
    const embed = extractSunoEmbedSrc(builderSunoInput || "");
    const sId = embed ? (embed.split("/embed/")[1] || "") : parseSuno((builderSunoInput || "").trim());
    if (!sId) {
      showInfo("Invalid Suno input", "Paste a full Suno embed iframe or a Suno link.", [
        { label: "Input", value: builderSunoInput },
      ]);
      return;
    }
    const id = `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const item: SunoPlaylistItem = { id, type: "suno", title: `Suno: ${sId}`, sunoId: sId, embedSrc: embed || undefined };
    setPlaylist((prev) => [...prev, item]);
    setBuilderSunoInput("");
  }

  function addCurrentToPlaylist() {
    const id = `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    if (active === "upload") {
      if (!fileName || !lastObjectUrlRef.current) {
        showInfo("No audio loaded", "Load an audio file first, then add to playlist.", [
          { label: "File name", value: fileName || "(none)" },
        ]);
        return;
      }
      const item: UploadPlaylistItem = {
        id,
        type: "upload",
        title: fileName || "Upload",
        fileName,
        linked: true,
        objectUrl: lastObjectUrlRef.current || undefined,
      };
      setPlaylist((prev) => [...prev, item]);
      return;
    }
    if (active === "youtube") {
      const vid = parseYouTube(ytUrl.trim());
      if (!vid) {
        showInfo("Invalid YouTube URL", "Enter a valid YouTube URL before adding.", [
          { label: "Input", value: ytUrl },
        ]);
        return;
      }
      const item: YtPlaylistItem = { id, type: "youtube", title: `YouTube: ${vid}`, videoId: vid };
      setPlaylist((prev) => [...prev, item]);
      // Enrich with YouTube metadata (title, author, thumbnail)
      try { enrichYouTubeItem(id, vid); } catch {}
      return;
    }
    if (active === "suno") {
      const embed = extractSunoEmbedSrc(sunoEmbed || "");
      const sId = embed ? (embed.split("/embed/")[1] || "") : parseSuno(sunoUrl.trim() || "");
      if (!sId) {
        showInfo("Invalid Suno input", "Paste a valid Suno embed or link before adding.", [
          { label: "Embed", value: sunoEmbed || "(none)" },
          { label: "Link", value: sunoUrl || "(none)" },
        ]);
        return;
      }
      const item: SunoPlaylistItem = { id, type: "suno", title: `Suno: ${sId}`, sunoId: sId, embedSrc: embed || undefined };
      setPlaylist((prev) => [...prev, item]);
      return;
    }
  }

  function playPlaylistItemAt(index: number) {
    const item = playlist[index];
    if (!item) return;
    setCurrentIndex(index);
    const a = mediaAudioRef.current;
    if (!a) return;
    if (item.type === "upload") {
      const up = item as UploadPlaylistItem;
      if (!up.linked || !up.objectUrl) {
        showInfo("File missing", `Click "Relink" on this item to select the file.`, [
          { label: "Title", value: up.title || "(untitled)" },
        ]);
        return;
      }
      try { setActive("upload"); } catch {}
      setFileName(up.fileName || "Upload");
      lastObjectUrlRef.current = up.objectUrl;
      try { lastUploadTimeRef.current = 0; } catch {}
      a.src = up.objectUrl;
      a.currentTime = 0;
      // Ensure reliable playback on user action (handles prev/first buttons)
      try { audioCtxRef.current?.resume(); } catch {}
      try { shouldAutoPlayRef.current = true; } catch {}
      const onReady = () => {
        // Play once media is ready; then clear autoplay guard
        a.play().catch(()=>{});
        try { shouldAutoPlayRef.current = false; } catch {}
      };
      a.addEventListener('canplay', onReady, { once: true } as any);
      // Try immediate play, and if it fails, force a load to trigger canplay
      a.play().catch(() => { try { a.load(); } catch {} });
      return;
    }
    if (item.type === "youtube") {
      const yt = item as YtPlaylistItem;
      try { setActive("youtube"); } catch {}
      setYtUrl(`https://youtube.com/watch?v=${yt.videoId}`);
      // useEffect will load and play via proxy
      return;
    }
    if (item.type === "suno") {
      const sn = item as SunoPlaylistItem;
      try { setActive("suno"); } catch {}
      setSunoEmbed(sn.embedSrc ? `<iframe src="${sn.embedSrc}"></iframe>` : "");
      setSunoUrl(`https://suno.com/s/${sn.sunoId}`);
      // useEffect will load and play via proxy
      return;
    }
  }
  function playlistTogglePlayAt(index: number) {
    const a = mediaAudioRef.current;
    if (!a) return;
    const item = playlist[index];
    if (!item) return;

    // If the requested item is already the current one, just toggle play/pause without resetting.
    if (currentIndex === index) {
      togglePlay();
      return;
    }

    // Otherwise, select/play that item
    playPlaylistItemAt(index);
  }

  function playNextInPlaylist() {
    if (!autoSequence) return;
    if (currentIndex < 0) return;
    const next = currentIndex + 1;
    if (next < playlist.length) {
      playPlaylistItemAt(next);
    }
  }
  function moveItem(index: number, dir: -1 | 1) {
    setPlaylist((prev) => {
      const next = prev.slice();
      const j = index + dir;
      if (j < 0 || j >= next.length) return next;
      const [it] = next.splice(index, 1);
      next.splice(j, 0, it);
      return next;
    });
  }
  function removeItem(index: number) {
    setPlaylist((prev) => {
      const next = prev.slice();
      next.splice(index, 1);
      return next;
    });
    if (index === currentIndex) setCurrentIndex(-1);
  }
  function relinkUpload(index: number, file: File | null) {
    if (!file) return;
    if (!isSupportedAudio(file)) {
      showInfo("Invalid file", "Please select an MP3 or WAV file.", [
        { label: "Selected", value: "none or unsupported" },
        { label: "Accepted", value: "MP3, WAV" },
      ]);
      return;
    }
    const url = URL.createObjectURL(file);
    setPlaylist((prev) =>
      prev.map((it, i) => (i === index && it.type === "upload" ? { ...(it as UploadPlaylistItem), linked: true, objectUrl: url, fileName: file.name } : it))
    );
  }
  function saveCurrentPlaylist(name: string) {
    const trimmed = (name || "").trim();
    if (!trimmed) {
      showInfo("Name required", "Enter a name for the playlist.", []);
      return;
    }
    const id = `pl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const record: SavedPlaylist = { id, name: trimmed, items: sanitizeForStorage(playlist) };
    const next = [record, ...savedPlaylists].slice(0, 20);
    setSavedPlaylists(next);
    savePlaylistsToStorage(next);
  }
  function loadSavedPlaylist(id: string) {
    const p = savedPlaylists.find((x) => x.id === id);
    if (!p) return;
    // When loading, upload items are not linked until user relinks (we mark linked=false)
    const items: PlaylistItem[] = p.items.map((raw: any) => {
      const base = { id: raw.id || `item-${Math.random().toString(36).slice(2, 8)}`, title: raw.title || "" } as any;
      if (raw.type === "upload") {
        return { ...base, type: "upload", fileName: raw.fileName || "", linked: false, objectUrl: undefined } as UploadPlaylistItem;
      }
      if (raw.type === "youtube") {
        return { ...base, type: "youtube", videoId: raw.videoId || "", title: raw.title || `YouTube: ${raw.videoId || ""}` } as YtPlaylistItem;
      }
      return { ...base, type: "suno", sunoId: raw.sunoId || "", embedSrc: raw.embedSrc || undefined, title: raw.title || `Suno: ${raw.sunoId || ""}` } as SunoPlaylistItem;
    });
    setPlaylist(items);
    setCurrentIndex(-1);
    // Enrich YouTube items with latest metadata
    try {
      items.forEach((it) => {
        if ((it as any).type === "youtube") enrichYouTubeItem((it as any).id, (it as any).videoId);
      });
    } catch {}
  }
  function deleteSavedPlaylist(id: string) {
    const next = savedPlaylists.filter((x) => x.id !== id);
    setSavedPlaylists(next);
    savePlaylistsToStorage(next);
  }
  function clearPlaylist() {
    setPlaylist([]);
    setCurrentIndex(-1);
  }

  useEffect(() => {
    if (!mediaAudioRef.current) {
      const a = document.createElement('audio');
      a.autoplay = false; a.controls = false; (a as any).playsInline = true; a.preload = 'auto';
      a.muted = false; a.volume = 1; a.crossOrigin = 'anonymous';
      mediaAudioRef.current = a;
    }
    // Wire analyser to visualize
    try {
      const ctx = audioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaElementSource(mediaAudioRef.current!);
      const mono = ctx.createGain();
      try { (mono as any).channelCount = 1; (mono as any).channelCountMode = 'explicit'; } catch {}
      // Mixers for in-page element vs optional tab capture
      const elMix = ctx.createGain(); elMix.gain.value = 1; elementGainRef.current = elMix;
      const streamMix = ctx.createGain(); streamMix.gain.value = 0; streamGainRef.current = streamMix;
      // High-pass to remove DC/rumble that can pump compressors
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 30;
      // Pre-gain stage (before EQ and dynamics)
      const pre = ctx.createGain();
      pre.gain.value = Math.pow(10, (preGainDb || 0) / 20);
      preGainRef.current = pre;
      // Build equalizer (peaking filters)
      const eqNodes: BiquadFilterNode[] = [];
      let eqHead: AudioNode = pre;
      for (let i = 0; i < EQ_FREQS.length; i++) {
        const peq = ctx.createBiquadFilter();
        peq.type = (eqTypes[i] || 'peaking');
        peq.frequency.value = (eqFreqs[i] || EQ_FREQS[i]);
        peq.Q.value = (eqQs[i] || 0.9);
        peq.gain.value = eqGains[i] || 0;
        eqHead.connect(peq);
        eqHead = peq;
        eqNodes.push(peq);
      }
      eqNodesRef.current = eqNodes;
      // Dynamics compressor to flatten peaks
      const comp = new DynamicsCompressorNode(ctx, {
        threshold: -22,
        knee: 30,
        ratio: 8,
        attack: 0.006,
        release: 0.35,
      });
      // Safety limiter near 0 dBFS
      const limiter = new DynamicsCompressorNode(ctx, {
        threshold: -3,
        knee: 0,
        ratio: 30,
        attack: 0.001,
        release: 0.06,
      });
      // Gentle output gain trim to prevent system-side limiter pumping
      const postGain = ctx.createGain();
      postGain.gain.value = 0.9;
      postGainNodeRef.current = postGain;
      const analyser = ctx.createAnalyser(); analyser.fftSize = 2048; analyser.smoothingTimeConstant = 0.85; analyser.minDecibels = -90; analyser.maxDecibels = -10;
      const preAnalyser = ctx.createAnalyser(); preAnalyser.fftSize = 2048; preAnalyser.smoothingTimeConstant = 0.85; preAnalyser.minDecibels = -90; preAnalyser.maxDecibels = -10;
      // Route inputs → mono
      source.connect(elMix);
      elMix.connect(mono);
      streamMix.connect(mono);
      mono.connect(hp);
      hp.connect(preAnalyser);
      hp.connect(pre);
      (eqNodesRef.current && eqNodesRef.current.length ? eqNodesRef.current[eqNodesRef.current.length-1] : pre).connect(comp);
      comp.connect(limiter);
      compRef.current = comp; limiterRef.current = limiter;
      limiter.connect(postGain);
      postGain.connect(analyser);
      // Time-domain analyser for true-peak approximation
      const timeAnalyser = ctx.createAnalyser();
      timeAnalyser.fftSize = 2048;
      // Wire after limiter/postGain so it reflects final output
      timeAnalyserRef.current = timeAnalyser;
      postGain.connect(timeAnalyser);
      analyser.connect(ctx.destination);
      preAnalyserRef.current = preAnalyser;
      postAnalyserRef.current = analyser;
      analyserMediaRef.current = analyser;
      const data = new Uint8Array(analyser.frequencyBinCount);
      const BARS = 48;
      peaksRef.current = Array.from({ length: BARS }, () => 0);
      const gravity = 0.008; // peak fall speed
      let lastLimiterGain = 1;
      function colorFor(t: number): string {
        switch (visTheme) {
          case 'ocean': return `hsl(${200 + 40*t} 80% ${35 + 25*t}%)`;
          case 'neon': return `hsl(${300 - 100*t} 90% ${50 + 20*t}%)`;
          case 'fire': return `hsl(${20 + 30*t} 100% ${45 + 20*t}%)`;
          case 'mono': return `hsl(0 0% ${60 + 20*t}%)`;
          case 'sunset':
          default: return `hsl(${10 + 40*t} 85% ${45 + 20*t}%)`;
        }
      }
      const draw = () => {
        const cvs = eqCanvasRef.current; const g = cvs?.getContext('2d');
        if (!cvs || !g || !postAnalyserRef.current) { rafMediaRef.current = requestAnimationFrame(draw); return; }
        const width = (cvs.clientWidth || (cvs as any).offsetWidth || 500);
        const height = 260; // full pane height including inline meter
        const meterW = 28, padR = meterW + 8; // inline meter at right
        const plotW = width - padR; const plotH = height;
        cvs.width = width; cvs.height = height;
        g.clearRect(0,0,width,height);
        // Helper mappers
        const minFreq = 20, maxFreq = 20000; const minDb = -18, maxDb = 18;
        const freqToX = (f:number)=>{ const t=(Math.log10(f)-Math.log10(minFreq))/(Math.log10(maxFreq)-Math.log10(minFreq)); return t*plotW; };
        const xToFreq = (x:number)=>{ const t = Math.max(0, Math.min(1, x/plotW)); const v = Math.pow(10, Math.log10(minFreq) + t*(Math.log10(maxFreq)-Math.log10(minFreq))); return v; };
        const dbToY = (db:number)=>{ const t=(db-minDb)/(maxDb-minDb); return (1-t)*plotH; };
        const yToDb = (y:number)=>{ const t=1-Math.max(0,Math.min(1,y/plotH)); return minDb + t*(maxDb-minDb); };
        // Grid
        g.fillStyle = 'rgb(20,20,22)'; g.fillRect(0,0,plotW,plotH);
        // meter bg
        g.fillStyle = 'rgb(20,20,22)'; g.fillRect(plotW+8,0,meterW,plotH);
        g.strokeStyle = 'rgba(255,255,255,0.06)'; g.lineWidth = 1;
        g.beginPath();
        const gridFreqs = [20,30,40,50,60,80,100,150,200,300,400,500,800,1000,1500,2000,3000,4000,5000,8000,10000,15000,20000];
        for (const f of gridFreqs) { const x=freqToX(f); g.moveTo(x+0.5,0); g.lineTo(x+0.5,plotH); }
        const gridDb = [-18,-12,-6,0,6,12,18];
        for (const d of gridDb) { const y=dbToY(d); g.moveTo(0,y+0.5); g.lineTo(plotW,y+0.5); }
        g.stroke();
        // Analyser data (pre + post spectrum overlays)
        const pre = preAnalyserRef.current; const post = postAnalyserRef.current;
        if (pre && post) {
          const preB = new Uint8Array(pre.frequencyBinCount); const postB = new Uint8Array(post.frequencyBinCount);
          pre.getByteFrequencyData(preB); post.getByteFrequencyData(postB);
          const fftSize = preB.length; const step = Math.max(1, Math.floor(fftSize/plotW));
          // Pre area
          g.beginPath();
          for (let x=0; x<plotW; x++) {
            const idx = Math.min(fftSize-1, Math.floor(x*step));
            const v = (preB[idx] || 0) / 255; // 0..1
            const y = dbToY(minDb + v * (maxDb - minDb));
            if (x===0) g.moveTo(0,y); else g.lineTo(x,y);
          }
          g.lineTo(plotW,plotH); g.lineTo(0,plotH); g.closePath(); g.fillStyle='rgba(56,189,248,0.18)'; g.fill();
          // Post area
          g.beginPath();
          for (let x=0; x<plotW; x++) {
            const idx = Math.min(fftSize-1, Math.floor(x*step));
            const v = (postB[idx] || 0) / 255;
            const y = dbToY(minDb + v * (maxDb - minDb));
            if (x===0) g.moveTo(0,y); else g.lineTo(x,y);
          }
          g.lineTo(plotW,plotH); g.lineTo(0,plotH); g.closePath(); g.fillStyle='rgba(167,139,250,0.22)'; g.fill();
        }
        // Combined EQ response curve using Biquad getFrequencyResponse
        try {
          const N = Math.min(512, Math.max(256, Math.floor(plotW)));
          const freq = new Float32Array(N);
          const mag = new Float32Array(N);
          const phase = new Float32Array(N);
          for (let i=0;i<N;i++) freq[i] = xToFreq((i/(N-1))*plotW);
          for (let i=0;i<N;i++) mag[i] = 1;
          const nodes = eqNodesRef.current || [];
          for (const node of nodes) {
            const m = new Float32Array(N); const p = new Float32Array(N);
            (node as any).getFrequencyResponse?.(freq, m, p);
            for (let i=0;i<N;i++) mag[i] *= (m[i] || 1);
          }
          g.beginPath();
          for (let i=0;i<N;i++) {
            const db = 20*Math.log10(Math.max(1e-6, mag[i]));
            const x = (i/(N-1))*plotW; const y = dbToY(Math.max(minDb, Math.min(maxDb, db)));
            if (i===0) g.moveTo(x,y); else g.lineTo(x,y);
          }
          g.strokeStyle='hsl(45 95% 60%)'; g.lineWidth=2; g.stroke();
        } catch {}
        // Individual band curves per node
        try {
          const N = Math.min(384, Math.max(256, Math.floor(plotW)));
          const freq = new Float32Array(N);
          for (let i=0;i<N;i++) freq[i] = xToFreq((i/(N-1))*plotW);
          const hues = [30,60,90,120,180,220,260,300];
          const nodes = eqNodesRef.current || [];
          bandPathsRef.current = [];
          for (let b=0;b<nodes.length;b++) {
            const node = nodes[b]; if (!node) continue;
            const mag = new Float32Array(N); const ph = new Float32Array(N);
            (node as any).getFrequencyResponse?.(freq, mag, ph);
            const p = new Path2D();
            for (let i=0;i<N;i++) {
              const db = 20*Math.log10(Math.max(1e-6, mag[i] || 1));
              const x = (i/(N-1))*plotW; const y = dbToY(Math.max(minDb, Math.min(maxDb, db)));
              if (i===0) p.moveTo(x,y); else p.lineTo(x,y);
            }
            const color = `hsl(${hues[b%hues.length]} 90% 60%)`;
            const isSelected = selectedBandRef.current===b;
            g.strokeStyle = color; g.lineWidth = (isSelected?3.2:1.6);
            if (isSelected) { g.save(); g.shadowColor = color; g.shadowBlur = 8; }
            g.stroke(p);
            if (isSelected) { g.restore(); }
            bandPathsRef.current[b] = p;
            // subtle fill around curve
            const grad = g.createLinearGradient(0,0,0,plotH);
            grad.addColorStop(0, `${color.replace('60%', '65%')}`);
            grad.addColorStop(1, 'transparent');
            g.save();
            g.globalAlpha = 0.10;
            const pf = new Path2D(p);
            pf.lineTo(plotW,plotH); pf.lineTo(0,plotH); pf.closePath();
            g.fillStyle = grad; g.fill(pf);
            g.restore();
          }
        } catch {}
        // Band handles anchored to actual band response at center frequency (follows waveform)
        const hues = [30,60,90,120,180,220,260,300];
        for (let i=0;i<eqFreqs.length;i++) {
          const x = Math.max(0, Math.min(plotW, freqToX(eqFreqs[i])));
          // Compute actual response of the node at its center frequency to anchor handle on the curve
          let y = dbToY(eqGains[i] || 0);
          try {
            const nodes = eqNodesRef.current || [];
            const node = nodes[i];
            if (node) {
              const f1 = new Float32Array([eqFreqs[i]]);
              const m1 = new Float32Array(1); const p1 = new Float32Array(1);
              (node as any).getFrequencyResponse?.(f1, m1, p1);
              const db1 = 20*Math.log10(Math.max(1e-6, m1[0] || 1));
              y = dbToY(Math.max(-18, Math.min(18, db1)));
            }
          } catch {}
          y = Math.max(0, Math.min(plotH, y));
          const r = 7;
          g.beginPath(); g.arc(x,y,r,0,Math.PI*2);
          const isSel = selectedBandRef.current === i;
          g.fillStyle = `hsl(${hues[i%hues.length]} 90% ${isSel?60:55}%)`;
          g.fill();
          g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 1.5; g.stroke();
        }
        // Inline true‑peak meter: compute fresh this frame
        let tpNow = 0; try { const ta = timeAnalyserRef.current; if (ta) { const tb = new Float32Array(ta.fftSize); ta.getFloatTimeDomainData(tb); for (let i=0;i<tb.length;i++){ const v=Math.abs(tb[i]||0); if (v>tpNow) tpNow=v; } } } catch {}
        const db = 20*Math.log10(Math.max(1e-5, tpNow));
        const scale = (db+60)/60; // -60..0
        const h = Math.max(0, Math.min(1, scale))*plotH;
        const y = plotH - h;
        const color = db > -1 ? '#ef4444' : db > -6 ? '#f59e0b' : '#22c55e';
        g.fillStyle = color; g.fillRect(plotW+10, y, meterW-12, h);
        g.fillStyle = 'rgba(255,255,255,0.12)';
        for (const d of [-18,-12,-6,0]) { const ty = plotH * (1-((d+60)/60)); g.fillRect(plotW+9, Math.floor(ty)+0.5, meterW-10, 1); }
        // Limiter hit detection via compressor reduction (approx by comparing last stage)
        try {
          const reduction = (limiter as any).reduction || 0; // dB
          if (reduction && reduction < -0.1) {
            setLimiterHits(h => h + 1);
            if (autoTrim && postGain.gain.value > 0.6) {
              // Gradually trim when limiter frequently engages
              const now = performance.now();
              if (now - (lastPosUpdateRef.current || 0) > 500) {
                postGain.gain.value = Math.max(0.6, postGain.gain.value - 0.02);
                lastPosUpdateRef.current = now;
              }
            }
          }
          lastLimiterGain = postGain.gain.value;
        } catch {}
        // Approx true-peak (sample peak after chain)
        try {
          const timeAnalyser = timeAnalyserRef.current;
          if (timeAnalyser) {
            const timeBuf = new Float32Array(timeAnalyser.fftSize);
            timeAnalyser.getFloatTimeDomainData(timeBuf);
            let peak = 0; for (let i=0;i<timeBuf.length;i++) { const v = Math.abs(timeBuf[i] || 0); if (v > peak) peak = v; }
            setTruePeak(peak);
          }
        } catch {}
        // Smooth timeline position while playing
        try {
          const now = performance.now();
          if (now - (lastPosUpdateRef.current || 0) > 80) { // ~12.5 fps UI updates
            if (!isScrubbing && active === 'upload' && mediaAudioRef.current && !mediaAudioRef.current.paused) setPosition(mediaAudioRef.current.currentTime || 0);
            lastPosUpdateRef.current = now;
          }
        } catch {}
        rafMediaRef.current = requestAnimationFrame(draw);
      };
      draw();
      // Media event hooks
      const a = mediaAudioRef.current!;
      const onLoaded = () => setDuration(isFinite(a.duration) ? a.duration : 0);
  const onTime = () => {
    setPosition(a.currentTime || 0);
    try {
      // Track upload playback position for restoration when switching sources
      if (lastObjectUrlRef.current && a.src === lastObjectUrlRef.current) {
        lastUploadTimeRef.current = a.currentTime || 0;
      }
    } catch {}
  };
      const onPlay = () => {
        setIsPlaying(true);
        try { audioCtxRef.current?.resume(); } catch {}
        try { shouldAutoPlayRef.current = false; } catch {}
      };
      const onPause = () => setIsPlaying(false);
      const onEnd = () => {
        setIsPlaying(false);
        setPosition(a.duration || 0);
        try { playNextInPlaylist(); } catch {}
      };
      a.addEventListener('loadedmetadata', onLoaded);
      a.addEventListener('timeupdate', onTime);
      a.addEventListener('play', onPlay);
      a.addEventListener('pause', onPause);
      a.addEventListener('ended', onEnd);
      return () => { if (rafMediaRef.current) cancelAnimationFrame(rafMediaRef.current); a.removeEventListener('loadedmetadata', onLoaded); a.removeEventListener('timeupdate', onTime); a.removeEventListener('play', onPlay); a.removeEventListener('pause', onPause); a.removeEventListener('ended', onEnd); };
    } catch {}
  }, []);

  // Live-apply EQ gains
  useEffect(() => {
    try {
      const nodes = eqNodesRef.current || [];
      for (let i = 0; i < nodes.length; i++) nodes[i].gain.value = eqGains[i] || 0;
    } catch {}
  }, [eqGains]);

  // Live-apply EQ frequencies
  useEffect(() => {
    try {
      const nodes = eqNodesRef.current || [];
      for (let i = 0; i < nodes.length; i++) if (eqFreqs[i]) nodes[i].frequency.value = eqFreqs[i];
    } catch {}
  }, [eqFreqs]);

  // Live-apply EQ Q values
  useEffect(() => {
    try {
      const nodes = eqNodesRef.current || [];
      for (let i = 0; i < nodes.length; i++) if (eqQs[i]) nodes[i].Q.value = eqQs[i];
    } catch {}
  }, [eqQs]);

  // Live-apply EQ types
  useEffect(() => {
    try {
      const nodes = eqNodesRef.current || [];
      for (let i = 0; i < nodes.length; i++) if (eqTypes[i]) nodes[i].type = eqTypes[i];
    } catch {}
  }, [eqTypes]);

  // Live-apply pre-gain
  useEffect(() => {
    try {
      if (preGainRef.current) preGainRef.current.gain.value = Math.pow(10, (preGainDb || 0) / 20);
    } catch {}
  }, [preGainDb]);

  // Stable volume profile for YouTube: update dynamics and output trim when active + toggle enabled
  useEffect(() => {
    try {
      if (active !== 'youtube') return;
      const comp = compRef.current; const limiter = limiterRef.current; const post = postGainNodeRef.current;
      if (!comp || !limiter || !post) return;
      if (ytStableVolume) {
        comp.threshold.setTargetAtTime(-26, comp.context.currentTime, 0.02);
        comp.knee.setTargetAtTime(12, comp.context.currentTime, 0.02);
        comp.ratio.setTargetAtTime(3.5, comp.context.currentTime, 0.02);
        comp.attack.setTargetAtTime(0.008, comp.context.currentTime, 0.02);
        comp.release.setTargetAtTime(0.18, comp.context.currentTime, 0.02);
        limiter.threshold.setTargetAtTime(-2.5, limiter.context.currentTime, 0.01);
        limiter.knee.setTargetAtTime(0, limiter.context.currentTime, 0.01);
        limiter.ratio.setTargetAtTime(30, limiter.context.currentTime, 0.01);
        limiter.attack.setTargetAtTime(0.001, limiter.context.currentTime, 0.01);
        limiter.release.setTargetAtTime(0.06, limiter.context.currentTime, 0.01);
        post.gain.setTargetAtTime(0.92, post.context.currentTime, 0.02);
      } else {
        comp.threshold.setTargetAtTime(-22, comp.context.currentTime, 0.02);
        comp.knee.setTargetAtTime(30, comp.context.currentTime, 0.02);
        comp.ratio.setTargetAtTime(8, comp.context.currentTime, 0.02);
        comp.attack.setTargetAtTime(0.006, comp.context.currentTime, 0.02);
        comp.release.setTargetAtTime(0.35, comp.context.currentTime, 0.02);
        limiter.threshold.setTargetAtTime(-3, limiter.context.currentTime, 0.01);
        limiter.knee.setTargetAtTime(0, limiter.context.currentTime, 0.01);
        limiter.ratio.setTargetAtTime(30, limiter.context.currentTime, 0.01);
        limiter.attack.setTargetAtTime(0.001, limiter.context.currentTime, 0.01);
        limiter.release.setTargetAtTime(0.06, limiter.context.currentTime, 0.01);
        post.gain.setTargetAtTime(0.9, post.context.currentTime, 0.02);
      }
    } catch {}
  }, [ytStableVolume, active]);

  function applyPreset(name: string) {
    const presets: Record<string, number[]> = {
      flat: EQ_FREQS.map(()=>0),
      bass_boost: [6,4,2,0,-1,-2,-3,-4],
      vocal_clarity: [-2,-1,1,2,3,2,1,0],
      treble_boost: [-3,-2,-1,0,1,3,4,5],
      v_shape: [4,2,0,-1,-1,1,3,4],
      lofi_radio: [-4,-3,-2,-1,-1,-2,-3,-4],
      loudness: [3,2,1,0,0,1,2,3],
    };
    const gains = presets[name] || presets.flat;
    setEqPreset(name);
    setEqGains(gains.slice(0, EQ_FREQS.length));
    // Auto theme color mapping per preset
    switch (name) {
      case 'bass_boost': setVisTheme('ocean'); break;
      case 'vocal_clarity': setVisTheme('neon'); break;
      case 'treble_boost': setVisTheme('fire'); break;
      case 'v_shape': setVisTheme('sunset'); break;
      case 'loudness': setVisTheme('neon'); break;
      case 'lofi_radio': setVisTheme('mono'); break;
      default: setVisTheme('sunset'); break;
    }
  }

  function playFile(f: File) {
    const url = URL.createObjectURL(f);
    setFileName(f.name);
    // Track current object URL without revoking (playlist items may reference it)
    lastObjectUrlRef.current = url;
    if (mediaAudioRef.current && active === 'upload') { mediaAudioRef.current.src = url; mediaAudioRef.current.currentTime = 0; }
    try { lastUploadTimeRef.current = 0; } catch {}
  }

  function isSupportedAudio(f: File | null | undefined): f is File {
    if (!f) return false;
    const name = (f.name || '').toLowerCase();
    const type = (f.type || '').toLowerCase();
    const extOk = /\.(mp3|wav)$/i.test(name);
    const typeOk = /audio\/(mpeg|mp3|wav|x-wav|wave)/.test(type);
    return extOk || typeOk;
  }

  function handleBrowseChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (isSupportedAudio(f)) {
      try { setActive('upload'); } catch {}
      playFile(f);
    }
    try { (e.target as HTMLInputElement).value = ""; } catch {}
  }

  function handleDragEnter(e: React.DragEvent<HTMLDivElement>) {
    try { if (e.dataTransfer?.items) { const has = Array.from(e.dataTransfer.items).some(it => it.kind === 'file'); if (!has) return; } } catch {}
    e.preventDefault(); e.stopPropagation();
    dragCounterRef.current += 1;
    setIsDragging(true);
  }
  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    try { if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'; } catch {}
    e.preventDefault(); e.stopPropagation();
  }
  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault(); e.stopPropagation();
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
    if (dragCounterRef.current === 0) setIsDragging(false);
  }
  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault(); e.stopPropagation();
    dragCounterRef.current = 0; setIsDragging(false);
    try {
      const dt = e.dataTransfer;
      const file = dt?.files?.[0];
      if (isSupportedAudio(file)) { try { setActive('upload'); } catch {}; playFile(file); }
    } catch {}
  }

  function parseYouTube(u: string): string | null {
    try {
      const url = new URL(u);
      if (url.hostname.includes('youtu.be')) return url.pathname.split('/').filter(Boolean)[0] || null;
      if (url.hostname.includes('youtube.com') || url.hostname.includes('music.youtube.com')) return url.searchParams.get('v') || null;
    } catch {}
    const m = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{6,})/.exec(u);
    return m && m[1] ? m[1] : null;
  }

  function parseSuno(u: string): string | null {
    // Accept formats like https://suno.com/s/HLqTQ6PMXcRvi5lb or song/songs/listen/embed
    const t = u.trim();
    let m = /suno\.(?:ai|com)\/s\/([A-Za-z0-9_-]+)/i.exec(t);
    if (m && m[1]) return m[1];
    m = /suno\.(?:ai|com)\/(?:song|songs|listen|embed)\/([A-Za-z0-9-]+)/i.exec(t);
    return m && m[1] ? m[1] : null;
  }

  function extractSunoEmbedSrc(html: string): string | null {
    try {
      const m = /<iframe[^>]*src=["']([^"']+)["'][^>]*>/i.exec(html || "");
      if (!m || !m[1]) return null;
      const src = m[1];
      if (/^https:\/\/suno\.(?:ai|com)\/embed\//i.test(src)) return src;
      return null;
    } catch { return null; }
  }

  // Lightweight YouTube oEmbed fetch (no API key) for title/author/thumbnail
  async function fetchYouTubeOEmbed(videoId: string): Promise<{ title?: string; author_name?: string; thumbnail_url?: string } | null> {
    try {
      const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const j = await res.json().catch(() => ({}));
      return j || null;
    } catch {
      return null;
    }
  }

  function enrichYouTubeItem(itemId: string, videoId: string) {
    fetchYouTubeOEmbed(videoId)
      .then((meta) => {
        if (!meta) return;
        setPlaylist((prev) =>
          prev.map((it) => {
            if (it.id !== itemId || it.type !== "youtube") return it;
            const y = it as YtPlaylistItem;
            return {
              ...y,
              title: typeof meta.title === "string" && meta.title.trim() ? meta.title : y.title,
              authorName: typeof meta.author_name === "string" && meta.author_name.trim() ? meta.author_name : y.authorName,
              thumbnailUrl: typeof meta.thumbnail_url === "string" && meta.thumbnail_url.trim() ? meta.thumbnail_url : y.thumbnailUrl,
            };
          }),
        );
      })
      .catch(() => {});
  }

  // On source tab change, keep the audio graph running; UI controls will start/stop playback.
  useEffect(() => { try { audioCtxRef.current?.resume(); } catch {} }, [active]);

  // Robustly keep AudioContext resumed across tab focus/visibility changes
  useEffect(() => {
    const resumeCtx = () => {
      try { audioCtxRef.current?.resume(); } catch {}
    };
    document.addEventListener('visibilitychange', resumeCtx);
    window.addEventListener('focus', resumeCtx);
    return () => {
      document.removeEventListener('visibilitychange', resumeCtx);
      window.removeEventListener('focus', resumeCtx);
    };
  }, []);

  // Also listen for AudioContext state changes and resume on user gestures
  useEffect(() => {
    const handleResume = () => { try { audioCtxRef.current?.resume(); } catch {} };
    const ctx = audioCtxRef.current;
    try { if (ctx) (ctx as any).onstatechange = handleResume; } catch {}
    document.addEventListener('pointerdown', handleResume);
    document.addEventListener('keydown', handleResume);
    return () => {
      try { if (ctx) (ctx as any).onstatechange = null; } catch {}
      document.removeEventListener('pointerdown', handleResume);
      document.removeEventListener('keydown', handleResume);
    };
  }, []);

  // When using the YouTube iframe with sound, disable the proxy audio element to avoid double audio.
  useEffect(() => {
    if (active !== 'youtube' || !mediaAudioRef.current) return;
    const id = parseYouTube(ytUrl.trim() || '');
    if (!id) return;
    try {
      const a = mediaAudioRef.current;
      // Stop and disconnect any prior proxy audio to ensure iframe audio is the only source.
      try { a.pause(); } catch {}
      try { a.src = ''; } catch {}
      try { a.muted = true; } catch {}
    } catch {}
  }, [ytUrl, active]);

  useEffect(() => {
    if (active !== 'suno' || !mediaAudioRef.current) return;
    const srcFromEmbed = extractSunoEmbedSrc(sunoEmbed || '');
    const id = srcFromEmbed ? (srcFromEmbed.split('/embed/')[1] || '') : (parseSuno(sunoUrl.trim() || '') || '');
    if (!id) return;
    const a = mediaAudioRef.current;
    const onCanPlay = () => {
      try { audioCtxRef.current?.resume(); } catch {}
      if (shouldAutoPlayRef.current) {
        a.play().catch(()=>{});
      }
      // ensure single-shot autoplay
      shouldAutoPlayRef.current = false;
    };
    shouldAutoPlayRef.current = true;
    a.src = `/api/audio/suno/${id}`;
    a.crossOrigin = 'anonymous'; a.autoplay = false; a.muted = false; a.volume = 1;
    a.addEventListener('canplay', onCanPlay, { once: true } as any);
    a.load();
    return () => {
      try { a.removeEventListener('canplay', onCanPlay as any); } catch {}
      try { (a as any).oncanplay = null; } catch {}
      // do not autoplay on any subsequent ready events
      shouldAutoPlayRef.current = false;
    };
  }, [sunoUrl, sunoEmbed, active]);

  // Keep audio element running across sources; visualizer updates continuously
  useEffect(() => { try { audioCtxRef.current?.resume(); } catch {} }, [active]);

  // When switching back to upload, restore the last uploaded file source and time so Play works
  useEffect(() => {
    const a = mediaAudioRef.current;
    if (!a) return;
    if (active !== "upload") {
      try {
        if (lastObjectUrlRef.current && a.src === lastObjectUrlRef.current) {
          lastUploadTimeRef.current = a.currentTime || 0;
        }
      } catch {}
      return;
    }
    // Prevent unintended autoplay after restores or scrubs in Upload mode
    shouldAutoPlayRef.current = false;
    const url = lastObjectUrlRef.current;
    if (!url) return;
    try {
      if (a.src !== url) {
        const desiredTime = lastUploadTimeRef.current || 0;
        const setTimeOnce = () => {
          try {
            const t = Math.max(0, Math.min(desiredTime, isFinite(a.duration) ? a.duration : desiredTime));
            a.currentTime = t;
          } catch {}
        };
        a.addEventListener("loadedmetadata", setTimeOnce, { once: true } as any);
        a.src = url;
        a.load();
      } else {
        // If source is already correct, still restore time if we have one
        if ((lastUploadTimeRef.current || 0) > 0) {
          try {
            a.currentTime = lastUploadTimeRef.current || 0;
          } catch {}
        }
      }
    } catch {}
  }, [active]);

  function togglePlay() {
    const a = mediaAudioRef.current;
    if (!a) return;

    // If returning to upload and the audio element is not pointed at the last uploaded source, relink and then play
    if (active === 'upload' && lastObjectUrlRef.current) {
      const url = lastObjectUrlRef.current;
      if (a.src !== url) {
        try { audioCtxRef.current?.resume(); } catch {}
        const desiredTime = lastUploadTimeRef.current || 0;
        const onReady = () => {
          try {
            // Clamp desired time to duration once metadata is known
            const t = Math.max(0, Math.min(desiredTime, isFinite(a.duration) ? a.duration : desiredTime));
            a.currentTime = t;
          } catch {}
          if (shouldAutoPlayRef.current) {
            a.play().catch(()=>{});
          }
          try { shouldAutoPlayRef.current = false; } catch {}
        };
        try { shouldAutoPlayRef.current = true; } catch {}
        a.addEventListener('canplay', onReady, { once: true } as any);
        a.addEventListener('loadedmetadata', onReady, { once: true } as any);
        a.src = url;
        a.load();
        return;
      }
    }

    // Normal toggle behavior
    if (a.paused) {
      try { audioCtxRef.current?.resume(); } catch {}
      try { shouldAutoPlayRef.current = true; } catch {}
      a.play().catch(() => {
        // If play fails due to a race, try reloading current src then play on canplay
        const onReady = () => {
          if (shouldAutoPlayRef.current) {
            a.play().catch(()=>{});
          }
          try { shouldAutoPlayRef.current = false; } catch {}
        };
        a.addEventListener('canplay', onReady, { once: true } as any);
        try { a.load(); } catch {}
      });
    } else {
      a.pause();
      try { shouldAutoPlayRef.current = false; } catch {}
    }
  }

  function onScrub(v: number) {
    const a = mediaAudioRef.current; if (!a) return;
    // Scrubbing should not trigger autoplay
    try { shouldAutoPlayRef.current = false; } catch {}
    a.currentTime = v; setPosition(v);
  }

  function format(t: number) {
    if (!isFinite(t)) return '0:00';
    const m = Math.floor(t/60); const s = Math.floor(t%60); return `${m}:${s.toString().padStart(2,'0')}`;
  }

  function ampToDb(a: number) { const v = Math.max(1e-5, a || 0); return 20 * Math.log10(v); }

  // Optional: start/stop capturing the tab audio so EQ affects YouTube/Suno embeds as well
  async function startTabCapture() {
    try {
      const ctx = audioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;
      let stream: MediaStream | null = null;
      try {
        stream = await (navigator.mediaDevices as any).getDisplayMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }, video: true });
      } catch {
        stream = await navigator.mediaDevices.getDisplayMedia({ audio: true } as any);
      }
      if (!stream) return;
      streamRef.current = stream;
      try { streamSourceNodeRef.current?.disconnect(); } catch {}
      const src = new MediaStreamAudioSourceNode(ctx, { mediaStream: stream });
      streamSourceNodeRef.current = src;
      if (streamGainRef.current) src.connect(streamGainRef.current);
      if (elementGainRef.current) elementGainRef.current.gain.value = 0;
      if (streamGainRef.current) streamGainRef.current.gain.value = 1;
      setIsTabCapturing(true);
      try { audioCtxRef.current?.resume(); } catch {}
    } catch (e) { console.warn('Tab capture failed', e); }
  }

  function stopTabCapture() {
    try { streamRef.current?.getTracks().forEach(t=>t.stop()); } catch {}
    try { streamSourceNodeRef.current?.disconnect(); } catch {}
    streamSourceNodeRef.current = null; streamRef.current = null; setIsTabCapturing(false);
    if (elementGainRef.current) elementGainRef.current.gain.value = 1;
    if (streamGainRef.current) streamGainRef.current.gain.value = 0;
  }

  // Canvas interactions for Pro‑Q style nodes
  useEffect(() => {
    const cvs = eqCanvasRef.current; if (!cvs) return;
    const g = cvs.getContext('2d'); if (!g) return;
    const meterW = 28, padR = meterW + 8;
    const width = () => (cvs.clientWidth || (cvs as any).offsetWidth || 500) - padR;
    const height = () => 260;
    const minFreq = 20, maxFreq = 20000; const minDb = -18, maxDb = 18;
    const freqToX = (f:number)=>{ const t=(Math.log10(f)-Math.log10(minFreq))/(Math.log10(maxFreq)-Math.log10(minFreq)); return t*width(); };
    const xToFreq = (x:number)=>{ const t = Math.max(0, Math.min(1, x/width())); const v = Math.pow(10, Math.log10(minFreq) + t*(Math.log10(maxFreq)-Math.log10(minFreq))); return v; };
    const dbToY = (db:number)=>{ const t=(db-minDb)/(maxDb-minDb); return (1-t)*height(); };
    const yToDb = (y:number)=>{ const t=1-Math.max(0,Math.min(1,y/height())); return minDb + t*(maxDb-minDb); };

    function hitTestBand(px:number, py:number): number | null {
      // Prefer hit-testing the drawn path for easier grabbing
      try {
        const paths = bandPathsRef.current || [];
        for (let i=paths.length-1; i>=0; i--) {
          const p = paths[i]; if (!p) continue;
          if ((g as any).isPointInStroke?.(p, px, py)) return i;
        }
      } catch {}
      // Fallback to handle proximity
      let hit: number | null = null; let best = 9999;
      for (let i=0;i<eqFreqs.length;i++) {
        const x=freqToX(eqFreqs[i]); const y=dbToY(eqGains[i]); const d=Math.hypot(px-x, py-y);
        if (d < 12 && d < best) { best=d; hit=i; }
      }
      return hit;
    }

    const onPointerDown = (e: PointerEvent) => {
      const rect = cvs.getBoundingClientRect(); const x = e.clientX - rect.left; const y = e.clientY - rect.top;
      const idx = hitTestBand(x,y);
      if (idx !== null) {
        draggingRef.current = { index: idx };
        selectedBandRef.current = idx; setSelectedBand(idx);
        cvs.setPointerCapture(e.pointerId);
      }
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      const rect = cvs.getBoundingClientRect(); const x = e.clientX - rect.left; const y = e.clientY - rect.top;
      const idx = draggingRef.current.index;
      const f = Math.max(20, Math.min(20000, xToFreq(x)));
      const gDb = Math.max(-18, Math.min(18, yToDb(y)));
      setEqFreqs(prev => prev.map((v,i)=> i===idx ? f : v));
      setEqGains(prev => prev.map((v,i)=> i===idx ? gDb : v));
    };
    const onPointerUp = (e: PointerEvent) => {
      draggingRef.current = null; try { cvs.releasePointerCapture(e.pointerId); } catch {}
    };
    const onWheel = (e: WheelEvent) => {
      if (selectedBandRef.current == null) return; e.preventDefault();
      const idx = selectedBandRef.current; const delta = (e.deltaY > 0 ? -0.1 : 0.1) * (e.shiftKey ? 0.25 : 1);
      setEqQs(prev => prev.map((v,i)=> i===idx ? Math.max(0.3, Math.min(8, v + delta)) : v));
    };
    const onDblClick = (e: MouseEvent) => {
      const rect = cvs.getBoundingClientRect(); const x = e.clientX - rect.left; const y = e.clientY - rect.top;
      const idx = hitTestBand(x,y);
      if (idx != null) {
        setEqTypes(prev => prev.map((t,i)=>{
          if (i!==idx) return t; const order: BiquadFilterType[] = ['peaking','lowshelf','highshelf','notch','bandpass','highpass','lowpass'];
          const k = Math.max(0, order.indexOf(t)); const next = order[(k+1)%order.length]; return next;
        }));
        selectedBandRef.current = idx; setSelectedBand(idx);
      }
    };
    cvs.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove, { passive: true } as any);
    window.addEventListener('pointerup', onPointerUp as any, { passive: true } as any);
    cvs.addEventListener('dblclick', onDblClick);
    cvs.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      cvs.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove as any);
      window.removeEventListener('pointerup', onPointerUp as any);
      cvs.removeEventListener('dblclick', onDblClick);
      cvs.removeEventListener('wheel', onWheel as any);
    };
  }, [eqFreqs, eqGains, active]);

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className={`text-sm font-medium inline-flex items-center gap-2 pixel-toggle ${active==='upload'?'active':''}`} onClick={()=>setActive('upload')}>
            <span className={`pixel-led ${active==='upload'?'green':''}`} /> Upload
          </label>
          <div
            ref={dropZoneRef}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`mt-1 border rounded-md bg-background/70 hover:bg-background transition-colors h-10 px-2 relative flex items-center ${isDragging? 'ring-2 ring-[var(--primary)] ring-offset-0 bg-background' : ''}`}
          >
            <div className="flex items-center gap-3 w-full">
              <button className="w-9 h-9 rounded-md border grid place-items-center" onClick={()=>fileInputRef.current?.click()} aria-label="Select File">
                <UploadIcon />
              </button>
              <div className="text-xs text-muted-foreground truncate">Drop MP3 or WAV here, or tap the icon <Ellipsis className="inline h-3 w-3 align-[-2px]" /></div>
            </div>
            <input ref={fileInputRef} type="file" accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/wave" className="hidden" onChange={handleBrowseChange} />
            {fileName ? <div className="microtext text-muted-foreground mt-2">{fileName}</div> : null}
            {isDragging && (
              <div className="absolute inset-0 grid place-items-center pointer-events-none">
                <div className="px-3 py-1.5 rounded-md bg-[color:color-mix(in_srgb,_white_10%,_black)] border text-xs">Release to upload</div>
              </div>
            )}
          </div>
        </div>
        <div>
          <label className={`text-sm font-medium inline-flex items-center gap-2 pixel-toggle ${active==='youtube'?'active':''}`} onClick={()=>setActive('youtube')}>
            <span className={`pixel-led ${active==='youtube'?'green':''}`} /> YouTube
          </label>
          <div className="flex items-center gap-2">
            <input className="flex-1 h-10 px-3 py-1 border rounded-md bg-background" placeholder="https://youtube.com/watch?v=..." value={ytUrl} onChange={e=>setYtUrl(e.target.value)} />
          </div>
            <div className="microtext text-muted-foreground mt-1 flex items-center gap-3">
              <span>Loads audio stream; for best compatibility on X, system output should be routed via your virtual device.</span>
              <label className="inline-flex items-center gap-2"><input type="checkbox" className="accent-[var(--primary)]" checked={ytStableVolume} onChange={(e)=>setYtStableVolume(e.target.checked)} /> Stable volume</label>
            </div>
        </div>
        <div>
          <label className={`text-sm font-medium inline-flex items-center gap-2 pixel-toggle ${active==='suno'?'active':''}`} onClick={()=>setActive('suno')}>
            <span className={`pixel-led ${active==='suno'?'green':''}`} /> Suno
          </label>
          <div className="flex flex-col gap-2">
            <textarea className="w-full min-h-[40px] h-10 px-3 py-2 border rounded-md bg-background" placeholder="Paste full Suno embed iframe here" value={sunoEmbed} onChange={e=>setSunoEmbed(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="mt-2">
        <div className="crt-frame">
          <div className="crt-screen p-4">
          {/* Conditional area */}
          {active === 'upload' ? (
            <>
              <div className="flex items-center gap-4">
                <button onClick={togglePlay} className={`w-14 h-14 rounded-full grid place-items-center text-white shadow-md ${isPlaying ? 'bg-red-500' : 'bg-[var(--primary)]'} focus:outline-none`} aria-label={isPlaying ? 'Pause' : 'Play'}>
                  {isPlaying ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
                  ) : (
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  )}
                </button>
                <div className="flex-1">
                  <input
                    type="range" min={0} max={Math.max(1, duration)} step={0.1}
                    value={Math.min(position, duration||0)}
                    onChange={(e)=>onScrub(parseFloat(e.target.value))}
                    onMouseDown={()=>setIsScrubbing(true)} onMouseUp={()=>setIsScrubbing(false)}
                    onTouchStart={()=>setIsScrubbing(true)} onTouchEnd={()=>setIsScrubbing(false)}
                    className="w-full glass-range"
                  />
                  <div className="flex items-center justify-between microtext text-muted-foreground mt-1">
                    <span>{format(position)}</span>
                    <span>{format(duration)}</span>
                  </div>
                </div>
              </div>
              <div className="mt-1">
                <canvas ref={canvasRef} className="w-full h-[90px]" />
              </div>
          <div className="mt-1 text-xs text-muted-foreground">Tip: To play into X, set your browser/system output device to your virtual cable (e.g., VB-CABLE). The console already uses mono/FM‑quality compatible with X.</div>
            </>
          ) : active === 'youtube' ? (
            <div className="aspect-video w-full rounded-md overflow-hidden border">
              {(() => {
                const id = parseYouTube(ytUrl.trim() || '');
                if (!id) return <div className="p-4 microtext text-muted-foreground">Paste a valid YouTube URL above.</div>;
                const src = `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&mute=0&autoplay=1&playsinline=1&enablejsapi=1`;
                return (
                  <iframe
                    ref={ytIframeRef}
                    src={src}
                    className="w-full h-full"
                    allow="autoplay; accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    onLoad={() => {
                      try {
                        const win = ytIframeRef.current?.contentWindow;
                        const post = (func: string, args: any[] = []) =>
                          win?.postMessage(JSON.stringify({ event: "command", func, args }), "*");
                        post("unMute");
                        post("setVolume", [100]);
                        post("playVideo");
                      } catch {}
                    }}
                  />
                );
              })()}
            </div>
          ) : (
          <div className="w-full rounded-md overflow-hidden border" style={{ height: 240 }}>
              {(() => {
                const srcFromEmbed = extractSunoEmbedSrc(sunoEmbed);
                const src0 = srcFromEmbed || ((): string | null => {
                  const id = parseSuno(sunoUrl.trim() || '');
                  return id ? `https://suno.com/embed/${id}` : null;
                })();
                if (!src0) return <div className="p-4 microtext text-muted-foreground">Paste the full Suno embed iframe (or a Suno link).</div>;
                let src = src0; try { const u = new URL(src0); u.searchParams.set('autoplay','0'); u.searchParams.set('muted','1'); src = u.toString(); } catch {}
                const songHref = src0.replace('/embed/', '/song/');
                return <iframe src={src} className="w-full h-full" width="760" height="240" sandbox="allow-scripts allow-same-origin"><a href={songHref}>Listen on Suno</a></iframe>;
              })()}
            </div>
          )}
          {/* Playlist (cross-source) */}
          <div className="mt-4 glass-pane rounded-md border p-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-base inline-flex items-center gap-2">
                <span className="inline-grid place-items-center w-6 h-6 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)]">
                  <Music className="h-4 w-4" />
                </span>
                Playlist
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="h-9 px-3 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] border border-transparent shadow-sm hover:brightness-110"
                  onClick={()=>setBuilderOpen(true)}
                >
                  Build Playlist
                </button>
                <label className="inline-flex items-center gap-2 microtext text-muted-foreground">
                  <input type="checkbox" className="accent-[var(--primary)]" checked={autoSequence} onChange={(e)=>setAutoSequence(e.target.checked)} />
                  Auto sequence
                </label>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                className="h-9 px-3 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] border border-transparent hover:brightness-110"
                onClick={addCurrentToPlaylist}
              >
                Add current source
              </button>
              <div className="flex items-center gap-1">
                <button
                  className="h-9 w-9 rounded-full border bg-background hover:bg-foreground/5 grid place-items-center"
                  onClick={() => { if (playlist.length > 0) playPlaylistItemAt(0); }}
                  title="First track"
                  aria-label="First track"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>
                <button
                  className="h-9 w-9 rounded-full border bg-background hover:bg-foreground/5 grid place-items-center"
                  onClick={() => { if (currentIndex > 0) playPlaylistItemAt(currentIndex - 1); }}
                  title="Previous track"
                  aria-label="Previous track"
                >
                  <SkipBack className="h-4 w-4" />
                </button>
                <button
                  className="h-9 w-9 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] border border-transparent hover:brightness-110 grid place-items-center"
                  onClick={() => { if (currentIndex >= 0) playlistTogglePlayAt(currentIndex); else if (playlist.length > 0) playlistTogglePlayAt(0); }}
                  title={isPlaying ? "Pause" : "Play"}
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </button>
                <button
                  className="h-9 w-9 rounded-full border bg-background hover:bg-foreground/5 grid place-items-center"
                  onClick={() => { if (currentIndex >= 0 && currentIndex + 1 < playlist.length) playPlaylistItemAt(currentIndex + 1); }}
                  title="Next track"
                  aria-label="Next track"
                >
                  <SkipForward className="h-4 w-4" />
                </button>
                <button
                  className="h-9 w-9 rounded-full border bg-background hover:bg-foreground/5 grid place-items-center"
                  onClick={() => { if (playlist.length > 0) playPlaylistItemAt(playlist.length - 1); }}
                  title="Last track"
                  aria-label="Last track"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <input
                  className="h-9 px-3 border rounded-full bg-background w-44"
                  placeholder="Playlist name"
                  value={playlistNameDraft}
                  onChange={(e)=>setPlaylistNameDraft(e.target.value)}
                />
                <button
                  className="h-9 px-3 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] border border-transparent hover:brightness-110"
                  onClick={()=>saveCurrentPlaylist(playlistNameDraft)}
                >
                  Save
                </button>
                <div className="relative" ref={savedDropdownRef}>
                  <button
                    className="h-9 pl-3 pr-8 rounded-full border bg-background relative"
                    onClick={()=>setSavedDropdownOpen(v=>!v)}
                    aria-haspopup="menu"
                    aria-expanded={savedDropdownOpen}
                    title="Load a saved playlist"
                  >
                    {savedPlaylists.length ? 'Load saved...' : 'No saved playlists'}
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-70 h-3 w-3" />
                  </button>
                  {savedDropdownOpen && (
                    <div className="absolute right-0 mt-1 w-64 max-h-64 overflow-auto rounded-md border bg-background shadow-lg z-50">
                      {savedPlaylists.length === 0 ? (
                        <div className="p-2 microtext text-muted-foreground">No saved playlists</div>
                      ) : (
                        <ul className="py-1">
                          {savedPlaylists.map((p)=> (
                            <li key={p.id} className="flex items-center gap-2 px-2 py-1 hover:bg-foreground/5">
                              <button
                                className="flex-1 text-left truncate microtext"
                                onClick={()=>{ loadSavedPlaylist(p.id); setSavedDropdownOpen(false); }}
                                title={`Load ${p.name}`}
                              >
                                {p.name}
                              </button>
                              <button
                                className="h-7 w-7 grid place-items-center rounded-md border bg-background hover:bg-foreground/5"
                                title="Delete playlist"
                                onClick={(e)=>{ e.stopPropagation(); setDeleteTarget({ id: p.id, name: p.name }); setDeleteModalOpen(true); }}
                                aria-label={`Delete ${p.name}`}
                              >
                                <Trash className="h-3.5 w-3.5" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
                <button
                  className="h-9 px-3 rounded-full border bg-background hover:bg-foreground/5"
                  onClick={clearPlaylist}
                  title="Clear current playlist"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="mt-3">
              {playlist.length === 0 ? (
                <div className="microtext text-muted-foreground">No items yet. Use "Add current source" to build a cross-source playlist of Upload, YouTube, and Suno.</div>
              ) : (
                <ul className="space-y-2">
                  {playlist.map((item, idx) => (
                    <li key={item.id} className={`rounded-md border p-2 flex items-center gap-3 ${idx === currentIndex ? "bg-foreground/10 border-foreground/20" : "bg-background/50"}`}>
                      <span className="microtext w-6 text-center">{idx + 1}</span>
                      <span className="microtext inline-flex items-center gap-2">
                        <span className="inline-grid place-items-center w-5 h-5 rounded-full border">
                          {item.type === "upload" ? "U" : item.type === "youtube" ? "Y" : "S"}
                        </span>
                        {item.type === "youtube" && (item as any).thumbnailUrl ? (
                          <img src={(item as any).thumbnailUrl} alt="" className="w-8 h-5 object-cover rounded-sm border" />
                        ) : null}
                        <span className="font-medium">{item.title}</span>
                        {item.type === "youtube" && (item as any).authorName ? (
                          <span className="microtext text-muted-foreground">by {(item as any).authorName}</span>
                        ) : null}
                        {item.type === "upload" && !(item as UploadPlaylistItem).linked ? (
                          <span className="text-red-500">(missing)</span>
                        ) : null}
                      </span>
                      <div className="ml-auto flex items-center gap-2">
                        <button className="h-8 px-3 rounded-full border bg-background hover:bg-foreground/5 microtext" onClick={()=>playlistTogglePlayAt(idx)}>{(currentIndex===idx && isPlaying) ? 'Pause' : 'Play'}</button>
                        <button className="h-8 px-3 rounded-full border bg-background hover:bg-foreground/5 microtext disabled:opacity-60" onClick={()=>moveItem(idx, -1)} disabled={idx===0}>Up</button>
                        <button className="h-8 px-3 rounded-full border bg-background hover:bg-foreground/5 microtext disabled:opacity-60" onClick={()=>moveItem(idx, 1)} disabled={idx===playlist.length-1}>Down</button>
                        <button className="h-8 px-3 rounded-full border bg-background hover:bg-foreground/5 microtext" onClick={()=>removeItem(idx)}>Remove</button>
                        {item.type === "upload" && !(item as UploadPlaylistItem).linked ? (
                          <label className="h-8 px-3 rounded-full border bg-background hover:bg-foreground/5 microtext cursor-pointer inline-flex items-center">
                            <input type="file" accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/wave" className="hidden" onChange={(e)=>relinkUpload(idx, e.target.files?.[0] || null)} />
                            Relink
                          </label>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Playlist Builder Modal */}
          {builderOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/50" onClick={()=>setBuilderOpen(false)} />
              <div className="glass-float relative z-60 w-full max-w-2xl rounded-2xl border p-6 space-y-4 bg-background">
                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold">Build Playlist</div>
                  <button className="h-9 px-3 rounded-full border bg-background hover:bg-foreground/5 microtext" onClick={()=>setBuilderOpen(false)}>Close</button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className={`h-9 px-3 rounded-full border ${builderType==='upload' ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-transparent' : 'bg-background hover:bg-foreground/5'}`}
                    onClick={()=>setBuilderType('upload')}
                  >
                    Upload
                  </button>
                  <button
                    className={`h-9 px-3 rounded-full border ${builderType==='youtube' ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-transparent' : 'bg-background hover:bg-foreground/5'}`}
                    onClick={()=>setBuilderType('youtube')}
                  >
                    YouTube
                  </button>
                  <button
                    className={`h-9 px-3 rounded-full border ${builderType==='suno' ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-transparent' : 'bg-background hover:bg-foreground/5'}`}
                    onClick={()=>setBuilderType('suno')}
                  >
                    Suno
                  </button>
                </div>

                {builderType === 'upload' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Add an audio file</label>
                    <div className="flex items-center gap-2">
                      <input ref={builderFileInputRef} type="file" accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/wave" className="h-9 px-3 rounded-full border bg-background" />
                      <button className="h-9 px-3 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] border border-transparent" onClick={builderAddUpload}>Add</button>
                    </div>
                    <p className="microtext text-muted-foreground">Supported: MP3, WAV</p>
                  </div>
                )}
                {builderType === 'youtube' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Add a YouTube link</label>
                    <div className="flex items-center gap-2">
                      <input className="h-9 px-3 rounded-full border bg-background flex-1" placeholder="https://youtube.com/watch?v=..." value={builderYtUrl} onChange={(e)=>setBuilderYtUrl(e.target.value)} />
                      <button className="h-9 px-3 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] border border-transparent" onClick={builderAddYouTube}>Add</button>
                    </div>
                  </div>
                )}
                {builderType === 'suno' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Add a Suno embed or link</label>
                    <div className="flex items-center gap-2">
                      <input className="h-9 px-3 rounded-full border bg-background flex-1" placeholder="Paste Suno iframe or link" value={builderSunoInput} onChange={(e)=>setBuilderSunoInput(e.target.value)} />
                      <button className="h-9 px-3 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] border border-transparent" onClick={builderAddSuno}>Add</button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="text-sm font-medium">Current playlist</div>
                  {playlist.length === 0 ? (
                    <div className="microtext text-muted-foreground">No items yet. Add uploads, YouTube links, or Suno embeds.</div>
                  ) : (
                    <ul className="space-y-2 max-h-[40vh] overflow-auto pr-1">
                      {playlist.map((item, idx) => (
                        <li key={item.id} className="rounded-md border p-2 flex items-center gap-3 bg-background/50">
                          <span className="microtext w-6 text-center">{idx + 1}</span>
                          <span className="microtext inline-flex items-center gap-2">
                            <span className="inline-grid place-items-center w-5 h-5 rounded-full border">
                              {item.type === "upload" ? "U" : item.type === "youtube" ? "Y" : "S"}
                            </span>
                            <span className="font-medium">{item.title}</span>
                            {item.type === "upload" && !(item as UploadPlaylistItem).linked ? (
                              <span className="text-red-500">(missing)</span>
                            ) : null}
                          </span>
                          <div className="ml-auto flex items-center gap-2">
                            <button className="h-8 px-3 rounded-full border bg-background hover:bg-foreground/5 microtext disabled:opacity-60" onClick={()=>moveItem(idx,-1)} disabled={idx===0}>Up</button>
                            <button className="h-8 px-3 rounded-full border bg-background hover:bg-foreground/5 microtext disabled:opacity-60" onClick={()=>moveItem(idx,1)} disabled={idx===playlist.length-1}>Down</button>
                            <button className="h-8 px-3 rounded-full border bg-background hover:bg-foreground/5 microtext" onClick={()=>removeItem(idx)}>Remove</button>
                            {item.type === "upload" && !(item as UploadPlaylistItem).linked ? (
                              <label className="h-8 px-3 rounded-full border bg-background hover:bg-foreground/5 microtext cursor-pointer inline-flex items-center">
                                <input type="file" accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/wave" className="hidden" onChange={(e)=>relinkUpload(idx, e.target.files?.[0] || null)} />
                                Relink
                              </label>
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="flex items-center justify-end gap-2">
                  <input className="h-9 px-3 rounded-full border bg-background w-44" placeholder="Playlist name" value={playlistNameDraft} onChange={(e)=>setPlaylistNameDraft(e.target.value)} />
                  <button className="h-9 px-3 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] border border-transparent" onClick={()=>{ saveCurrentPlaylist(playlistNameDraft); setBuilderOpen(false); }}>Save & Close</button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Saved Playlist Modal */}
          {deleteModalOpen && deleteTarget && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div
                className="absolute inset-0 bg-black/50"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setDeleteTarget(null);
                }}
              />
              <div className="glass-float relative z-60 w-full max-w-md rounded-2xl border p-6 space-y-4 bg-background">
                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold">Delete Playlist</div>
                  <button
                    className="h-9 px-3 rounded-full border bg-background hover:bg-foreground/5 microtext"
                    onClick={() => {
                      setDeleteModalOpen(false);
                      setDeleteTarget(null);
                    }}
                  >
                    Close
                  </button>
                </div>
                <div className="space-y-2">
                  <p className="microtext text-muted-foreground">You are about to delete the playlist:</p>
                  <div className="px-3 py-2 rounded-md border bg-background font-medium">{deleteTarget.name}</div>
                  <p className="microtext text-muted-foreground">This will remove it from your saved playlists on this browser.</p>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    className="h-9 px-3 rounded-full border bg-background hover:bg-foreground/5 microtext"
                    onClick={() => {
                      setDeleteModalOpen(false);
                      setDeleteTarget(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="h-9 px-3 rounded-full bg-red-500 text-white border border-transparent hover:brightness-110"
                    onClick={() => {
                      if (deleteTarget) {
                        deleteSavedPlaylist(deleteTarget.id);
                      }
                      setDeleteModalOpen(false);
                      setDeleteTarget(null);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Equalizer */}
          <div className="mt-4 glass-pane rounded-md border p-3">
            <div className="flex items-center justify-between">
              <div className="font-medium">Equalizer</div>
              <div className={`flex items-center gap-4 ${active !== 'upload' ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex items-center gap-2">
                  <label className="microtext text-muted-foreground">Preset</label>
                  <select className="h-8 px-2 border rounded-md bg-background" value={eqPreset} onChange={(e)=>applyPreset(e.target.value)}>
                    <option value="flat">Flat</option>
                    <option value="bass_boost">Bass Boost</option>
                    <option value="vocal_clarity">Vocal Clarity</option>
                    <option value="treble_boost">Treble Boost</option>
                    <option value="v_shape">V Shape</option>
                    <option value="loudness">Loudness</option>
                    <option value="lofi_radio">Lo‑Fi Radio</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="microtext text-muted-foreground">Pre‑Gain</label>
                  <input type="range" min={-18} max={18} step={0.5} value={preGainDb} onChange={(e)=>setPreGainDb(parseFloat(e.target.value))} className="w-36 glass-range" />
                  <span className="microtext w-12 text-right">{preGainDb.toFixed(1)} dB</span>
                </div>
              </div>
            </div>
            <div className="mt-3">
              <canvas ref={eqCanvasRef} className="w-full h-[260px] rounded-md bg-black/60" />
            </div>
            <div className={`mt-3 flex items-center justify-between ${active !== 'upload' ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex items-center gap-3 microtext"></div>
              {selectedBand != null ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2"><span className="microtext text-muted-foreground">Type</span>
                    <select className="h-8 px-2 border rounded-md bg-background" value={eqTypes[selectedBand]}
                      onChange={(e)=> setEqTypes(prev => prev.map((t,i)=> i===selectedBand ? (e.target.value as BiquadFilterType) : t))}>
                      <option value="peaking">Peak</option>
                      <option value="lowshelf">Low Shelf</option>
                      <option value="highshelf">High Shelf</option>
                      <option value="notch">Notch</option>
                      <option value="bandpass">Bandpass</option>
                      <option value="highpass">High‑pass</option>
                      <option value="lowpass">Low‑pass</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2"><span className="microtext text-muted-foreground">Freq</span>
                    <input className="w-40" type="range" min={20} max={20000} step={1} value={eqFreqs[selectedBand]}
                      onChange={(e)=> setEqFreqs(prev => prev.map((v,i)=> i===selectedBand ? parseFloat(e.target.value) : v))} />
                    <span className="microtext w-16 text-right">{eqFreqs[selectedBand] >= 1000 ? `${(eqFreqs[selectedBand]/1000).toFixed(2)} kHz` : `${Math.round(eqFreqs[selectedBand])} Hz`}</span>
                  </div>
                  <div className="flex items-center gap-2"><span className="microtext text-muted-foreground">Gain</span>
                    <input className="w-40" type="range" min={-18} max={18} step={0.1} value={eqGains[selectedBand]}
                      onChange={(e)=> setEqGains(prev => prev.map((v,i)=> i===selectedBand ? parseFloat(e.target.value) : v))} />
                    <span className="microtext w-12 text-right">{eqGains[selectedBand].toFixed(1)} dB</span>
                  </div>
                  <div className="flex items-center gap-2"><span className="microtext text-muted-foreground">Q</span>
                    <input className="w-36" type="range" min={0.3} max={8} step={0.05} value={eqQs[selectedBand]}
                      onChange={(e)=> setEqQs(prev => prev.map((v,i)=> i===selectedBand ? parseFloat(e.target.value) : v))} />
                    <span className="microtext w-12 text-right">{eqQs[selectedBand].toFixed(2)}</span>
                  </div>
                </div>
              ) : <div className="microtext text-muted-foreground">Double‑click a node to cycle type. Scroll to change Q. Drag to adjust Freq/Gain.</div>}
            </div>
            <div className="mt-2 flex items-center gap-3">
                <label className="microtext text-muted-foreground inline-flex items-center gap-2"><input type="checkbox" className="accent-[var(--primary)]" checked={autoTrim} onChange={(e)=>setAutoTrim(e.target.checked)} /> Auto‑trim output</label>
                <span className="microtext">Limiter hits: <b>{limiterHits}</b></span>
                <button className="px-2 py-1 rounded-md border microtext" onClick={()=>{ try{ setLimiterHits(0); }catch{} }}>Reset</button>
              <div className="microtext text-muted-foreground ml-auto">True‑peak: {ampToDb(truePeak).toFixed(1)} dBTP</div>
              {isTabCapturing ? (
                <button className="px-2 py-1 rounded-md border microtext" onClick={stopTabCapture}>Stop tab capture</button>
              ) : (
                <button className="px-2 py-1 rounded-md border microtext" onClick={startTabCapture}>Capture this tab's audio</button>
              )}
            </div>
            {active !== 'upload' ? (
              <div className="mt-2 microtext text-muted-foreground">Equalizer controls are available for uploaded audio. External sources like YouTube and Suno are preview-only.</div>
            ) : null}
          </div>
          </div>
        </div>
      {/* Info Modal */}
      <Modal
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        title={modalTitle}
        description={modalDesc}
        microtexts={modalMicrotexts}
        actions={[
          { label: "Close", onClick: () => setInfoOpen(false), variant: "primary" },
        ]}
      />
      </div>
    </div>
  );
}

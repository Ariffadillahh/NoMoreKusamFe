import { useState, useEffect, useCallback, useRef } from "react";
import ReactCompareImage from "react-compare-image";
import { FaDownload } from "react-icons/fa6";

// debounce biar backend ga kewalahan tiap slider digeser 1px
function useDebounce(value, delay = 600) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// slider reusable, males bikin 3x
function SliderControl({ label, description, value, min, max, step, onChange, isProcessing }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[0.8rem] font-medium text-stone-700">{label}</span>
          {/* muncul pas lagi nunggu response backend */}
          {isProcessing && (
            <span className="text-[0.62rem] font-mono text-amber-500 animate-pulse">updating…</span>
          )}
        </div>
        <span className="font-mono text-[0.72rem] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full min-w-[38px] text-center">
          {value}
        </span>
      </div>
      {description && (
        <p className="text-[0.67rem] text-stone-400 mb-2 leading-relaxed">{description}</p>
      )}
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 rounded-full outline-none cursor-pointer appearance-none bg-stone-200
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-600
          [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:shadow-[0_0_0_3px_#d1fae5]
          [&::-webkit-slider-thumb]:transition-shadow
          hover:[&::-webkit-slider-thumb]:shadow-[0_0_0_5px_#d1fae5]"
      />
    </div>
  );
}

export default function App() {
  const [selectedFile, setSelectedFile]         = useState(null);
  const [originalPreview, setOriginalPreview]   = useState(null);
  const [processedImage, setProcessedImage]     = useState(null);
  const [loading, setLoading]                   = useState(false);
  const [isAutoProcessing, setIsAutoProcessing] = useState(false);

  // default value agak "safe" biar hasilnya ga langsung ancur
  const [gamma, setGamma]                   = useState(1.2);
  const [clipLimit, setClipLimit]           = useState(1.5);
  const [denoiseStrength, setDenoiseStrength] = useState(0);

  // tiap slider punya debounce sendiri, biar ga bentrok
  const debouncedGamma   = useDebounce(gamma);
  const debouncedClip    = useDebounce(clipLimit);
  const debouncedDenoise = useDebounce(denoiseStrength);

  // ref buat tau udah pernah process apa belum
  // kalo pake state biasa bakal infinite loop, percaya aja
  const hasProcessed = useRef(false);

  const callAPI = useCallback(async ({ file, g, cl, ds, isAuto = false }) => {
    if (!file) return;

    // bedain loading manual vs auto biar UX-nya beda
    isAuto ? setIsAutoProcessing(true) : setLoading(true);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("gamma", g);
    fd.append("clipLimit", cl);
    fd.append("denoiseStrength", ds);

    try {
      const res  = await fetch("http://localhost:8000/process-image/", { method: "POST", body: fd });
      const data = await res.json();
      setProcessedImage(data.image_base64);
      hasProcessed.current = true;
    } catch (err) {
      console.error(err);
      // alert cuma muncul pas manual, auto gagal ya udah skip aja
      if (!isAuto) alert("Backend belum berjalan!");
    } finally {
      isAuto ? setIsAutoProcessing(false) : setLoading(false);
    }
  }, []);

  // auto re-process tiap slider berhenti digeser
  // sengaja ga jalan sebelum process pertama — ga mau spam backend pas baru buka app
  useEffect(() => {
    if (!hasProcessed.current || !selectedFile) return;
    callAPI({ file: selectedFile, g: debouncedGamma, cl: debouncedClip, ds: debouncedDenoise, isAuto: true });
  }, [debouncedGamma, debouncedClip, debouncedDenoise, selectedFile, callAPI]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setOriginalPreview(URL.createObjectURL(file));
    setProcessedImage(null);
    hasProcessed.current = false; // reset, gambar baru = mulai dari nol
  };

  // tombol manual, buat first-run atau kalau mau force refresh
  const processImage = () =>
    callAPI({ file: selectedFile, g: gamma, cl: clipLimit, ds: denoiseStrength });

  const downloadImage = () => {
    if (!processedImage) return;
    const a   = document.createElement("a");
    // backend kadang kirim dengan prefix data:, kadang engga — handle dua-duanya
    a.href    = processedImage.startsWith("data:") ? processedImage : `data:image/png;base64,${processedImage}`;
    const ext  = selectedFile?.name?.split(".").pop() || "png";
    const base = selectedFile?.name?.replace(/\.[^/.]+$/, "") || "enhanced";
    a.download = `${base}_enhanced.${ext}`;
    a.click();
  };

  // potong nama file panjang biar ga meluber di sidebar
  const shortName = (selectedFile?.name || "").length > 22
    ? selectedFile.name.slice(0, 20) + "…"
    : selectedFile?.name || "";

  // normalisasi src — pastiin selalu ada prefix base64 yang bener
  const processedSrc = processedImage
    ? processedImage.startsWith("data:") ? processedImage : `data:image/png;base64,${processedImage}`
    : null;

  return (
    <div className="min-h-screen bg-[#f5f4f0] px-6 py-10">

      <header className="max-w-[1100px] mx-auto flex items-end justify-between pb-6 mb-8 border-b border-stone-200">
        <div>
          <h1 className="text-[1.4rem] font-semibold text-stone-900 tracking-tight leading-tight">
            Smart Hybrid Image Enhancer
          </h1>
          <p className="text-[0.78rem] text-stone-400 mt-1">Powered by OpenCV &amp; FastAPI</p>
        </div>
        {/* hidden di mobile, ga penting juga sih ini */}
      </header>

      <main className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 items-start">

        {/* ── SIDEBAR ── */}
        <aside className="flex flex-col gap-4">

          {/* upload */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5">
            <p className="font-mono text-[0.62rem] uppercase tracking-widest text-stone-400 mb-4">01 · Upload</p>
            <label className="relative flex flex-col items-center gap-2 p-7 border-[1.5px] border-dashed border-stone-300 rounded-xl bg-stone-50 cursor-pointer text-center transition-all hover:border-emerald-500 hover:bg-emerald-50">
              {/* input ditaruh absolute biar klik area label = klik input */}
              <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer w-full" />
              <div className="w-9 h-9 bg-stone-200 rounded-xl flex items-center justify-center text-stone-400 shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <p className="text-[0.78rem] text-stone-400 leading-relaxed">
                <span className="font-medium text-stone-600">Click to upload</span> or drag &amp; drop<br />PNG · JPG · WEBP
              </p>
            </label>

            {/* thumbnail preview — muncul setelah pilih file */}
            {originalPreview && (
              <div className="mt-3.5 flex items-center gap-3 p-2.5 bg-stone-50 border border-stone-200 rounded-xl">
                <img src={originalPreview} alt="thumb" className="w-10 h-10 object-cover rounded-lg shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[0.75rem] font-medium text-stone-700 truncate">{shortName}</p>
                  <p className="text-[0.65rem] font-mono text-emerald-600 mt-0.5">✓ ready</p>
                </div>
              </div>
            )}
          </div>

          {/* sliders */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5">
            <p className="font-mono text-[0.62rem] uppercase tracking-widest text-stone-400 mb-5">02 · Adjustments</p>
            <div className="flex flex-col gap-5">
              <SliderControl
                label="Noise Reduction" description="Smooth noise while preserving edges"
                value={denoiseStrength} min={0} max={20} step={1}
                onChange={setDenoiseStrength} isProcessing={isAutoProcessing}
              />
              <div className="h-px bg-stone-100" />
              <SliderControl
                label="Gamma" description="Adjust brightness curve of the image"
                value={gamma} min={0.1} max={3} step={0.1}
                onChange={setGamma} isProcessing={isAutoProcessing}
              />
              <div className="h-px bg-stone-100" />
              <SliderControl
                label="CLAHE Sharpness" description="Adaptive contrast enhancement strength"
                value={clipLimit} min={0.1} max={5} step={0.1}
                onChange={setClipLimit} isProcessing={isAutoProcessing}
              />
            </div>

            <button
              onClick={processImage}
              disabled={loading || !selectedFile}
              className={`mt-6 w-full py-3 rounded-xl text-[0.85rem] font-semibold flex items-center justify-center gap-2 transition-all duration-200
                ${loading || !selectedFile
                  ? "bg-stone-100 text-stone-400 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white hover:-translate-y-px active:translate-y-0"}`}
            >
              {loading ? (
                <><span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />Processing…</>
              ) : (
                <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5,3 19,12 5,21"/></svg>Apply Enhancement</>
              )}
            </button>
          </div>

          {/* stats + download — conditional, ga perlu keliatan kalau belum ada hasil */}
          {processedSrc && (
            <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
              {/* snapshot nilai saat terakhir diproses */}
              <div className="grid grid-cols-3 divide-x divide-stone-100">
                {[["Gamma", gamma], ["CLAHE", clipLimit], ["Denoise", denoiseStrength]].map(([k, v]) => (
                  <div key={k} className="py-3 text-center">
                    <p className="font-mono text-[0.58rem] uppercase tracking-widest text-stone-400 mb-1">{k}</p>
                    <p className="font-mono text-[0.82rem] font-medium text-emerald-600">{v}</p>
                  </div>
                ))}
              </div>
              <div className="p-3 pt-0">
                <button
                  onClick={downloadImage}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-700 text-white text-[0.8rem] font-medium transition-all hover:-translate-y-px active:translate-y-0"
                >
                  <FaDownload size={12} /> Download Enhanced
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* ── PREVIEW PANEL ── */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5 sticky top-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[0.95rem] font-semibold text-stone-800 tracking-tight">Result Preview</span>
            <div className="flex items-center gap-2">
              {isAutoProcessing && (
                <span className="flex items-center gap-1.5 font-mono text-[0.65rem] text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />auto-updating
                </span>
              )}
              {processedSrc && !isAutoProcessing && (
                <span className="font-mono text-[0.65rem] uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                  Enhanced
                </span>
              )}
            </div>
          </div>

          {/* container gambar — min-height biar ga collapse pas kosong */}
          <div className="relative rounded-xl overflow-hidden bg-stone-100 border border-stone-200 flex items-center justify-center min-h-[500px]">

            {/* overlay blur pas processing, biar keliatan ada aktivitas */}
            {(loading || isAutoProcessing) && (
              <div className="absolute inset-0 bg-stone-50/80 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="flex items-center gap-2.5 bg-white border border-stone-200 shadow-sm px-5 py-2.5 rounded-full">
                  <span className="w-4 h-4 rounded-full border-2 border-stone-200 border-t-emerald-600 animate-spin" />
                  <span className="text-[0.82rem] font-medium text-stone-700">Processing…</span>
                </div>
              </div>
            )}

            {/* empty state */}
            {!originalPreview && (
              <div className="text-center p-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-stone-200 rounded-2xl flex items-center justify-center text-2xl">🖼</div>
                <p className="text-[0.85rem] text-stone-400 leading-relaxed">
                  Upload an image to get started.<br />Before &amp; after will appear here.
                </p>
              </div>
            )}

            {/* gambar original doang, sebelum di-enhance */}
            {originalPreview && !processedSrc && !loading && (
              <img src={originalPreview} alt="original" className="w-full h-full object-contain max-h-[600px]" />
            )}

            {/* compare slider — muncul setelah ada hasil */}
            {originalPreview && processedSrc && (
              <div className="w-full">
                <ReactCompareImage
                  leftImage={originalPreview}
                  rightImage={processedSrc}
                  leftImageLabel="Before"
                  rightImageLabel="After"
                  leftImageCss={{ objectFit: "contain" }}
                  rightImageCss={{ objectFit: "contain" }}
                  aspectRatio="taller"
                  sliderLineColor="#10b981"
                  sliderLineWidth={2}
                  handleSize={36}
                />
              </div>
            )}
          </div>

          {originalPreview && processedSrc && (
            <p className="mt-3 text-center font-mono text-[0.62rem] text-stone-400 tracking-wide">
              ← drag slider to compare before / after →
            </p>
          )}
        </div>

      </main>
    </div>
  );
}

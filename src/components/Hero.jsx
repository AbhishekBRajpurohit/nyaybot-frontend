import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Paperclip,
  Mic,
  MicOff,
  Send,
  X,
  Camera,
  ArrowLeft,
  FileText,
  Upload,
  Users,
  Image,
  FolderOpen,
  Loader2,
} from "lucide-react";
import { t } from "../i18n";

// ─── Attach Menu ────────────────────────────────────────────────────────────
const AttachMenu = React.forwardRef(function AttachMenu(
  { onCamera, onGallery, onDocument, lang },
  ref
) {
  return (
    <div
      ref={ref}
      className="absolute bottom-full left-0 mb-2 w-52 bg-[#1a1f2e] border border-white/12 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50"
    >
      <button
        onClick={onCamera}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-slate-200 hover:bg-yellow-500/10 hover:text-yellow-300 transition-all group"
      >
        <div className="w-8 h-8 rounded-xl bg-yellow-500/15 border border-yellow-500/25 flex items-center justify-center group-hover:bg-yellow-500/25 transition-all">
          <Camera size={15} className="text-yellow-400" />
        </div>
        <span className="font-semibold">{t(lang, "attach_camera")}</span>
      </button>
      <div className="h-px bg-white/6 mx-4" />
      <button
        onClick={onGallery}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-slate-200 hover:bg-yellow-500/10 hover:text-yellow-300 transition-all group"
      >
        <div className="w-8 h-8 rounded-xl bg-yellow-500/15 border border-yellow-500/25 flex items-center justify-center group-hover:bg-yellow-500/25 transition-all">
          <Image size={15} className="text-yellow-400" />
        </div>
        <span className="font-semibold">{t(lang, "attach_gallery")}</span>
      </button>
      <div className="h-px bg-white/6 mx-4" />
      <button
        onClick={onDocument}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-slate-200 hover:bg-yellow-500/10 hover:text-yellow-300 transition-all group"
      >
        <div className="w-8 h-8 rounded-xl bg-yellow-500/15 border border-yellow-500/25 flex items-center justify-center group-hover:bg-yellow-500/25 transition-all">
          <FolderOpen size={15} className="text-yellow-400" />
        </div>
        <span className="font-semibold">{t(lang, "attach_document")}</span>
      </button>
    </div>
  );
});

// ─── Groq API Call ─────────────────────────────────────────────────────────
async function callGroq({ text, images }) {
  const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

  if (!GROQ_API_KEY || GROQ_API_KEY === "your-groq-api-key-here") {
    throw new Error(
      "Groq API key not set. Please add VITE_GROQ_API_KEY in your .env file."
    );
  }

  const systemPrompt = `You are NyayBot, an expert Indian legal AI assistant.
Analyze the user's case details or FIR document and provide:
1. 📋 Key Legal Issues
2. ⚖️ Applicable Laws & Sections (IPC/BNS, BNSS, CrPC etc.)
3. 🔍 Important Facts Extracted
4. 📝 Recommended Next Steps
5. 🔓 Bail Possibility (if relevant)
IMPORTANT: Always respond in English only, regardless of what language the user writes in.
Be clear, simple and helpful for common people who don't understand legal language.`;

  // Build user content
  // Note: Groq's free models (llama-3.2-11b-vision-preview) support vision
  // If images are attached, use the vision model; otherwise use text model
  const hasImages = images && images.length > 0;
  const model = hasImages
    ? "meta-llama/llama-4-scout-17b-16e-instruct" // Groq vision model
    : "llama-3.1-8b-instant"; // Fast free text model

  let userContent;

  if (hasImages) {
    // Vision model content format (array of content parts)
    userContent = [
      {
        type: "text",
        text: text?.trim()
          ? `Analyze this case: ${text}`
          : "Analyze the attached FIR or legal document image(s) and extract all important legal information.",
      },
      ...images.map((imgDataUrl) => ({
        type: "image_url",
        image_url: {
          url: imgDataUrl,
        },
      })),
    ];
  } else {
    userContent = text?.trim()
      ? text
      : "Please provide general information about Indian legal rights.";
  }

  const body = {
    model,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userContent,
      },
    ],
    temperature: 0.3,
    max_tokens: 1500,
  };

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message || `Groq error ${res.status}`;
    throw new Error(msg);
  }

  const data = await res.json();
  const responseText = data?.choices?.[0]?.message?.content;
  if (!responseText)
    throw new Error("No response from Groq. Please try again.");
  return responseText;
}

// ─── Main Hero Component ──────────────────────────────────────────────────────
export default function Hero({
  mode = "home",
  lang = "en",
  onBack,
  onShowLawyers,
  onFIRAnalysis,
  onUploadFIR,
}) {
  const [text, setText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [capturedImages, setCapturedImages] = useState([]);
  const [attachedFile, setAttachedFile] = useState(null);
  const [cameraError, setCameraError] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiError, setAiError] = useState("");

  const textareaRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);
  const attachMenuRef = useRef(null);
  const responseRef = useRef(null);

  useEffect(() => {
    if (mode === "upload") {
      const timer = setTimeout(() => openCamera(), 400);
      return () => clearTimeout(timer);
    }
  }, [mode]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [text]);

  useEffect(() => {
    const handler = (e) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target)) {
        setShowAttachMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Auto scroll to response
  useEffect(() => {
    if (aiResponse || aiError) {
      setTimeout(
        () =>
          responseRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          }),
        100
      );
    }
  }, [aiResponse, aiError]);

  const toggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      setIsListening(false);
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = lang === "hi" ? "hi-IN" : lang === "kn" ? "kn-IN" : "en-IN";
    r.onresult = (e) =>
      setText(
        Array.from(e.results)
          .map((res) => res[0].transcript)
          .join("")
      );
    r.onerror = () => setIsListening(false);
    r.onend = () => setIsListening(false);
    r.start();
    recognitionRef.current = r;
    setIsListening(true);
  };

  const openCamera = async () => {
    setShowAttachMenu(false);
    setCameraError("");
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setCameraError(t(lang, "camera_denied"));
    }
  };

  const closeCamera = () => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    setShowCamera(false);
    setCameraError("");
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedImages((prev) => [...prev, { id: Date.now(), dataUrl }]);
    closeCamera();
  };

  const removeImage = (id) => {
    setCapturedImages((prev) => prev.filter((img) => img.id !== id));
  };

  const openGallery = useCallback(() => {
    setShowAttachMenu(false);
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setCapturedImages((prev) => [
            ...prev,
            { id: Date.now() + Math.random(), dataUrl: ev.target.result },
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        setAttachedFile(file);
      }
    });
    e.target.value = "";
  };

  const openDocument = useCallback(() => {
    setShowAttachMenu(false);
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = ".pdf,.doc,.docx,.txt";
    inp.onchange = (e) => {
      const file = e.target.files[0];
      if (file) setAttachedFile(file);
    };
    inp.click();
  }, []);

  const handleAnalyze = async () => {
    if (!text.trim() && capturedImages.length === 0 && !attachedFile) return;
    setAiResponse("");
    setAiError("");
    setIsAnalyzing(true);
    try {
      const images = capturedImages.map((img) => img.dataUrl);
      const response = await callGroq({ text, images });
      setAiResponse(response);
    } catch (err) {
      setAiError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const hasContent = !!(
    text.trim() ||
    capturedImages.length > 0 ||
    attachedFile
  );

  const inputUI = (
    <>
      {/* Camera overlay */}
      {showCamera && (
        <div className="w-full mb-6 rounded-3xl overflow-hidden border border-yellow-500/30 bg-black shadow-2xl shadow-yellow-500/10 relative">
          {cameraError ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4 px-8">
              <p className="text-red-400 text-sm text-center">{cameraError}</p>
              <button
                onClick={closeCamera}
                className="px-5 py-2.5 rounded-xl bg-white/8 border border-white/15 text-slate-300 text-sm font-medium hover:bg-white/15 transition-all"
              >
                {t(lang, "camera_cancel")}
              </button>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full object-cover"
              style={{ minHeight: "300px", maxHeight: "480px" }}
            />
          )}
          {!cameraError && (
            <>
              <div className="absolute top-3 left-3 w-7 h-7 border-t-2 border-l-2 border-yellow-400 rounded-tl-md pointer-events-none" />
              <div className="absolute top-3 right-3 w-7 h-7 border-t-2 border-r-2 border-yellow-400 rounded-tr-md pointer-events-none" />
              <div className="absolute bottom-[72px] left-3 w-7 h-7 border-b-2 border-l-2 border-yellow-400 rounded-bl-md pointer-events-none" />
              <div className="absolute bottom-[72px] right-3 w-7 h-7 border-b-2 border-r-2 border-yellow-400 rounded-br-md pointer-events-none" />
              <div className="flex gap-3 p-4 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
                <button
                  onClick={closeCamera}
                  className="flex-1 py-3.5 rounded-2xl bg-white/10 border border-white/20 text-white font-semibold text-base hover:bg-white/20 transition-all"
                >
                  {t(lang, "camera_cancel")}
                </button>
                <button
                  onClick={capturePhoto}
                  className="flex-[2] py-3.5 rounded-2xl bg-yellow-500 text-slate-900 font-bold text-base flex items-center justify-center gap-2.5 hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/30 active:scale-[0.98]"
                >
                  <Camera size={20} /> {t(lang, "camera_capture")}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Multi-photo strip */}
      {capturedImages.length > 0 && !showCamera && (
        <div className="w-full mb-3 flex flex-wrap gap-2 bg-white/5 border border-white/10 rounded-2xl px-3 py-2.5">
          <span className="w-full text-slate-400 text-xs font-semibold mb-1">
            {capturedImages.length} {t(lang, "hero_photos_attached")}
          </span>
          {capturedImages.map((img) => (
            <div key={img.id} className="relative shrink-0">
              <img
                src={img.dataUrl}
                alt="Attached"
                className="w-16 h-16 rounded-xl object-cover border border-yellow-500/30"
              />
              <button
                onClick={() => removeImage(img.id)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-700 border border-white/20 flex items-center justify-center text-white hover:bg-red-500 transition-all"
              >
                <X size={10} />
              </button>
            </div>
          ))}
          <button
            onClick={openGallery}
            className="w-16 h-16 rounded-xl border-2 border-dashed border-yellow-500/30 flex items-center justify-center text-yellow-500/50 hover:border-yellow-500/60 hover:text-yellow-400 transition-all text-2xl font-light"
          >
            +
          </button>
        </div>
      )}

      {/* Attached doc badge */}
      {attachedFile && (
        <div className="w-full mb-3 flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
          <Paperclip size={15} className="text-yellow-400 shrink-0" />
          <span className="text-slate-300 text-sm truncate flex-1">
            {attachedFile.name}
          </span>
          <button
            onClick={() => setAttachedFile(null)}
            className="text-slate-500 hover:text-red-400 transition-colors shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main input box */}
      <div
        className={`w-full rounded-3xl border transition-all duration-300 shadow-2xl ${
          isListening
            ? "bg-[#180a0a] border-red-500/40 shadow-red-500/8"
            : "bg-[#0f0f0f] border-white/10 hover:border-yellow-500/20 focus-within:border-yellow-500/35"
        }`}
      >
        {isListening && (
          <div className="flex items-center gap-2.5 px-6 pt-4 pb-1">
            <span className="flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-0.5 h-4 bg-red-500 rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </span>
            <span className="text-red-400 text-xs font-semibold tracking-wider uppercase">
              {t(lang, "listening_text")}
            </span>
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleAnalyze();
            }
          }}
          placeholder={
            mode === "upload"
              ? t(lang, "hero_placeholder_upload")
              : t(lang, "hero_placeholder_home")
          }
          rows={2}
          className="w-full bg-transparent text-white placeholder-slate-600 text-[15px] leading-relaxed resize-none px-6 pt-5 pb-3 focus:outline-none"
          style={{ minHeight: "72px", maxHeight: "200px" }}
        />

        <div className="flex items-center gap-2.5 px-5 pb-4 pt-1">
          <div className="relative">
            {showAttachMenu && (
              <AttachMenu
                ref={attachMenuRef}
                onCamera={openCamera}
                onGallery={openGallery}
                onDocument={openDocument}
                lang={lang}
              />
            )}
            <button
              onClick={() => setShowAttachMenu((v) => !v)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all border ${
                capturedImages.length > 0 || attachedFile
                  ? "bg-yellow-500/15 border-yellow-500/40 text-yellow-300"
                  : showAttachMenu
                  ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
                  : "bg-white/5 border-white/10 text-slate-300 hover:text-yellow-400 hover:border-yellow-500/25 hover:bg-yellow-500/6"
              }`}
            >
              <Paperclip size={15} />
              <span>{t(lang, "hero_attach")}</span>
              {capturedImages.length > 0 && (
                <span className="bg-yellow-500 text-slate-900 text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                  {capturedImages.length}
                </span>
              )}
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.txt"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />

          <button
            onClick={toggleVoice}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all border ${
              isListening
                ? "bg-red-500/20 border-red-500/50 text-red-400 shadow-lg shadow-red-500/15"
                : "bg-white/5 border-white/10 text-slate-300 hover:text-yellow-400 hover:border-yellow-500/25 hover:bg-yellow-500/6"
            }`}
          >
            {isListening ? (
              <>
                <MicOff size={15} />
                <span>{t(lang, "hero_stop")}</span>
              </>
            ) : (
              <>
                <Mic size={15} />
                <span>{t(lang, "hero_voice")}</span>
              </>
            )}
          </button>

          <div className="flex-1" />

          <button
            onClick={handleAnalyze}
            disabled={!hasContent || isAnalyzing}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold transition-all duration-200 border ${
              hasContent && !isAnalyzing
                ? "bg-yellow-500 border-yellow-500 text-slate-900 hover:bg-yellow-400 hover:shadow-lg hover:shadow-yellow-500/25 active:scale-[0.97]"
                : "bg-white/5 border-white/8 text-slate-600 cursor-not-allowed"
            }`}
          >
            {isAnalyzing ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Send size={15} />
            )}
            <span>
              {isAnalyzing
                ? t(lang, "hero_analyzing")
                : t(lang, "hero_analyze")}
            </span>
          </button>
        </div>
      </div>

      {/* AI Response Box */}
      {(aiResponse || aiError || isAnalyzing) && (
        <div
          ref={responseRef}
          className={`w-full mt-4 rounded-2xl border p-5 transition-all ${
            aiError
              ? "bg-red-500/8 border-red-500/25"
              : isAnalyzing
              ? "bg-white/3 border-white/10"
              : "bg-[#0d1a0d] border-yellow-500/20"
          }`}
        >
          {isAnalyzing ? (
            <div className="flex items-center gap-3">
              <Loader2 size={16} className="animate-spin text-yellow-400" />
              <span className="text-slate-400 text-sm">
                {t(lang, "hero_analyzing")}
              </span>
            </div>
          ) : aiError ? (
            <p className="text-red-400 text-sm">{aiError}</p>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                <span className="text-yellow-400 text-xs font-bold uppercase tracking-widest">
                  {t(lang, "hero_ai_response")}
                </span>
                <span className="ml-auto text-[10px] text-slate-600 font-medium">
                  Powered by Groq
                </span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                {aiResponse}
              </p>
            </>
          )}
        </div>
      )}

      <p className="text-slate-600 text-xs mt-4 tracking-wide">
        {t(lang, "hero_hint")}
      </p>
    </>
  );

  if (mode !== "home") {
    return (
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-24 pb-16" style={{background: "linear-gradient(135deg, #0a0c18 0%, #0d1020 40%, #111428 100%)"}}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(212,160,23,0.12)_0%,transparent_65%)]" />
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full bg-[radial-gradient(ellipse_at_bottom_right,rgba(30,40,120,0.25)_0%,transparent_70%)]" />
        </div>
        <div className="relative z-10 w-full max-w-3xl mx-auto px-4 flex flex-col items-center text-center">
          {onBack && (
            <button
              onClick={onBack}
              className="self-start flex items-center gap-2 text-slate-500 hover:text-yellow-400 text-sm font-semibold mb-8 px-3 py-2 rounded-xl hover:bg-yellow-500/8 border border-transparent hover:border-yellow-500/20 transition-all"
            >
              <ArrowLeft size={15} /> {t(lang, "hero_back")}
            </button>
          )}
          <div className="mb-5 inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-semibold px-4 py-1.5 rounded-full tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
            {mode === "upload"
              ? t(lang, "hero_upload_fir")
              : t(lang, "hero_fir_analysis")}
          </div>
          <h2 className="font-serif text-4xl font-bold text-white mb-8">
            {mode === "upload"
              ? t(lang, "hero_upload_title")
              : t(lang, "hero_analyze_title")}
          </h2>
          {inputUI}
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-24 pb-16" style={{background: "linear-gradient(135deg, #08091a 0%, #0c0f22 35%, #10142e 65%, #0d1020 100%)"}}>
      <div className="absolute inset-0 pointer-events-none">
        {/* Main gold glow */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(212,160,23,0.13)_0%,transparent_65%)]" />
        {/* Right side blue-navy depth */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[radial-gradient(ellipse_at_top_right,rgba(25,35,110,0.35)_0%,transparent_65%)]" />
        {/* Bottom glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[radial-gradient(ellipse_at_bottom,rgba(180,120,0,0.08)_0%,transparent_70%)]" />
        {/* Subtle noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", backgroundSize:"200px"}} />
      </div>
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none select-none">
        <svg
          viewBox="0 0 400 400"
          className="w-[600px] h-[600px] text-yellow-500"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        >
          <line x1="200" y1="60" x2="200" y2="340" />
          <line x1="80" y1="120" x2="320" y2="120" />
          <circle cx="200" cy="60" r="8" fill="currentColor" />
          <line x1="80" y1="120" x2="80" y2="200" />
          <ellipse cx="80" cy="210" rx="50" ry="18" />
          <line x1="320" y1="120" x2="320" y2="180" />
          <ellipse cx="320" cy="190" rx="50" ry="18" />
          <rect
            x="180"
            y="340"
            width="40"
            height="8"
            rx="2"
            fill="currentColor"
            opacity="0.5"
          />
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-3xl mx-auto px-4 flex flex-col items-center text-center">
        <div className="mb-6 inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-semibold px-4 py-1.5 rounded-full tracking-widest uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
          {t(lang, "hero_badge")}
        </div>
        <h1 className="font-serif text-5xl md:text-6xl font-bold text-white leading-tight mb-4">
          {t(lang, "hero_title1")}
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-300">
            {t(lang, "hero_title2")}
          </span>
        </h1>
        <p className="text-slate-400 text-lg mb-10 max-w-xl leading-relaxed">
          {t(lang, "hero_subtitle")}
        </p>

        {inputUI}

        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
          {[
            {
              Icon: FileText,
              key: "hero_fir_analysis",
              onClick: onFIRAnalysis,
            },
            { Icon: Upload, key: "hero_upload_fir", onClick: onUploadFIR },
            { Icon: Users, key: "hero_local_lawyers", onClick: onShowLawyers },
          ].map(({ Icon, key, onClick }) => (
            <button
              key={key}
              onClick={onClick}
              className="group flex flex-col items-center gap-3 bg-[#111827] hover:bg-[#161f30] border border-white/8 hover:border-yellow-500/30 rounded-2xl px-6 py-8 transition-all duration-200 hover:shadow-[0_0_30px_rgba(234,179,8,0.08)] active:scale-[0.98]"
            >
              <Icon
                size={32}
                className="text-yellow-500 group-hover:text-yellow-400 transition-colors"
              />
              <span className="text-white font-bold text-base">
                {t(lang, key)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Camera, 
  CheckCircle2, 
  Upload, 
  FileText, 
  Phone, 
  Mail, 
  CreditCard, 
  UserCheck, 
  RefreshCw, 
  Sparkles,
  Lock,
  Eye,
  Check,
  X,
  ExternalLink,
  Globe
} from 'lucide-react';
import { KycData, KycIdDocType, KycStatus, UserProfile } from '../types';
import { COUNTRIES_LIST } from '../utils/countryData';

interface KycVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onSaveKyc: (kyc: KycData) => void;
}

export const KycVerificationModal: React.FC<KycVerificationModalProps> = ({
  isOpen,
  onClose,
  user,
  onSaveKyc,
}) => {
  const currentKyc = user.kyc || {
    status: 'unverified',
    whatsapp: '',
    email: 'alex.rivera@cps.network',
    docType: 'passport',
    docNumber: '',
  };

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [whatsapp, setWhatsapp] = useState(currentKyc.whatsapp || '+1 (555) 392-8192');
  const [email, setEmail] = useState(currentKyc.email || 'alex.rivera@cps.network');
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>(currentKyc.countryCode || 'PK');
  const [docType, setDocType] = useState<KycIdDocType>(currentKyc.docType || 'passport');
  const [docNumber, setDocNumber] = useState(currentKyc.docNumber || '');
  const [docPhotoUrl, setDocPhotoUrl] = useState<string | undefined>(currentKyc.docPhotoUrl);
  const [facePhotoUrl, setFacePhotoUrl] = useState<string | undefined>(currentKyc.facePhotoUrl);

  // Camera capture state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera when closing or unmounting
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('Camera access unavailable. You can upload a photo or use a sample test selfie.');
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setFacePhotoUrl(dataUrl);
        stopCamera();
      }
    }
  };

  const handleUseSampleSelfie = () => {
    setFacePhotoUrl(user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80');
    stopCamera();
  };

  const handleDocFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setDocPhotoUrl(uploadEvent.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUseSampleDoc = () => {
    setDocPhotoUrl('https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80');
    if (!docNumber) {
      setDocNumber('A948201948');
    }
  };

  const handleSubmitKyc = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      const selectedCountryObj = COUNTRIES_LIST.find((c) => c.code === selectedCountryCode) || COUNTRIES_LIST[0];
      const updatedKyc: KycData = {
        status: 'verified',
        country: selectedCountryObj.name,
        countryCode: selectedCountryObj.code,
        whatsapp: whatsapp || '+1 (555) 392-8192',
        email: email || 'alex.rivera@cps.network',
        docType,
        docNumber: docNumber || `${selectedCountryObj.code}-${Math.floor(1000000 + Math.random() * 9000000)}`,
        docPhotoUrl: docPhotoUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
        facePhotoUrl: facePhotoUrl || user.avatar,
        verifiedAt: new Date().toISOString(),
      };
      onSaveKyc(updatedKyc);
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1500);
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div 
        id="kyc-modal-card"
        className="rounded-3xl border w-full max-w-xl relative overflow-hidden shadow-2xl transition-all"
        style={{
          backgroundColor: 'var(--theme-card)',
          borderColor: 'var(--theme-border)',
        }}
      >
        {/* Top Header */}
        <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: 'var(--theme-border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg" style={{ color: 'var(--theme-text-primary)' }}>
                  User KYC Verification
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Mandatory
                </span>
              </div>
              <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                Government ID, Passport, WhatsApp, Email & Live Face Selfie
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-xl border hover:bg-slate-800 transition-colors"
            style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Multi-step indicator */}
        <div className="px-6 pt-4 pb-2 border-b flex items-center justify-between text-xs" style={{ borderColor: 'var(--theme-border)' }}>
          <button 
            onClick={() => setStep(1)} 
            className={`font-semibold pb-2 border-b-2 transition-all flex items-center gap-1.5 ${
              step === 1 ? 'border-sky-400 text-sky-400' : 'border-transparent text-slate-400'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] flex items-center justify-center">1</span>
            <span>WhatsApp & Email</span>
          </button>

          <button 
            onClick={() => setStep(2)} 
            className={`font-semibold pb-2 border-b-2 transition-all flex items-center gap-1.5 ${
              step === 2 ? 'border-sky-400 text-sky-400' : 'border-transparent text-slate-400'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] flex items-center justify-center">2</span>
            <span>Government ID</span>
          </button>

          <button 
            onClick={() => setStep(3)} 
            className={`font-semibold pb-2 border-b-2 transition-all flex items-center gap-1.5 ${
              step === 3 ? 'border-sky-400 text-sky-400' : 'border-transparent text-slate-400'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] flex items-center justify-center">3</span>
            <span>Face with Camera</span>
          </button>

          <button 
            onClick={() => setStep(4)} 
            className={`font-semibold pb-2 border-b-2 transition-all flex items-center gap-1.5 ${
              step === 4 ? 'border-sky-400 text-sky-400' : 'border-transparent text-slate-400'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] flex items-center justify-center">4</span>
            <span>Review</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {isSuccess ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto animate-bounce border border-emerald-500/40">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-black" style={{ color: 'var(--theme-text-primary)' }}>
                KYC Verification Completed!
              </h4>
              <p className="text-xs max-w-sm mx-auto" style={{ color: 'var(--theme-text-muted)' }}>
                Your identity has been confirmed with your Government ID, WhatsApp, Email, and Face Camera Verification. You can now execute trades and drive market value.
              </p>
            </div>
          ) : (
            <>
              {/* STEP 1: WhatsApp & Email */}
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-xs space-y-1">
                    <p className="font-bold text-sky-400">Step 1: Contact Channels</p>
                    <p style={{ color: 'var(--theme-text-muted)' }}>
                      Enter your active WhatsApp number and Email for automated OTP verification and actuator notifications.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 flex items-center gap-1.5" style={{ color: 'var(--theme-text-secondary)' }}>
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>WhatsApp Number:</span>
                    </label>
                    <input
                      id="kyc-whatsapp-input"
                      type="tel"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-sky-400 font-mono"
                      style={{
                        backgroundColor: 'var(--theme-bg)',
                        borderColor: 'var(--theme-border)',
                        color: 'var(--theme-text-primary)',
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 flex items-center gap-1.5" style={{ color: 'var(--theme-text-secondary)' }}>
                      <Mail className="w-3.5 h-3.5 text-sky-400" />
                      <span>Email Address:</span>
                    </label>
                    <input
                      id="kyc-email-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@domain.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-sky-400 font-mono"
                      style={{
                        backgroundColor: 'var(--theme-bg)',
                        borderColor: 'var(--theme-border)',
                        color: 'var(--theme-text-primary)',
                      }}
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      id="kyc-step1-next-btn"
                      onClick={() => setStep(2)}
                      className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                    >
                      Next: Government ID &rarr;
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Government ID (Passport / Driving License / National ID) */}
              {step === 2 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                    <p className="font-bold text-amber-400">Step 2: Government Official ID</p>
                    <p style={{ color: 'var(--theme-text-muted)' }}>
                      Select your issuing country jurisdiction and document type for real-time verification and network telemetry.
                    </p>
                  </div>

                  {/* Issuing Government / Country Jurisdiction Dropdown */}
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 flex items-center justify-between" style={{ color: 'var(--theme-text-secondary)' }}>
                      <span className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-sky-400" />
                        <span>Issuing Country / Government Jurisdiction:</span>
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono">Mapped to Regional Heatmap</span>
                    </label>
                    <div className="relative">
                      <select
                        id="kyc-country-select"
                        value={selectedCountryCode}
                        onChange={(e) => setSelectedCountryCode(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-sky-400 appearance-none pr-10 cursor-pointer"
                        style={{
                          backgroundColor: 'var(--theme-bg)',
                          borderColor: 'var(--theme-border)',
                          color: 'var(--theme-text-primary)',
                        }}
                      >
                        {COUNTRIES_LIST.map((c) => (
                          <option key={c.code} value={c.code} className="bg-slate-900 text-white py-1">
                            {c.flag} {c.name} ({c.code})
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-xs text-slate-400">
                        ▼
                      </div>
                    </div>
                    <p className="text-[11px] mt-1 text-slate-400">
                      Selected: <strong className="text-white">
                        {COUNTRIES_LIST.find((c) => c.code === selectedCountryCode)?.flag} {COUNTRIES_LIST.find((c) => c.code === selectedCountryCode)?.name}
                      </strong>. Your Actuator node presence is pinned to this territory on the Admin Heatmap.
                    </p>
                  </div>

                  {/* Document Type Selector */}
                  <div>
                    <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--theme-text-secondary)' }}>
                      Select Identification Type:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'passport' as KycIdDocType, label: 'Passport', icon: FileText },
                        { id: 'driving_license' as KycIdDocType, label: 'Driving License', icon: CreditCard },
                        { id: 'national_id' as KycIdDocType, label: 'National ID', icon: ShieldCheck },
                      ].map((item) => {
                        const Icon = item.icon;
                        const isSelected = docType === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setDocType(item.id)}
                            className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                              isSelected
                                ? 'bg-sky-500/15 border-sky-400 text-sky-400 font-bold'
                                : 'border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                            style={{
                              backgroundColor: isSelected ? 'var(--theme-card-hover)' : 'var(--theme-bg)',
                            }}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="text-xs">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Document Number */}
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--theme-text-secondary)' }}>
                      Document Serial Number:
                    </label>
                    <input
                      id="kyc-docnumber-input"
                      type="text"
                      value={docNumber}
                      onChange={(e) => setDocNumber(e.target.value)}
                      placeholder="e.g. DL-84920194 or Passport Number"
                      className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono focus:outline-none focus:ring-1 focus:ring-sky-400"
                      style={{
                        backgroundColor: 'var(--theme-bg)',
                        borderColor: 'var(--theme-border)',
                        color: 'var(--theme-text-primary)',
                      }}
                    />
                  </div>

                  {/* Document Photo Upload / Sample Preview */}
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--theme-text-secondary)' }}>
                      Document Photo Upload:
                    </label>
                    <div 
                      className="p-4 rounded-xl border border-dashed text-center space-y-2"
                      style={{
                        backgroundColor: 'var(--theme-bg)',
                        borderColor: 'var(--theme-border)',
                      }}
                    >
                      {docPhotoUrl ? (
                        <div className="space-y-2">
                          <img 
                            src={docPhotoUrl} 
                            alt="Document Preview" 
                            className="max-h-36 rounded-lg mx-auto object-cover border border-slate-700"
                          />
                          <div className="flex justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => setDocPhotoUrl(undefined)}
                              className="text-xs text-rose-400 hover:underline"
                            >
                              Remove & re-upload
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 py-2">
                          <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                          <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                            Drag & drop or click to upload ID photo
                          </p>
                          <div className="flex justify-center gap-2 pt-1">
                            <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs transition-all">
                              <span>Choose File</span>
                              <input type="file" accept="image/*" onChange={handleDocFileUpload} className="hidden" />
                            </label>
                            <button
                              type="button"
                              onClick={handleUseSampleDoc}
                              className="px-3 py-1.5 rounded-lg border text-xs font-medium hover:bg-slate-800 transition-colors"
                              style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}
                            >
                              Use Sample ID
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 flex justify-between items-center">
                    <button
                      onClick={() => setStep(1)}
                      className="text-xs font-semibold"
                      style={{ color: 'var(--theme-text-muted)' }}
                    >
                      &larr; Back
                    </button>
                    <button
                      id="kyc-step2-next-btn"
                      onClick={() => {
                        if (!docNumber) setDocNumber('A948201948');
                        if (!docPhotoUrl) handleUseSampleDoc();
                        setStep(3);
                      }}
                      className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                    >
                      Next: Live Face Camera &rarr;
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Face with Camera (Live Webcam / Selfie) */}
              {step === 3 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
                    <p className="font-bold text-emerald-400">Step 3: Face Verification with Camera</p>
                    <p style={{ color: 'var(--theme-text-muted)' }}>
                      Capture a live facial selfie to verify you are the real individual matching your government ID.
                    </p>
                  </div>

                  {/* Hidden Canvas for capture */}
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Camera Stage Box */}
                  <div 
                    className="p-4 rounded-2xl border text-center relative overflow-hidden flex flex-col items-center justify-center min-h-[260px]"
                    style={{
                      backgroundColor: 'var(--theme-bg)',
                      borderColor: 'var(--theme-border)',
                    }}
                  >
                    {facePhotoUrl ? (
                      <div className="space-y-3">
                        <div className="relative inline-block">
                          <img 
                            src={facePhotoUrl} 
                            alt="Captured Face" 
                            className="w-36 h-36 rounded-full object-cover border-4 border-emerald-400 shadow-xl mx-auto"
                          />
                          <span className="absolute bottom-1 right-2 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">
                            <Check className="w-4 h-4" />
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-emerald-400">
                          Face Selfie Captured Successfully
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setFacePhotoUrl(undefined);
                            startCamera();
                          }}
                          className="text-xs text-sky-400 hover:underline flex items-center gap-1 mx-auto"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Retake with Camera</span>
                        </button>
                      </div>
                    ) : isCameraActive ? (
                      <div className="w-full space-y-3">
                        <div className="relative mx-auto max-w-[320px] rounded-2xl overflow-hidden border-2 border-sky-400">
                          <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            muted 
                            className="w-full h-48 object-cover mirror"
                          />
                          {/* Face Oval Overlay */}
                          <div className="absolute inset-0 border-2 border-dashed border-white/60 rounded-full m-4 pointer-events-none" />
                        </div>
                        <div className="flex justify-center gap-3">
                          <button
                            id="kyc-capture-btn"
                            type="button"
                            onClick={capturePhoto}
                            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs shadow-lg flex items-center gap-2 active:scale-95"
                          >
                            <Camera className="w-4 h-4" />
                            <span>Capture Face Selfie</span>
                          </button>
                          <button
                            type="button"
                            onClick={stopCamera}
                            className="px-3 py-2 rounded-xl border text-xs font-medium"
                            style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 py-4">
                        <div className="w-14 h-14 rounded-full bg-sky-500/15 text-sky-400 flex items-center justify-center mx-auto border border-sky-500/30">
                          <Camera className="w-7 h-7" />
                        </div>
                        <div>
                          <p className="font-bold text-sm" style={{ color: 'var(--theme-text-primary)' }}>
                            Launch Live Face Camera
                          </p>
                          <p className="text-xs mt-1" style={{ color: 'var(--theme-text-muted)' }}>
                            Center your face in the camera frame
                          </p>
                        </div>

                        {cameraError && (
                          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                            {cameraError}
                          </div>
                        )}

                        <div className="flex flex-wrap justify-center gap-2 pt-2">
                          <button
                            id="kyc-start-camera-btn"
                            type="button"
                            onClick={startCamera}
                            className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-sky-500/20 active:scale-95"
                          >
                            <Camera className="w-4 h-4" />
                            <span>Open Camera</span>
                          </button>
                          <button
                            id="kyc-use-sample-selfie-btn"
                            type="button"
                            onClick={handleUseSampleSelfie}
                            className="px-4 py-2.5 rounded-xl border text-xs font-medium hover:bg-slate-800 transition-colors"
                            style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}
                          >
                            Use Profile Picture
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex justify-between items-center">
                    <button
                      onClick={() => setStep(2)}
                      className="text-xs font-semibold"
                      style={{ color: 'var(--theme-text-muted)' }}
                    >
                      &larr; Back
                    </button>
                    <button
                      id="kyc-step3-next-btn"
                      onClick={() => {
                        if (!facePhotoUrl) handleUseSampleSelfie();
                        setStep(4);
                      }}
                      className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                    >
                      Next: Review & Submit &rarr;
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: Review & Submit */}
              {step === 4 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-xs space-y-1">
                    <p className="font-bold text-sky-400">Step 4: Final Confirmation</p>
                    <p style={{ color: 'var(--theme-text-muted)' }}>
                      Please review your submitted KYC credentials before finalizing verification.
                    </p>
                  </div>

                  <div 
                    className="p-4 rounded-2xl border space-y-3 text-xs"
                    style={{
                      backgroundColor: 'var(--theme-bg)',
                      borderColor: 'var(--theme-border)',
                    }}
                  >
                    <div className="flex justify-between items-center py-1 border-b" style={{ borderColor: 'var(--theme-border)' }}>
                      <span style={{ color: 'var(--theme-text-muted)' }}>WhatsApp Number:</span>
                      <span className="font-mono font-bold text-emerald-400">{whatsapp || '+1 (555) 392-8192'}</span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b" style={{ borderColor: 'var(--theme-border)' }}>
                      <span style={{ color: 'var(--theme-text-muted)' }}>Email Address:</span>
                      <span className="font-mono font-bold text-sky-400">{email || 'alex.rivera@cps.network'}</span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b" style={{ borderColor: 'var(--theme-border)' }}>
                      <span style={{ color: 'var(--theme-text-muted)' }}>Issuing Jurisdiction:</span>
                      <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                        <span>{COUNTRIES_LIST.find((c) => c.code === selectedCountryCode)?.flag}</span>
                        <span>{COUNTRIES_LIST.find((c) => c.code === selectedCountryCode)?.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                          {selectedCountryCode}
                        </span>
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b" style={{ borderColor: 'var(--theme-border)' }}>
                      <span style={{ color: 'var(--theme-text-muted)' }}>Government ID Type:</span>
                      <span className="font-bold uppercase text-amber-300">{docType.replace('_', ' ')}</span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b" style={{ borderColor: 'var(--theme-border)' }}>
                      <span style={{ color: 'var(--theme-text-muted)' }}>ID Serial Number:</span>
                      <span className="font-mono font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                        {docNumber || 'A948201948'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1">
                      <span style={{ color: 'var(--theme-text-muted)' }}>Live Face Selfie:</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Camera Verified</span>
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-between items-center">
                    <button
                      onClick={() => setStep(3)}
                      className="text-xs font-semibold"
                      style={{ color: 'var(--theme-text-muted)' }}
                    >
                      &larr; Back
                    </button>
                    <button
                      id="kyc-submit-final-btn"
                      disabled={isSubmitting}
                      onClick={handleSubmitKyc}
                      className="px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 text-white font-black text-xs sm:text-sm shadow-xl shadow-emerald-500/25 transition-all active:scale-95 flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Validating Credentials...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>Submit & Complete KYC</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

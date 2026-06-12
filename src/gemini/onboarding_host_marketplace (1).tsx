import React, { useState, useEffect, useRef, useMemo } from 'react';

interface GoogleProfile {
  name: string;
  email: string;
  picture: string;
  locale: string;
}

const SAMPLE_ACCOUNTS: GoogleProfile[] = [
  {
    name: "Carlos",
    email: "carlos.mendoza.dev@gmail.com",
    picture: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    locale: "es-LA"
  },
  {
    name: "Mariela",
    email: "mariela.silva.design@gmail.com",
    picture: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    locale: "es-EC"
  },
  {
    name: "Jorge",
    email: "jorge.villacis.reales@gmail.com",
    picture: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    locale: "es-LA"
  }
];

interface CountryCode {
  code: string;
  country: string;
  flag: string;
}

const COUNTRY_CODES: CountryCode[] = [
  { code: "+593", country: "Ecuador", flag: "🇪🇨" },
  { code: "+1", country: "Estados Unidos", flag: "🇺🇸" },
  { code: "+52", country: "México", flag: "🇲🇽" },
  { code: "+57", country: "Colombia", flag: "🇨🇴" },
  { code: "+51", country: "Perú", flag: "🇵🇪" }
];

interface ProvinciaEcuador {
  nombre: string;
  ciudades: string[];
}

const REGIONES_ECUADOR: ProvinciaEcuador[] = [
  { nombre: "Guayas", ciudades: ["Guayaquil", "Samborondón", "Durán", "Daule", "Milagro"] },
  { nombre: "Pichincha", ciudades: ["Quito", "Sangolquí", "Cayambe", "Machachi"] },
  { nombre: "Manabí", ciudades: ["Manta", "Portoviejo", "Chone", "Bahía de Caráquez"] },
  { nombre: "Azuay", ciudades: ["Cuenca", "Gualaceo", "Paute"] }
];

export default function App() {
  const [activeProfile, setActiveProfile] = useState<GoogleProfile>(SAMPLE_ACCOUNTS[0]);
  const [showAccountSelector, setShowAccountSelector] = useState<boolean>(false);
  const [isOnboardingSuccess, setIsOnboardingSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(4); // Forzado en el Paso 4 para visualización directa
  const [saveLaterNotification, setSaveLaterNotification] = useState<string | null>(null);

  // Estados del Paso 2: Verificación de Teléfono
  const [countryCode, setCountryCode] = useState<string>("+593");
  const [phoneNumber, setPhoneNumber] = useState<string>("0991234567");
  const [phoneStep, setPhoneStep] = useState<'input' | 'otp'>('input');
  const [otpStatus, setOtpStatus] = useState<'idle' | 'enviando' | 'enviado' | 'validando' | 'validado' | 'error'>('idle');
  const [otpCode, setOtpCode] = useState<string[]>(Array(6).fill(""));
  const [countdown, setCountdown] = useState<number>(30);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Estados del Paso 3: Perfil del Anfitrión
  const [apellidos, setApellidos] = useState<string>("Mendoza Silva");
  const [identificacion, setIdentificacion] = useState<string>("0987654321");
  const [fechaNacimiento, setFechaNacimiento] = useState<string>("1992-06-15");
  const [provincia, setProvincia] = useState<string>("Guayas");
  const [ciudad, setCiudad] = useState<string>("Guayaquil");
  const [showIDHelp, setShowIDHelp] = useState<boolean>(false);

  const ciudadesDisponibles = useMemo(() => {
    const region = REGIONES_ECUADOR.find(r => r.nombre === provincia);
    return region ? region.ciudades : [];
  }, [provincia]);

  // Forzar actualización de la ciudad por defecto cuando cambia la provincia
  useEffect(() => {
    if (ciudadesDisponibles.length > 0 && !ciudadesDisponibles.includes(ciudad)) {
      setCiudad(ciudadesDisponibles[0]);
    }
  }, [provincia, ciudadesDisponibles, ciudad]);

  // Temporizador para reenvío de OTP en el paso 2
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (phoneStep === 'otp' && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown, phoneStep]);

  const handleOtpChange = (index: number, value: string) => {
    const cleanValue = value.replace(/\D/g, "");
    if (!cleanValue && value !== "") return;
    const newOtp = [...otpCode];
    newOtp[index] = cleanValue.slice(-1);
    setOtpCode(newOtp);

    if (cleanValue && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    const fullCode = newOtp.join("");
    if (fullCode.length === 6) {
      setOtpStatus('validando');
      setTimeout(() => {
        if (fullCode === "123456") {
          setOtpStatus('validado');
        } else {
          setOtpStatus('error');
        }
      }, 1200);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleSelectAccount = (profile: GoogleProfile) => {
    setActiveProfile(profile);
    setShowAccountSelector(false);
  };

  const handleSaveLater = () => {
    setSaveLaterNotification("¡Tu progreso ha sido guardado de forma segura! Puedes regresar en cualquier momento.");
    setTimeout(() => {
      setSaveLaterNotification(null);
    }, 4000);
  };

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneStep('otp');
    setOtpStatus('enviando');
    setTimeout(() => {
      setOtpStatus('enviado');
    }, 1000);
  };

  const handleStep3Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apellidos || !identificacion || !fechaNacimiento || !provincia || !ciudad) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setCurrentStep(4);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#1F2937] flex flex-col justify-between font-sans antialiased selection:bg-[#14B8A6]/20">
      
      {/* HEADER DE CABECERA */}
      <header className="bg-white border-b border-slate-100 py-4 px-6 md:px-12 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentStep(1)}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1E3A5F] to-[#14B8A6] flex items-center justify-center text-white shadow-sm shadow-[#1E3A5F]/10">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
          </div>
          <span className="text-lg font-black text-[#1E3A5F] tracking-tight">Recrea<span className="text-[#14B8A6]">Hub</span></span>
        </div>

        <div className="flex items-center space-x-2">
          <button className="text-xs font-bold text-[#1E3A5F] hover:text-[#14B8A6] transition-colors bg-slate-100 hover:bg-slate-200/60 px-3.5 py-2 rounded-lg">
            Soporte Anfitriones
          </button>
        </div>
      </header>

      {/* NOTIFICACIÓN ASÍNCRONA */}
      {saveLaterNotification && (
        <div className="fixed top-24 right-6 bg-[#1E3A5F] text-white py-3.5 px-5 rounded-2xl shadow-xl z-50 flex items-center space-x-3 border-l-4 border-[#14B8A6] animate-fade-in max-w-sm">
          <span className="text-lg">💾</span>
          <span className="text-xs font-bold leading-snug">{saveLaterNotification}</span>
        </div>
      )}

      {/* CONTENEDOR CENTRAL */}
      <main className="flex-1 w-full max-w-xl mx-auto px-4 py-8 flex flex-col justify-center">
        
        {/* TARJETA DE ONBOARDING PRINCIPAL */}
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xl p-6 sm:p-10 space-y-6">
          
          {/* BARRA DE PROGRESO PREMIUM (AJUSTADO A 4 PASOS) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-400">
              <span>Paso {currentStep} de 4</span>
              <span>{Math.round(currentStep * 25)}% completado</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#14B8A6] transition-all duration-500 rounded-full"
                style={{ width: `${currentStep * 25}%` }}
              />
            </div>
          </div>

          {/* PASO 1: AUTENTICACIÓN GOOGLE */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-2">
                <span className="inline-flex p-3 bg-teal-50 rounded-full text-[#14B8A6] text-xl">🔑</span>
                <h1 className="text-xl sm:text-2xl font-black text-[#1E3A5F] tracking-tight">¡Bienvenido, {activeProfile.name}!</h1>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">Asociaremos tu cuenta de anfitrión a tus credenciales seguras de Google.</p>
              </div>

              <div className="bg-[#F5F7FA] rounded-2xl p-4 border border-slate-200/40 flex items-center space-x-4">
                <img src={activeProfile.picture} alt={activeProfile.name} className="w-12 h-12 rounded-full border border-white" />
                <div>
                  <h3 className="font-extrabold text-sm text-[#1E3A5F]">{activeProfile.name}</h3>
                  <p className="text-xs text-slate-500 font-semibold">{activeProfile.email}</p>
                  <span className="inline-flex items-center space-x-1 text-[#14B8A6] text-[10px] font-bold mt-1">
                    <span>✓</span>
                    <span>Verificado por Google</span>
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 font-medium">
                Tu cuenta de RecreaHub será creada utilizando este perfil de Google verificado.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button 
                  onClick={() => setCurrentStep(2)}
                  className="flex-1 bg-[#1E3A5F] hover:bg-[#1E3A5F]/95 text-[#14B8A6] font-extrabold py-3.5 px-6 rounded-2xl text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  <span>Continuar como {activeProfile.name}</span>
                  <span>➔</span>
                </button>
                <button 
                  onClick={() => setShowAccountSelector(true)}
                  className="bg-white border border-slate-200 hover:border-slate-300 text-slate-500 font-bold py-3.5 px-6 rounded-2xl text-xs transition-colors"
                >
                  Cambiar cuenta
                </button>
              </div>
            </div>
          )}

          {/* PASO 2: VERIFICACIÓN DE TELÉFONO */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fade-in">
              {phoneStep === 'input' ? (
                <form onSubmit={handlePhoneSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <span className="inline-flex p-3 bg-teal-50 rounded-full text-[#14B8A6] text-xl">📱</span>
                    <h1 className="text-xl sm:text-2xl font-black text-[#1E3A5F] tracking-tight">Verifica tu Teléfono</h1>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed">Confirma tu número móvil para coordinar reservaciones e incidencias de forma segura.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Número Celular</label>
                    <div className="flex space-x-2">
                      <select 
                        value={countryCode} 
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="bg-[#F5F7FA] border border-slate-200 rounded-xl px-3 py-3 text-xs font-bold focus:ring-2 focus:ring-[#14B8A6] focus:outline-none"
                      >
                        {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                      </select>
                      <input 
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                        placeholder="0991234567"
                        className="flex-1 bg-[#F5F7FA] border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-[#14B8A6] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 flex items-start space-x-3 text-[11px] text-slate-500 leading-relaxed font-semibold">
                    <span className="text-lg">💡</span>
                    <span>Este número de celular será utilizado únicamente para notificaciones de emergencia y confirmación de reservas.</span>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setCurrentStep(1)} className="w-1/3 bg-white border border-slate-200 hover:border-slate-300 text-slate-500 font-bold py-3.5 rounded-2xl text-xs transition-colors">Atrás</button>
                    <button type="submit" className="flex-1 bg-[#1E3A5F] text-[#14B8A6] font-extrabold py-3.5 rounded-2xl text-xs tracking-wider uppercase shadow-md hover:bg-[#1E3A5F]/95 transition-all">Enviar Código</button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6 animate-fade-in">
                  <div className="space-y-2">
                    <span className="inline-flex p-3 bg-teal-50 rounded-full text-[#14B8A6] text-xl">✉</span>
                    <h1 className="text-xl sm:text-2xl font-black text-[#1E3A5F] tracking-tight">Ingresar Código</h1>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed">Ingresa el código OTP enviado al {countryCode} {phoneNumber}. Puedes usar el código de prueba <strong>123456</strong>.</p>
                  </div>

                  <div className="flex justify-between space-x-2">
                    {otpCode.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => { otpRefs.current[index] = el; }}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className={`w-12 h-14 text-center text-xl font-black rounded-xl border bg-[#F5F7FA] focus:outline-none focus:ring-2 focus:ring-[#14B8A6] transition-all ${
                          otpStatus === 'error' ? 'border-red-300 ring-2 ring-red-100 bg-red-50/20 text-red-700' : 'border-slate-200'
                        }`}
                      />
                    ))}
                  </div>

                  {otpStatus === 'validando' && (
                    <p className="text-xs text-slate-400 font-semibold animate-pulse text-center">Validando código de seguridad...</p>
                  )}

                  {otpStatus === 'validado' && (
                    <div className="bg-emerald-50 text-emerald-800 p-3 rounded-2xl border border-emerald-100 text-[11px] font-bold">
                      ¡Número verificado correctamente! Ya puedes continuar con tu registro.
                    </div>
                  )}

                  {otpStatus === 'error' && (
                    <div className="bg-red-50 text-red-700 p-3 rounded-2xl border border-red-100 text-[11px] font-bold">
                      Código incorrecto. Intenta nuevamente con 123456 o solicita uno nuevo.
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs font-semibold text-slate-400 px-1">
                    <span>¿No lo recibiste?</span>
                    {countdown > 0 ? (
                      <span>Reenviar código en {countdown}s</span>
                    ) : (
                      <button type="button" onClick={() => setCountdown(30)} className="text-[#14B8A6] hover:underline font-bold">Reenviar código ahora</button>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setPhoneStep('input')} className="w-1/3 bg-white border border-slate-200 hover:border-slate-300 text-slate-500 font-bold py-3.5 rounded-2xl text-xs transition-colors">Editar celular</button>
                    <button 
                      onClick={() => setCurrentStep(3)}
                      disabled={otpStatus !== 'validado'}
                      className={`flex-1 font-extrabold py-3.5 rounded-2xl text-xs tracking-wider uppercase shadow-md transition-all ${
                        otpStatus === 'validado' ? 'bg-[#1E3A5F] text-[#14B8A6] hover:bg-[#1E3A5F]/95' : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                      }`}
                    >
                      Siguiente Paso ➔
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PASO 3: PERFIL DEL ANFITRIÓN */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-2">
                <span className="inline-flex p-3 bg-teal-50 rounded-full text-[#14B8A6] text-xl">👤</span>
                <h1 className="text-xl sm:text-2xl font-black text-[#1E3A5F] tracking-tight">Perfil de Anfitrión</h1>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  Completa tu información básica de propietario para habilitar el listado de tus propiedades en el marketplace de recreación.
                </p>
              </div>

              <form onSubmit={handleStep3Submit} className="space-y-5">
                <div className="bg-[#F5F7FA] p-4 rounded-2xl border border-slate-200/50 grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
                  <span className="absolute top-2.5 right-3 text-[9px] font-black text-slate-400 flex items-center space-x-1 uppercase tracking-wider">
                    <span>🔒</span>
                    <span>Perfil de Google</span>
                  </span>

                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Nombre</label>
                    <input 
                      type="text" 
                      readOnly 
                      value={activeProfile.name} 
                      className="w-full bg-slate-100 border border-slate-200/60 rounded-xl px-3 py-2 text-xs font-bold text-slate-500 cursor-not-allowed outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Correo Electrónico</label>
                    <input 
                      type="text" 
                      readOnly 
                      value={activeProfile.email} 
                      className="w-full bg-slate-100 border border-slate-200/60 rounded-xl px-3 py-2 text-xs font-bold text-slate-500 cursor-not-allowed outline-none truncate"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Apellidos Completos</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Mendoza Silva"
                      value={apellidos}
                      onChange={(e) => setApellidos(e.target.value)}
                      className="w-full bg-[#F5F7FA] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-[#14B8A6]/20 focus:border-[#14B8A6] focus:outline-none text-[#1F2937] transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative">
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Identificación (Cédula/RUC)</label>
                        <button 
                          type="button" 
                          onClick={() => setShowIDHelp(!showIDHelp)}
                          className="text-[10px] text-[#14B8A6] hover:text-[#1E3A5F] font-bold w-4 h-4 rounded-full bg-teal-50 flex items-center justify-center border border-teal-100 transition-colors"
                        >
                          ?
                        </button>
                      </div>

                      {showIDHelp && (
                        <div className="absolute z-20 bg-white p-4 rounded-2xl border border-slate-200 shadow-xl text-[11px] text-slate-600 leading-relaxed -top-32 left-0 right-0 animate-scale-up">
                          <p className="font-extrabold text-[#1E3A5F] mb-1">🛡 Verificación Fiscal & Legal</p>
                          Utilizamos este identificador para comprobar la validez de los anfitriones y asegurar tus futuras transferencias bancarias de forma legal. No solicitaremos fotos físicas del documento en este momento.
                        </div>
                      )}

                      <input 
                        type="text" 
                        required
                        placeholder="0987654321001"
                        value={identificacion}
                        onChange={(e) => setIdentificacion(e.target.value.replace(/\D/g, ""))}
                        className="w-full bg-[#F5F7FA] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-[#14B8A6]/20 focus:border-[#14B8A6] focus:outline-none text-[#1F2937] transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Fecha de Nacimiento</label>
                      <input 
                        type="date" 
                        required
                        value={fechaNacimiento}
                        onChange={(e) => setFechaNacimiento(e.target.value)}
                        className="w-full bg-[#F5F7FA] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-[#14B8A6]/20 focus:border-[#14B8A6] focus:outline-none text-[#1F2937] transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Provincia de Residencia</label>
                      <select 
                        value={provincia}
                        onChange={(e) => setProvincia(e.target.value)}
                        className="w-full bg-[#F5F7FA] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-[#14B8A6]/20 focus:border-[#14B8A6] focus:outline-none text-[#1F2937] cursor-pointer"
                      >
                        {REGIONES_ECUADOR.map(r => (
                          <option key={r.nombre} value={r.nombre}>{r.nombre}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Ciudad</label>
                      <select 
                        value={ciudad}
                        onChange={(e) => setCiudad(e.target.value)}
                        className="w-full bg-[#F5F7FA] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-[#14B8A6]/20 focus:border-[#14B8A6] focus:outline-none text-[#1F2937] cursor-pointer"
                      >
                        {ciudadesDisponibles.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-[#1E3A5F]/5 rounded-2xl border-l-4 border-[#14B8A6] p-4 space-y-1.5 text-xs text-[#1E3A5F] leading-relaxed font-semibold">
                  <div className="flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-wider text-[#14B8A6]">
                    <span>🔒</span>
                    <span>Verificación de Identidad Diferida</span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                    No solicitaremos que cargues fotos físicas de tus documentos de identidad en esta fase. Podrás completar la verificación formal más adelante desde tu panel de control para habilitar tus reservas de forma oficial.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-slate-100">
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full sm:flex-1 bg-[#1E3A5F] hover:bg-[#1E3A5F]/95 text-[#14B8A6] font-extrabold py-3.5 px-6 rounded-2xl text-xs tracking-wider uppercase shadow-md transition-all flex items-center justify-center space-x-2 active:scale-98"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-[#14B8A6]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <span>Guardar y continuar</span>
                        <span>➔</span>
                      </>
                    )}
                  </button>

                  <button 
                    type="button"
                    onClick={handleSaveLater}
                    className="w-full sm:w-auto bg-white border border-slate-200 hover:border-slate-300 text-slate-500 font-bold py-3.5 px-6 rounded-2xl text-xs transition-colors"
                  >
                    Guardar para después
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* PASO 4: PANTALLA DE FINALIZACIÓN DEL ONBOARDING */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Encabezado Exitoso */}
              <div className="text-center space-y-3 pb-2">
                <div className="inline-flex p-4 bg-teal-50 rounded-full text-[#14B8A6] text-3xl animate-bounce shadow-xs">
                  🎉
                </div>
                <h1 className="text-2xl font-black text-[#1E3A5F] tracking-tight">
                  ¡Onboarding Completado!
                </h1>
                <p className="text-xs text-slate-500 font-bold max-w-sm mx-auto leading-relaxed">
                  Ya puedes comenzar a crear y administrar tus espacios.
                </p>
              </div>

              {/* Grid de Estado: Nivel de Confianza y Beneficios */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Lado Izquierdo: Nivel de Confianza y Desbloqueados */}
                <div className="bg-[#1E3A5F]/5 rounded-2xl p-4 border border-slate-100 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Estado de Cuenta</span>
                      <span className="bg-[#14B8A6]/10 text-[#14B8A6] text-[9px] font-extrabold px-2 py-0.5 rounded-full">Provisional</span>
                    </div>
                    
                    <h4 className="text-xs font-black text-[#1E3A5F] uppercase mb-2">Nivel de Confianza: 60%</h4>
                    
                    <div className="w-full h-2 bg-slate-200/60 rounded-full overflow-hidden mb-4">
                      <div className="h-full bg-[#14B8A6] rounded-full" style={{ width: '60%' }}></div>
                    </div>
                  </div>

                  <div className="space-y-2 mt-2">
                    <span className="text-[9px] font-black text-[#14B8A6] uppercase tracking-widest block">Beneficios Desbloqueados</span>
                    <ul className="space-y-1.5 text-[11px] font-bold text-slate-600">
                      <li className="flex items-center space-x-1.5">
                        <span className="text-[#14B8A6] text-xs">✓</span>
                        <span>Crear espacios</span>
                      </li>
                      <li className="flex items-center space-x-1.5">
                        <span className="text-[#14B8A6] text-xs">✓</span>
                        <span>Publicar espacios</span>
                      </li>
                      <li className="flex items-center space-x-1.5">
                        <span className="text-[#14B8A6] text-xs">✓</span>
                        <span>Gestionar disponibilidad</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Lado Derecho: Beneficios Bloqueados */}
                <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Requisitos de Activación</span>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-semibold mb-3">
                      Completa las verificaciones pendientes para activar tu cuenta comercial.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[9px] font-black text-red-500 uppercase tracking-widest block">Beneficios Bloqueados</span>
                    <ul className="space-y-1.5 text-[11px] font-bold text-slate-400">
                      <li className="flex items-center space-x-1.5">
                        <span className="text-slate-400">🔒</span>
                        <span>Recibir reservas</span>
                      </li>
                      <li className="flex items-center space-x-1.5">
                        <span className="text-slate-400">🔒</span>
                        <span>Procesar pagos</span>
                      </li>
                      <li className="flex items-center space-x-1.5">
                        <span className="text-slate-400">🔒</span>
                        <span>Insignia de verificado</span>
                      </li>
                    </ul>
                  </div>
                </div>

              </div>

              {/* Listas de Tareas: Completadas vs Pendientes */}
              <div className="border border-slate-200/60 rounded-2xl p-4 bg-white grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Checklist Completado */}
                <div className="space-y-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Verificaciones Listas</span>
                  <ul className="space-y-1.5 text-[11px] font-bold text-slate-600">
                    <li className="flex items-center space-x-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-extrabold">✓</span>
                      <span>Cuenta creada</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-extrabold">✓</span>
                      <span>Correo validado</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-extrabold">✓</span>
                      <span>Teléfono validado</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-extrabold">✓</span>
                      <span>Perfil completado</span>
                    </li>
                  </ul>
                </div>

                {/* Checklist Pendiente (Puedes agregar negocio después) */}
                <div className="space-y-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Tareas Pendientes</span>
                  <ul className="space-y-1.5 text-[11px] font-bold text-slate-500">
                    <li className="flex items-center space-x-2">
                      <span className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[10px]">○</span>
                      <span>Verificación biométrica</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[10px]">○</span>
                      <span>Registra tu primer espacio</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[10px]">○</span>
                      <span>Verificación de propiedad</span>
                    </li>
                  </ul>
                </div>

              </div>

              {/* Botón de Acción Principal */}
              <div className="pt-2 border-t border-slate-100">
                <button 
                  onClick={() => setIsOnboardingSuccess(true)}
                  className="w-full bg-[#1E3A5F] hover:bg-[#1E3A5F]/95 text-[#14B8A6] font-extrabold py-3.5 px-6 rounded-2xl text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center space-x-2 active:scale-98"
                >
                  <span>Ir al Dashboard</span>
                  <span>➔</span>
                </button>
                <span className="block text-[9px] text-slate-400 text-center font-semibold mt-2">
                  Podrás registrar y vincular tu negocio o empresa de forma legal más tarde.
                </span>
              </div>

            </div>
          )}

        </div>

        {/* NAVEGADOR DE PRUEBA (DEBUG MODE EN LA BASE) */}
        <div className="mt-8 bg-white border border-slate-200/60 rounded-2xl p-3 flex items-center justify-between shadow-xs">
          <span className="text-[9px] font-black text-[#1E3A5F] uppercase tracking-widest">Navegación de prueba:</span>
          <div className="flex space-x-1">
            {[1, 2, 3, 4].map((step) => (
              <button
                key={step}
                onClick={() => setCurrentStep(step)}
                className={`w-6 h-6 rounded-lg text-[10px] font-bold transition-all ${
                  currentStep === step 
                    ? 'bg-[#1E3A5F] text-[#14B8A6]' 
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {step}
              </button>
            ))}
          </div>
        </div>

      </main>

      {/* PIE DE PÁGINA */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400 font-medium shrink-0">
        <div className="max-w-xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <span>© 2026 RecreaHub. Todos los derechos reservados.</span>
          <div className="flex space-x-6">
            <span className="hover:text-[#1E3A5F] cursor-pointer">Privacidad</span>
            <span className="hover:text-[#1E3A5F] cursor-pointer">Seguridad</span>
          </div>
        </div>
      </footer>

      {/* SELECTOR DE CUENTAS DE GOOGLE */}
      {showAccountSelector && (
        <div className="fixed inset-0 bg-[#1E3A5F]/40 backdrop-blur-xs flex items-center justify-center p-6 z-50 animate-fade-in">
          <div className="absolute inset-0" onClick={() => setShowAccountSelector(false)}></div>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 w-full max-w-sm relative z-10 animate-scale-up">
            <div className="text-center space-y-2 mb-6">
              <h3 className="text-md font-black text-[#1E3A5F]">Selecciona una cuenta</h3>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">para continuar con tu registro</p>
            </div>
            <div className="space-y-2 mb-4">
              {SAMPLE_ACCOUNTS.map((profile, index) => (
                <div 
                  key={index}
                  onClick={() => handleSelectAccount(profile)}
                  className={`flex items-center space-x-3 p-2.5 rounded-2xl border cursor-pointer transition-all ${
                    activeProfile.email === profile.email ? 'border-[#14B8A6] bg-teal-50/40' : 'border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  <img src={profile.picture} alt={profile.name} className="w-8 h-8 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#1E3A5F] truncate">{profile.name}</p>
                    <p className="text-[10px] text-slate-400 truncate font-medium">{profile.email}</p>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowAccountSelector(false)} className="w-full bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold py-2.5 rounded-xl text-xs transition-colors">Cancelar</button>
          </div>
        </div>
      )}

      {/* MODAL DE ÉXITO FINAL */}
      {isOnboardingSuccess && (
        <div className="fixed inset-0 bg-[#1E3A5F] z-50 flex flex-col items-center justify-center p-6 text-white text-center">
          <div className="w-20 h-20 bg-[#14B8A6]/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
            <svg className="w-12 h-12 text-[#14B8A6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-black mb-2">¡Redireccionando al Portal!</h3>
          <p className="text-sm text-teal-200 mb-6 max-w-xs leading-relaxed font-medium">
            ¡Acceso autorizado! Has ingresado con éxito al panel administrativo de RecreaHub con tu cuenta de anfitrión provisional.
          </p>
          <button 
            onClick={() => { setIsOnboardingSuccess(false); }}
            className="px-6 py-3.5 bg-[#14B8A6] hover:bg-[#14B8A6]/90 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-all"
          >
            Entrar al Portal
          </button>
        </div>
      )}

    </div>
  );
}
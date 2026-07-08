import React, { useState } from 'react';
import { 
  Home, CalendarDays, MapPin, Users, BarChart3, Settings, 
  Search, Bell, DollarSign, Clock, Calendar as CalendarIcon, 
  Tag, Info, Plus, Copy, Edit2, Trash2, Check, AlertCircle, ChevronDown, Eye
} from 'lucide-react';

type Modality = {
  id: string;
  name: string;
  active: boolean;
  price: number;
  currency: string;
  description: string;
};

export default function GestionTarifas() {
  const [selectedSpace, setSelectedSpace] = useState('Cancha Sintética 1');
  
  // States para la vista previa interactiva
  const [basePrice, setBasePrice] = useState(25);
  const [dailyRates, setDailyRates] = useState([
    { day: 'Lunes', price: 25 },
    { day: 'Martes', price: 25 },
    { day: 'Miércoles', price: 25 },
    { day: 'Jueves', price: 25 },
    { day: 'Viernes', price: 30 },
    { day: 'Sábado', price: 35 },
    { day: 'Domingo', price: 35 },
  ]);

  const [modalities, setModalities] = useState<Modality[]>([
    { id: 'hour', name: 'Precio por hora', active: true, price: 25, currency: 'USD', description: 'Tarifa base para reservas cortas' },
    { id: 'day', name: 'Precio por jornada', active: false, price: 100, currency: 'USD', description: 'Bloque de 5 horas continuas' },
    { id: 'event', name: 'Precio por evento', active: false, price: 300, currency: 'USD', description: 'Reserva exclusiva por todo el día' }
  ]);

  const copyToAll = () => {
    const newRates = dailyRates.map(rate => ({ ...rate, price: dailyRates[0].price }));
    setDailyRates(newRates);
  };

  const handleDailyPriceChange = (index: number, value: number) => {
    const newRates = [...dailyRates];
    newRates[index].price = value;
    setDailyRates(newRates);
  };

  const toggleModality = (id: string) => {
    setModalities(modalities.map(m => m.id === id ? { ...m, active: !m.active } : m));
  };

  return (
    <div className="flex h-screen bg-[#F5F7FA] font-sans text-[#1F2937] overflow-hidden">
      
      {/* Sidebar (Mantenido del Portal) */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden lg:flex flex-col h-full sticky top-0 z-20">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[#487AD0] flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
            <span className="text-xl font-bold tracking-tight text-[#1F2937]">Agora</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {[
            { icon: Home, label: 'Dashboard' },
            { icon: CalendarDays, label: 'Disponibilidad' },
            { icon: DollarSign, label: 'Tarifas', active: true },
            { icon: MapPin, label: 'Mis Espacios' },
            { icon: Users, label: 'Clientes' },
            { icon: BarChart3, label: 'Reportes' },
          ].map((item, idx) => (
            <a key={idx} href="#" className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${item.active ? 'bg-[#487AD0]/10 text-[#487AD0]' : 'hover:bg-gray-50 text-[#6B7280] hover:text-[#1F2937]'}`}>
              <item.icon size={18} className={item.active ? 'text-[#487AD0]' : 'text-gray-400'} />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        
        {}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8 shrink-0 z-10">
          <div className="flex items-center bg-[#F5F7FA] rounded-md px-3 py-2 w-96 border border-transparent focus-within:border-[#487AD0]/30 focus-within:bg-white transition-colors">
            <Search size={16} className="text-gray-400 mr-2" />
            <input type="text" placeholder="Buscar..." className="bg-transparent border-none outline-none w-full text-sm text-[#1F2937] placeholder-gray-400" />
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-gray-400 hover:text-[#1F2937] transition-colors relative">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#8F0E55] rounded-full border border-white"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-[#487AD0] text-white flex items-center justify-center font-medium text-sm shadow-sm cursor-pointer hover:bg-[#3A6BB8] transition-colors">
              KR
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto flex">
          
          {}
          <div className="flex-1 p-8 max-w-4xl border-r border-gray-200">
            
            {/* Header de la pantalla */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <div>
                <h1 className="text-2xl font-bold text-[#1F2937] tracking-tight">Gestión de Tarifas</h1>
                <p className="text-[#6B7280] mt-1 text-sm">Configura los precios y promociones de tus espacios.</p>
              </div>
              <button className="flex items-center px-5 py-2.5 bg-[#487AD0] text-white rounded-lg text-sm font-medium hover:bg-[#3A6BB8] transition-colors shadow-[0_4px_12px_rgba(72,122,208,0.25)]">
                <Check size={16} className="mr-2" />
                Guardar cambios
              </button>
            </div>

            {/* Selector de Espacio */}
            <div className="bg-white p-4 rounded-xl shadow-[0_4px_20px_-2px_rgba(31,41,55,0.05)] border border-gray-100 mb-8 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#F5F7FA] rounded-lg flex items-center justify-center text-[#6B7280]">
                  <MapPin size={24} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1">Espacio Seleccionado</p>
                  <div className="relative">
                    <select 
                      className="appearance-none bg-transparent font-bold text-lg text-[#1F2937] pr-8 cursor-pointer outline-none focus:text-[#487AD0]"
                      value={selectedSpace}
                      onChange={(e) => setSelectedSpace(e.target.value)}
                    >
                      <option>Cancha Sintética 1</option>
                      <option>Piscina Familiar</option>
                      <option>Salón Principal</option>
                    </select>
                    <ChevronDown size={18} className="absolute right-0 top-1 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-[#27AE60]/10 text-[#27AE60]">
                  Activo
                </span>
                <p className="text-sm text-[#6B7280] mt-1">Capacidad: 14 personas</p>
              </div>
            </div>

            {}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-[#1F2937] mb-4">Modalidades de Cobro</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {modalities.map((modality) => (
                  <div key={modality.id} className={`bg-white p-5 rounded-xl border transition-all ${modality.active ? 'border-[#487AD0]/30 shadow-md' : 'border-gray-100 shadow-[0_4px_20px_-2px_rgba(31,41,55,0.05)] opacity-70 hover:opacity-100'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 bg-[#F5F7FA] rounded-lg text-[#487AD0]">
                        {modality.id === 'hour' ? <Clock size={18} /> : modality.id === 'day' ? <CalendarIcon size={18} /> : <Users size={18} />}
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={modality.active} onChange={() => toggleModality(modality.id)} />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#487AD0]"></div>
                      </label>
                    </div>
                    <h3 className="font-semibold text-[#1F2937] text-sm mb-1">{modality.name}</h3>
                    <p className="text-xs text-[#6B7280] mb-4 line-clamp-2 min-h-[32px]">{modality.description}</p>
                    
                    {modality.active ? (
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-[#6B7280] font-medium">$</span>
                        <input 
                          type="number" 
                          value={modality.id === 'hour' ? basePrice : modality.price} 
                          onChange={(e) => modality.id === 'hour' && setBasePrice(Number(e.target.value))}
                          className="w-full bg-[#F5F7FA] border border-transparent rounded-lg py-2 pl-7 pr-3 text-[#1F2937] font-semibold text-sm focus:border-[#487AD0] focus:ring-1 focus:ring-[#487AD0] outline-none transition-all" 
                        />
                      </div>
                    ) : (
                      <div className="h-[38px] bg-gray-50 rounded-lg flex items-center px-3 text-sm text-gray-400 italic">Desactivado</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#1F2937]">Tarifa por hora según el día</h2>
                <button onClick={copyToAll} className="flex items-center text-sm font-medium text-[#487AD0] hover:text-[#3A6BB8] transition-colors bg-[#487AD0]/10 px-3 py-1.5 rounded-lg">
                  <Copy size={14} className="mr-1.5" /> Copiar Lunes a todos
                </button>
              </div>
              <div className="bg-white rounded-xl shadow-[0_4px_20px_-2px_rgba(31,41,55,0.05)] border border-gray-100 overflow-hidden">
                <div className="grid grid-cols-7 gap-px bg-gray-100">
                  {dailyRates.map((rate, idx) => (
                    <div key={rate.day} className="bg-white p-4 flex flex-col items-center">
                      <span className={`text-xs font-semibold uppercase mb-3 ${['Sábado', 'Domingo'].includes(rate.day) ? 'text-[#8F0E55]' : 'text-[#6B7280]'}`}>{rate.day.slice(0,3)}</span>
                      <div className="relative w-full">
                        <span className="absolute left-2 top-1.5 text-gray-400 text-sm">$</span>
                        <input 
                          type="number" 
                          value={rate.price} 
                          onChange={(e) => handleDailyPriceChange(idx, Number(e.target.value))}
                          className={`w-full bg-[#F5F7FA] border-transparent rounded-lg py-1.5 pl-6 pr-2 text-center text-sm font-medium outline-none transition-all focus:border-[#487AD0] focus:ring-1 focus:ring-[#487AD0] ${rate.price !== basePrice ? 'text-[#8F0E55] bg-[#8F0E55]/5 font-bold' : 'text-[#1F2937]'}`} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
              
              {/* Tarifas Especiales */}
              <div className="bg-white rounded-xl shadow-[0_4px_20px_-2px_rgba(31,41,55,0.05)] border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-base font-bold text-[#1F2937]">Fechas Especiales</h3>
                    <p className="text-xs text-[#6B7280] mt-0.5">Feriados o temporada alta.</p>
                  </div>
                  <button className="p-1.5 bg-[#487AD0]/10 text-[#487AD0] hover:bg-[#487AD0]/20 rounded-lg transition-colors">
                    <Plus size={16} />
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="group flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:border-gray-200 bg-[#F5F7FA]/50 transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-[#1F2937]">Feriado Nacional</p>
                      <p className="text-xs text-[#6B7280] mt-0.5">25 Dic 2026 • Fijo: $45/hr</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-gray-400 hover:text-[#487AD0]"><Edit2 size={14}/></button>
                      <button className="p-1.5 text-gray-400 hover:text-[#EF4444]"><Trash2 size={14}/></button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Promociones */}
              <div className="bg-white rounded-xl shadow-[0_4px_20px_-2px_rgba(31,41,55,0.05)] border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-base font-bold text-[#1F2937]">Promociones</h3>
                    <p className="text-xs text-[#6B7280] mt-0.5">Descuentos y ofertas activas.</p>
                  </div>
                  <button className="p-1.5 bg-[#8F0E55]/10 text-[#8F0E55] hover:bg-[#8F0E55]/20 rounded-lg transition-colors">
                    <Plus size={16} />
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="group flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:border-gray-200 bg-[#F5F7FA]/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#8F0E55]/10 flex items-center justify-center text-[#8F0E55]">
                        <Tag size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1F2937]">Early Bird Mensual</p>
                        <p className="text-xs text-[#6B7280] mt-0.5">-10% res. con 30 días ant.</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-7 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#8F0E55]"></div>
                    </label>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {}
          {/* Columna Derecha: Live Preview (Sticky panel) */}
          <div className="w-80 bg-white border-l border-gray-200 p-6 shadow-xl z-10 flex flex-col hidden xl:flex">
            <h3 className="text-sm font-bold text-[#1F2937] uppercase tracking-wider mb-6 flex items-center">
              <Eye className="mr-2 text-gray-400" size={16} />
              Vista Previa Cliente
            </h3>

            <div className="bg-[#F5F7FA] rounded-2xl p-5 border border-gray-100 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.05)] relative overflow-hidden">
              {/* Decoración superior tipo "ticket" */}
              <div className="absolute top-0 left-0 w-full h-1 bg-[#487AD0]"></div>
              
              <div className="text-center mb-6 pt-2">
                <span className="inline-block px-2 py-1 bg-white border border-gray-200 rounded text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-2">Simulación de cobro</span>
                <h4 className="font-bold text-[#1F2937] text-lg">{selectedSpace}</h4>
                <p className="text-xs text-[#6B7280]">Reserva de ejemplo (2 horas)</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#6B7280]">Tarifa base / hr</span>
                  <span className="font-medium text-[#1F2937]">${basePrice.toFixed(2)}</span>
                </div>
                
                {/* Lógica condicional simulada para mostrar ajustes si el Sábado es diferente */}
                {dailyRates[5].price !== basePrice && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#6B7280] flex items-center">
                      Ajuste Fin de semana
                      <Info size={12} className="ml-1 text-gray-400" />
                    </span>
                    <span className="font-medium text-[#8F0E55]">
                      +${(dailyRates[5].price - basePrice).toFixed(2)} / hr
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between items-center text-sm text-[#27AE60]">
                  <span className="flex items-center">
                    <Tag size={12} className="mr-1" /> Early Bird (10%)
                  </span>
                  <span>-${((dailyRates[5].price * 2) * 0.1).toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 border-dashed">
                <div className="flex justify-between items-end">
                  <span className="font-semibold text-[#1F2937]">Total (Sábado)</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-[#487AD0]">
                      ${((dailyRates[5].price * 2) * 0.9).toFixed(2)}
                    </span>
                    <p className="text-[10px] text-gray-400">Impuestos incluidos</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-[#3B82F6]/10 rounded-xl p-4 border border-[#3B82F6]/20">
              <div className="flex items-start gap-3">
                <AlertCircle size={16} className="text-[#3B82F6] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-[#3B82F6] uppercase mb-1">Tip de estrategia</h4>
                  <p className="text-xs text-[#1F2937]">Tu tarifa de fin de semana es <strong>{Math.round(((dailyRates[5].price / basePrice) - 1) * 100)}% más alta</strong> que la tarifa base. ¡Excelente para maximizar ganancias!</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
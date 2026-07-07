import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Settings, 
  Search, 
  Bell, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Filter, 
  LayoutGrid, 
  X, 
  Edit3, 
  Lock, 
  Unlock,
  AlertCircle,
  CheckCircle2,
  Users,
  Home,
  BarChart3,
  MapPin,
  MoreVertical,
  CalendarDays
} from 'lucide-react';

// --- Types ---
type ViewMode = 'semana' | 'recursos';
type Status = 'Disponible' | 'Reservado' | 'Bloqueado' | 'Mantenimiento' | 'No disponible';

interface Block {
  id: string;
  day: number;
  hour: number;
  status: Status;
  space: string;
  client?: string;
  notes?: string;
}

// --- Mock Data ---
const SPACES = ['Todos', 'Cancha Sintética 1', 'Cancha Múltiple', 'Piscina Olímpica', 'Salón de Eventos VIP', 'Área de Camping'];
const HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 8:00 to 18:00
const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const getStatusStyles = (status: Status) => {
  switch (status) {
    case 'Disponible': return 'bg-white border-gray-200 hover:border-[#487AD0] hover:shadow-sm group';
    case 'Reservado': return 'bg-[#487AD0] text-white shadow-sm hover:bg-[#3A6BB8]';
    case 'Bloqueado': return 'bg-gray-100 text-[#6B7280] border-gray-200 hover:bg-gray-200';
    case 'Mantenimiento': return 'bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B] hover:bg-[#F59E0B]/20';
    case 'No disponible': return 'bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444] hover:bg-[#EF4444]/20';
    default: return 'bg-white';
  }
};

const generateBlocks = (): Block[] => {
  const blocks: Block[] = [];
  HOURS.forEach(hour => {
    DAYS.forEach((_, dayIdx) => {
      const rand = Math.random();
      let status: Status = 'Disponible';
      let client;
      let notes;
      let space = SPACES[Math.floor(Math.random() * (SPACES.length - 1)) + 1];

      if (rand > 0.85) {
        status = 'Reservado';
        client = ['Carlos Mendoza', 'Ana Torres', 'Equipo Tech', 'Familia Ruiz'][Math.floor(Math.random() * 4)];
      } else if (rand > 0.75) { status = 'Bloqueado'; notes = 'Reserva pendiente de pago'; }
      else if (rand > 0.7) { status = 'Mantenimiento'; notes = 'Limpieza de filtros'; }
      
      blocks.push({ id: `${dayIdx}-${hour}`, day: dayIdx, hour, status, space, client, notes });
    });
  });
  return blocks;
};

export default function DisponibilidadAdmin() {
  const [viewMode, setViewMode] = useState<ViewMode>('semana');
  const [selectedSpace, setSelectedSpace] = useState('Todos');
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [blocks] = useState<Block[]>(generateBlocks());

  return (
    <div className="flex h-screen bg-[#F5F7FA] font-sans text-[#1F2937] overflow-hidden">
      
      {/* Sidebar */}
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
            { icon: CalendarDays, label: 'Disponibilidad', active: true },
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
        <div className="p-4 border-t border-gray-100">
          <a href="#" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 text-[#6B7280]">
            <Settings size={18} className="text-gray-400" />
            <span>Configuración</span>
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8 shrink-0 z-10">
          <div className="flex items-center bg-[#F5F7FA] rounded-md px-3 py-2 w-96 border border-transparent focus-within:border-[#487AD0]/30 focus-within:bg-white transition-colors">
            <Search size={16} className="text-gray-400 mr-2" />
            <input type="text" placeholder="Buscar reservas, clientes o espacios..." className="bg-transparent border-none outline-none w-full text-sm text-[#1F2937] placeholder-gray-400" />
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-400 hover:text-[#1F2937] transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#8F0E55] rounded-full border border-white"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-[#487AD0] text-white flex items-center justify-center font-medium text-sm shadow-sm cursor-pointer">
              KR
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#1F2937] tracking-tight">Disponibilidad</h1>
              <p className="text-[#6B7280] mt-1 text-sm">Gestiona horarios, bloqueos y reservas de todos tus espacios.</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-[0_2px_4px_rgba(0,0,0,0.02)] text-[#1F2937]">
                <AlertCircle size={16} className="mr-2 text-gray-400" />
                Agregar excepción
              </button>
              <button className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-[0_2px_4px_rgba(0,0,0,0.02)] text-[#1F2937]">
                <Lock size={16} className="mr-2 text-gray-400" />
                Bloquear horario
              </button>
              <button className="flex items-center px-4 py-2 bg-[#487AD0] text-white rounded-lg text-sm font-medium hover:bg-[#3A6BB8] transition-colors shadow-[0_4px_12px_rgba(72,122,208,0.25)]">
                <Plus size={16} className="mr-2" />
                Crear disponibilidad
              </button>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Horas Disponibles', value: '142h', trend: '+12% vs sem pasada', icon: CheckCircle2, color: 'text-[#27AE60]' },
              { label: 'Horas Reservadas', value: '86h', trend: '+5% vs sem pasada', icon: Calendar, color: 'text-[#487AD0]' },
              { label: 'Horas Bloqueadas', value: '12h', trend: '-2h vs sem pasada', icon: Lock, color: 'text-[#6B7280]' },
              { label: 'Ocupación', value: '64%', trend: '+3% vs sem pasada', icon: BarChart3, color: 'text-[#8F0E55]' },
            ].map((kpi, idx) => (
              <div key={idx} className="bg-white p-5 rounded-xl shadow-[0_4px_20px_-2px_rgba(31,41,55,0.05)] border border-gray-100/50">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm text-[#6B7280] font-medium">{kpi.label}</p>
                  <kpi.icon size={18} className={kpi.color} />
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-[#1F2937]">{kpi.value}</p>
                </div>
                <p className="text-xs text-gray-400 mt-1">{kpi.trend}</p>
              </div>
            ))}
          </div>

          {/* Toolbar / Filters */}
          <div className="bg-white p-2 rounded-xl shadow-[0_4px_20px_-2px_rgba(31,41,55,0.05)] border border-gray-100/50 mb-6 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <div className="relative">
                <select 
                  className="appearance-none bg-[#F5F7FA] border border-transparent text-[#1F2937] py-2 pl-4 pr-10 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#487AD0]/20 focus:border-[#487AD0] hover:bg-gray-100 transition-colors cursor-pointer"
                  value={selectedSpace}
                  onChange={(e) => setSelectedSpace(e.target.value)}
                >
                  {SPACES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  <Filter size={14} />
                </div>
              </div>

              <div className="h-6 w-px bg-gray-200 mx-2"></div>

              <div className="flex bg-[#F5F7FA] rounded-lg p-1">
                {['Día', 'Semana', 'Mes'].map(v => (
                  <button key={v} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${v === 'Semana' ? 'bg-white shadow-sm text-[#1F2937]' : 'text-[#6B7280] hover:text-[#1F2937]'}`}>
                    {v}
                  </button>
                ))}
              </div>
              
              <div className="h-6 w-px bg-gray-200 mx-2"></div>

              <select className="appearance-none bg-transparent border-none text-[#6B7280] py-2 px-3 text-sm font-medium focus:outline-none cursor-pointer hover:text-[#1F2937]">
                <option>Estado: Todos</option>
                <option>Disponible</option>
                <option>Reservado</option>
                <option>Bloqueado</option>
              </select>
            </div>

            <div className="flex items-center gap-4 pr-2">
               <div className="flex bg-[#F5F7FA] rounded-lg p-1">
                <button onClick={() => setViewMode('semana')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'semana' ? 'bg-white shadow-sm text-[#487AD0]' : 'text-[#6B7280] hover:text-[#1F2937]'}`} title="Vista Calendario">
                  <Calendar size={18} />
                </button>
                <button onClick={() => setViewMode('recursos')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'recursos' ? 'bg-white shadow-sm text-[#487AD0]' : 'text-[#6B7280] hover:text-[#1F2937]'}`} title="Vista Recursos">
                  <LayoutGrid size={18} />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button className="p-1 hover:bg-gray-100 rounded text-[#6B7280] transition-colors"><ChevronLeft size={20} /></button>
                <span className="text-sm font-semibold text-[#1F2937] min-w-[130px] text-center">Julio 12 - 18, 2026</span>
                <button className="p-1 hover:bg-gray-100 rounded text-[#6B7280] transition-colors"><ChevronRight size={20} /></button>
              </div>
            </div>
          </div>

          {/* Calendar Workspace */}
          <div className="bg-white rounded-xl shadow-[0_4px_20px_-2px_rgba(31,41,55,0.05)] border border-gray-100/50 overflow-hidden flex flex-col mb-8">
            
            {viewMode === 'semana' ? (
              <div className="flex-1 overflow-x-auto">
                <div className="min-w-[900px]">
                  {/* Header Row */}
                  <div className="grid grid-cols-8 border-b border-gray-100 bg-[#F5F7FA]/50">
                    <div className="p-4 text-center border-r border-gray-100">
                      <Clock size={16} className="mx-auto text-gray-400" />
                    </div>
                    {DAYS.map((day, i) => (
                      <div key={day} className="p-3 text-center border-r border-gray-100 last:border-r-0">
                        <div className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">{day}</div>
                        <div className={`text-xl mt-1 ${i === 2 ? 'text-[#487AD0] font-bold bg-[#487AD0]/10 w-8 h-8 rounded-full flex items-center justify-center mx-auto' : 'text-[#1F2937] font-medium'}`}>{12 + i}</div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Time Grid */}
                  <div className="relative">
                    {HOURS.map(hour => (
                      <div key={hour} className="grid grid-cols-8 border-b border-gray-50 h-24 last:border-b-0">
                        <div className="border-r border-gray-100 p-2 flex items-start justify-center">
                          <span className="text-xs font-medium text-gray-400 -mt-2">{hour}:00</span>
                        </div>
                        {DAYS.map((_, dayIdx) => {
                          const block = blocks.find(b => b.day === dayIdx && b.hour === hour && (selectedSpace === 'Todos' || b.space === selectedSpace));
                          
                          return (
                            <div key={`${dayIdx}-${hour}`} className="border-r border-gray-50 last:border-r-0 p-1 relative">
                              {block && (
                                <div 
                                  onClick={() => setSelectedBlock(block)}
                                  className={`absolute inset-1 p-2 rounded-lg border text-xs flex flex-col cursor-pointer transition-all duration-200 ${getStatusStyles(block.status)}`}
                                >
                                  <div className="flex justify-between items-start mb-1">
                                    <span className="font-semibold truncate">{block.status}</span>
                                    {block.status === 'Disponible' && <div className="w-1.5 h-1.5 rounded-full bg-[#27AE60] mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                  </div>
                                  
                                  {block.status !== 'Disponible' && (
                                    <>
                                      <span className="truncate opacity-90 font-medium">{block.client || block.space}</span>
                                      {block.notes && <span className="truncate opacity-70 mt-auto text-[10px]">{block.notes}</span>}
                                    </>
                                  )}
                                  {block.status === 'Disponible' && selectedSpace === 'Todos' && (
                                    <span className="truncate text-gray-400 mt-auto text-[10px]">{block.space}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Vista Recursos */
              <div className="flex-1 overflow-x-auto p-2">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr>
                      <th className="p-4 border-b border-gray-100 text-[#6B7280] font-medium text-sm w-24 bg-[#F5F7FA]/50 rounded-tl-lg">Hora</th>
                      {SPACES.filter(s => s !== 'Todos').map(space => (
                        <th key={space} className="p-4 border-b border-gray-100 text-[#1F2937] font-semibold text-sm bg-[#F5F7FA]/50">{space}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {HOURS.map(hour => (
                      <tr key={hour} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 text-sm font-medium text-gray-400">{hour}:00</td>
                        {SPACES.filter(s => s !== 'Todos').map(space => {
                          const block = blocks.find(b => b.day === 2 && b.hour === hour && b.space === space);
                          return (
                            <td key={space} className="p-2 border-l border-gray-50">
                               {block ? (
                                  <div onClick={() => setSelectedBlock(block)} className={`px-3 py-2 rounded-lg text-xs font-medium cursor-pointer border ${getStatusStyles(block.status)} text-center truncate transition-all`}>
                                    {block.status === 'Reservado' ? block.client : block.status}
                                  </div>
                               ) : (
                                  <div className="px-3 py-2 rounded-lg text-xs text-gray-400 bg-[#F5F7FA] text-center border border-dashed border-gray-200">
                                    Libre
                                  </div>
                               )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Bottom Settings Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
            {/* Horario General */}
            <div className="bg-white rounded-xl shadow-[0_4px_20px_-2px_rgba(31,41,55,0.05)] border border-gray-100/50 p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-bold text-[#1F2937]">Horario General</h3>
                  <p className="text-sm text-[#6B7280]">Configura la apertura y cierre por defecto.</p>
                </div>
                <div className="p-2 bg-[#487AD0]/10 rounded-lg text-[#487AD0]">
                  <Clock size={20} />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="block text-sm font-medium text-[#1F2937] mb-1.5">Apertura</label>
                  <input type="time" defaultValue="08:00" className="w-full bg-[#F5F7FA] border border-transparent rounded-lg py-2 px-3 text-[#1F2937] text-sm focus:border-[#487AD0] focus:ring-1 focus:ring-[#487AD0] outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1F2937] mb-1.5">Cierre</label>
                  <input type="time" defaultValue="22:00" className="w-full bg-[#F5F7FA] border border-transparent rounded-lg py-2 px-3 text-[#1F2937] text-sm focus:border-[#487AD0] focus:ring-1 focus:ring-[#487AD0] outline-none transition-all" />
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="radio" name="apply" className="text-[#487AD0] focus:ring-[#487AD0]" defaultChecked />
                    <span className="text-sm text-[#1F2937] group-hover:text-[#487AD0] transition-colors">Todos los días</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="radio" name="apply" className="text-[#487AD0] focus:ring-[#487AD0]" />
                    <span className="text-sm text-[#1F2937] group-hover:text-[#487AD0] transition-colors">Por día</span>
                  </label>
                </div>
                <button className="text-sm font-medium text-[#487AD0] hover:text-[#3A6BB8] transition-colors">Guardar cambios</button>
              </div>
            </div>

            {/* Excepciones */}
            <div className="bg-white rounded-xl shadow-[0_4px_20px_-2px_rgba(31,41,55,0.05)] border border-gray-100/50 p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-bold text-[#1F2937]">Excepciones</h3>
                  <p className="text-sm text-[#6B7280]">Feriados, mantenimientos o cierres.</p>
                </div>
                <button className="text-[#487AD0] hover:bg-[#487AD0]/10 p-2 rounded-lg transition-colors flex items-center text-sm font-medium">
                  <Plus size={16} className="mr-1" /> Agregar
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3.5 bg-[#F5F7FA] rounded-lg border border-gray-100 hover:border-gray-200 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-[#EF4444] rounded-full"></div>
                    <div>
                      <p className="font-semibold text-[#1F2937] text-sm">Feriado Nacional (Navidad)</p>
                      <p className="text-xs text-[#6B7280] mt-0.5">25 Dic 2026 • Todo el día</p>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-[#1F2937] opacity-0 group-hover:opacity-100 transition-all"><MoreVertical size={16}/></button>
                </div>
                <div className="flex justify-between items-center p-3.5 bg-[#F5F7FA] rounded-lg border border-gray-100 hover:border-gray-200 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-[#F59E0B] rounded-full"></div>
                    <div>
                      <p className="font-semibold text-[#1F2937] text-sm">Mantenimiento de Piscina</p>
                      <p className="text-xs text-[#6B7280] mt-0.5">15 Ago 2026 • 08:00 - 14:00</p>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-[#1F2937] opacity-0 group-hover:opacity-100 transition-all"><MoreVertical size={16}/></button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Drawer (Slide Over) */}
        {selectedBlock && (
          <>
            <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-[2px] z-40 transition-opacity" onClick={() => setSelectedBlock(null)} />
            <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-2xl z-50 transform transition-transform border-l border-gray-100 flex flex-col">
              
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-[#1F2937]">Detalles del Horario</h3>
                <button onClick={() => setSelectedBlock(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto space-y-6">
                
                {/* Status Badge */}
                <div className={`p-4 rounded-xl border flex items-center justify-between ${getStatusStyles(selectedBlock.status)}`}>
                  <div className="font-bold text-base">{selectedBlock.status}</div>
                  <div className={`px-2.5 py-1 rounded-md text-xs font-semibold ${selectedBlock.status === 'Reservado' ? 'bg-white/20' : 'bg-white shadow-sm'}`}>
                    {selectedBlock.space}
                  </div>
                </div>

                {/* Details */}
                <div className="bg-[#F5F7FA] rounded-xl p-4 space-y-4 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-[#6B7280]">
                      <Calendar size={16} className="mr-2" /> Fecha
                    </div>
                    <span className="font-medium text-[#1F2937]">Mié, 14 Jul 2026</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-[#6B7280]">
                      <Clock size={16} className="mr-2" /> Hora
                    </div>
                    <span className="font-medium text-[#1F2937]">{selectedBlock.hour}:00 - {selectedBlock.hour + 1}:00</span>
                  </div>
                </div>

                {selectedBlock.client && (
                  <div>
                    <h4 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">Información de Reserva</h4>
                    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-[0_2px_10px_-2px_rgba(31,41,55,0.05)] flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#487AD0]/10 text-[#487AD0] flex items-center justify-center font-bold">
                        {selectedBlock.client.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-[#1F2937] text-sm">{selectedBlock.client}</p>
                        <button className="text-xs text-[#487AD0] hover:text-[#3A6BB8] font-medium mt-0.5">Ver detalles de reserva &rarr;</button>
                      </div>
                    </div>
                  </div>
                )}

                {selectedBlock.notes && (
                  <div>
                    <h4 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">Observaciones</h4>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-sm text-[#1F2937]">
                      {selectedBlock.notes}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="p-6 border-t border-gray-100 bg-white space-y-3">
                {selectedBlock.status === 'Disponible' ? (
                   <button className="w-full flex items-center justify-center py-2.5 px-4 bg-[#1F2937] text-white rounded-lg hover:bg-black transition-colors font-medium text-sm shadow-md">
                    <Lock size={16} className="mr-2" /> Bloquear horario
                  </button>
                ) : (
                  <button className="w-full flex items-center justify-center py-2.5 px-4 bg-white border border-gray-200 text-[#1F2937] rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
                    <Unlock size={16} className="mr-2 text-gray-500" /> Liberar horario
                  </button>
                )}
                
                <div className="grid grid-cols-2 gap-3">
                  <button className="flex items-center justify-center py-2.5 px-4 bg-white border border-gray-200 text-[#1F2937] rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                    <Edit3 size={16} className="mr-2 text-gray-400" /> Editar
                  </button>
                  <button className="flex items-center justify-center py-2.5 px-4 bg-white border border-transparent text-[#EF4444] hover:bg-[#EF4444]/5 rounded-lg transition-colors text-sm font-medium">
                    Cancelar
                  </button>
                </div>
              </div>

            </div>
          </>
        )}
      </main>
    </div>
  );
}
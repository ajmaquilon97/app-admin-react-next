import React, { useState } from 'react';
import { 
  Home, CalendarDays, MapPin, Users, BarChart3, Settings, 
  Search, Bell, DollarSign, Download, Plus, Filter, 
  MoreVertical, CheckCircle2, Clock, X, MessageSquare, 
  CreditCard, UserCheck, UserX, Calendar, List, Mail, Phone,
  ChevronRight, CalendarCheck, Ban, ArrowRightLeft
} from 'lucide-react';

// --- Types ---
type BookingStatus = 'Pendiente' | 'Confirmada' | 'Reagendada' | 'Cancelada' | 'Finalizada';
type PaymentStatus = 'Pendiente' | 'Pagado parcialmente' | 'Pagado' | 'Reembolsado';
type AttendanceStatus = 'No registrado' | 'Asistió' | 'No asistió';

interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'success' | 'info' | 'warning' | 'error' | 'neutral';
}

interface Booking {
  id: string;
  code: string;
  client: { name: string; email: string; phone: string; initials: string; color: string };
  space: string;
  date: string;
  time: string;
  pax: number;
  total: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  attendance: AttendanceStatus;
  timeline: TimelineEvent[];
  notes?: string;
}

// --- Mock Data ---
const mockBookings: Booking[] = [
  {
    id: '1', code: 'RES-0089',
    client: { name: 'Carlos Mendoza', email: 'carlos.m@email.com', phone: '+593 98 765 4321', initials: 'CM', color: 'bg-blue-100 text-blue-700' },
    space: 'Cancha Sintética 1', date: 'Hoy, 14 Jul', time: '18:00 - 20:00', pax: 14, total: 50,
    status: 'Confirmada', paymentStatus: 'Pagado', attendance: 'No registrado',
    notes: 'Solicitó 2 balones adicionales.',
    timeline: [
      { id: 't1', title: 'Reserva creada (App)', date: '12 Jul 2026', time: '10:30 AM', type: 'info' },
      { id: 't2', title: 'Pago recibido ($50.00)', date: '12 Jul 2026', time: '10:35 AM', type: 'success' },
      { id: 't3', title: 'Reserva confirmada', date: '12 Jul 2026', time: '10:35 AM', type: 'success' },
      { id: 't4', title: 'Recordatorio enviado', date: 'Hoy, 14 Jul', time: '08:00 AM', type: 'neutral' },
    ]
  },
  {
    id: '2', code: 'RES-0090',
    client: { name: 'Ana Torres', email: 'ana.t@email.com', phone: '+593 99 123 4567', initials: 'AT', color: 'bg-[#8F0E55]/10 text-[#8F0E55]' },
    space: 'Salón Principal', date: 'Mañana, 15 Jul', time: '14:00 - 22:00', pax: 50, total: 350,
    status: 'Pendiente', paymentStatus: 'Pagado parcialmente', attendance: 'No registrado',
    timeline: [
      { id: 't1', title: 'Reserva creada (Web)', date: '13 Jul 2026', time: '16:20 PM', type: 'info' },
      { id: 't2', title: 'Anticipo recibido ($150.00)', date: '13 Jul 2026', time: '16:45 PM', type: 'neutral' },
    ]
  },
  {
    id: '3', code: 'RES-0091',
    client: { name: 'Empresa Tech', email: 'eventos@tech.com', phone: '+593 2 234 5678', initials: 'ET', color: 'bg-gray-100 text-gray-700' },
    space: 'Área de Camping', date: 'Sáb, 18 Jul', time: 'Todo el día', pax: 25, total: 180,
    status: 'Cancelada', paymentStatus: 'Reembolsado', attendance: 'No registrado',
    timeline: [
      { id: 't1', title: 'Reserva creada', date: '10 Jul 2026', time: '09:00 AM', type: 'info' },
      { id: 't2', title: 'Pago recibido ($180.00)', date: '10 Jul 2026', time: '09:15 AM', type: 'success' },
      { id: 't3', title: 'Cancelada por cliente', date: '11 Jul 2026', time: '14:30 PM', type: 'error' },
      { id: 't4', title: 'Reembolso procesado', date: '11 Jul 2026', time: '15:00 PM', type: 'neutral' },
    ]
  },
  {
    id: '4', code: 'RES-0088',
    client: { name: 'Familia Ruiz', email: 'ruiz.fam@email.com', phone: '+593 97 654 3210', initials: 'FR', color: 'bg-green-100 text-green-700' },
    space: 'Piscina Familiar', date: 'Ayer, 13 Jul', time: '10:00 - 14:00', pax: 8, total: 80,
    status: 'Finalizada', paymentStatus: 'Pagado', attendance: 'Asistió',
    timeline: [
      { id: 't1', title: 'Reserva creada', date: '05 Jul 2026', time: '11:00 AM', type: 'info' },
      { id: 't2', title: 'Pago recibido ($80.00)', date: '05 Jul 2026', time: '11:05 AM', type: 'success' },
      { id: 't3', title: 'Asistencia registrada', date: '13 Jul 2026', time: '10:15 AM', type: 'success' },
      { id: 't4', title: 'Reserva finalizada', date: '13 Jul 2026', time: '14:00 PM', type: 'neutral' },
    ]
  }
];

// --- Helpers ---
const getStatusStyles = (status: BookingStatus) => {
  switch (status) {
    case 'Confirmada': return 'bg-[#27AE60]/10 text-[#27AE60] border-[#27AE60]/20';
    case 'Pendiente': return 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20';
    case 'Reagendada': return 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20';
    case 'Cancelada': return 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20';
    case 'Finalizada': return 'bg-gray-100 text-[#6B7280] border-gray-200';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const getPaymentStyles = (status: PaymentStatus) => {
  switch (status) {
    case 'Pagado': return 'text-[#27AE60] bg-[#27AE60]/10';
    case 'Pagado parcialmente': return 'text-[#3B82F6] bg-[#3B82F6]/10';
    case 'Pendiente': return 'text-[#F59E0B] bg-[#F59E0B]/10';
    case 'Reembolsado': return 'text-[#6B7280] bg-gray-100';
    default: return 'text-gray-500 bg-gray-100';
  }
};

const getTimelineDotColor = (type: string) => {
  switch (type) {
    case 'success': return 'bg-[#27AE60] border-[#27AE60]/30';
    case 'error': return 'bg-[#EF4444] border-[#EF4444]/30';
    case 'warning': return 'bg-[#F59E0B] border-[#F59E0B]/30';
    case 'info': return 'bg-[#3B82F6] border-[#3B82F6]/30';
    default: return 'bg-gray-400 border-gray-200';
  }
};

export default function ReservasAdmin() {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  return (
    <div className="flex h-screen bg-[#F5F7FA] font-sans text-[#1F2937] overflow-hidden">
      
      {}
      <aside className="w-64 bg-white border-r border-gray-200 hidden lg:flex flex-col h-full sticky top-0 z-20">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[#487AD0] flex items-center justify-center shadow-sm">
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
            <span className="text-xl font-bold tracking-tight text-[#1F2937]">Agora</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {[
            { icon: Home, label: 'Dashboard' },
            { icon: CalendarCheck, label: 'Reservas', active: true },
            { icon: CalendarDays, label: 'Disponibilidad' },
            { icon: DollarSign, label: 'Tarifas' },
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

      {}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8 shrink-0 z-10">
          <div className="flex items-center bg-[#F5F7FA] rounded-md px-3 py-2 w-96 border border-transparent focus-within:border-[#487AD0]/30 focus-within:bg-white transition-colors">
            <Search size={16} className="text-gray-400 mr-2" />
            <input type="text" placeholder="Buscar por cliente, código o espacio..." className="bg-transparent border-none outline-none w-full text-sm text-[#1F2937] placeholder-gray-400" />
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-gray-400 hover:text-[#1F2937] transition-colors relative">
              <Bell size={20} />
            </button>
            <div className="w-8 h-8 rounded-full bg-[#487AD0] text-white flex items-center justify-center font-medium text-sm shadow-sm cursor-pointer hover:bg-[#3A6BB8] transition-colors">
              KR
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-8">
          
          {}
          <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#1F2937] tracking-tight">Reservas</h1>
              <p className="text-[#6B7280] mt-1 text-sm">Administra todas las reservas realizadas por tus clientes.</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-[0_2px_4px_rgba(0,0,0,0.02)] text-[#1F2937]">
                <Download size={16} className="mr-2 text-gray-400" />
                Exportar
              </button>
              <button className="flex items-center px-4 py-2 bg-[#487AD0] text-white rounded-lg text-sm font-medium hover:bg-[#3A6BB8] transition-colors shadow-[0_4px_12px_rgba(72,122,208,0.25)]">
                <Plus size={16} className="mr-2" />
                Nueva reserva manual
              </button>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Reservas de hoy', value: '12', sub: '3 pendientes de pago', icon: CalendarCheck, color: 'text-[#487AD0]' },
              { label: 'Reservas pendientes', value: '5', sub: 'Requieren confirmación', icon: Clock, color: 'text-[#F59E0B]' },
              { label: 'Ingresos del día', value: '$450', sub: '+15% vs ayer', icon: DollarSign, color: 'text-[#27AE60]' },
              { label: 'Ocupación actual', value: '78%', sub: 'Alta demanda', icon: BarChart3, color: 'text-[#8F0E55]' },
            ].map((kpi, idx) => (
              <div key={idx} className="bg-white p-5 rounded-xl shadow-[0_4px_20px_-2px_rgba(31,41,55,0.05)] border border-gray-100/50 flex items-start justify-between">
                <div>
                  <p className="text-sm text-[#6B7280] font-medium mb-1">{kpi.label}</p>
                  <p className="text-2xl font-bold text-[#1F2937]">{kpi.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{kpi.sub}</p>
                </div>
                <div className={`p-2 bg-gray-50 rounded-lg ${kpi.color}`}>
                  <kpi.icon size={20} />
                </div>
              </div>
            ))}
          </div>

          {}
          <div className="bg-white p-3 rounded-xl shadow-[0_4px_20px_-2px_rgba(31,41,55,0.05)] border border-gray-100/50 mb-6 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-10">
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              
              <div className="flex items-center px-3 py-2 bg-[#F5F7FA] rounded-lg border border-transparent focus-within:border-[#487AD0]/30 transition-colors">
                <Search size={14} className="text-gray-400 mr-2" />
                <input type="text" placeholder="Filtrar..." className="bg-transparent border-none outline-none w-32 text-sm text-[#1F2937] placeholder-gray-400" />
              </div>

              <select className="appearance-none bg-[#F5F7FA] border border-transparent text-[#1F2937] py-2 pl-3 pr-8 rounded-lg text-sm font-medium focus:outline-none hover:bg-gray-100 transition-colors cursor-pointer outline-none">
                <option>Todos los espacios</option>
                <option>Cancha Sintética 1</option>
                <option>Salón Principal</option>
              </select>

              <select className="appearance-none bg-[#F5F7FA] border border-transparent text-[#1F2937] py-2 pl-3 pr-8 rounded-lg text-sm font-medium focus:outline-none hover:bg-gray-100 transition-colors cursor-pointer outline-none">
                <option>Estado: Todos</option>
                <option>Pendiente</option>
                <option>Confirmada</option>
              </select>

              <button className="flex items-center px-3 py-2 text-sm font-medium text-[#6B7280] hover:text-[#1F2937] hover:bg-gray-50 rounded-lg transition-colors">
                <Calendar size={14} className="mr-2" />
                Fechas
              </button>

              <div className="h-6 w-px bg-gray-200 hidden lg:block"></div>
              
              <button className="text-sm font-medium text-gray-400 hover:text-[#EF4444] transition-colors">
                Limpiar
              </button>
            </div>

            <div className="flex bg-[#F5F7FA] rounded-lg p-1 shrink-0 ml-auto lg:ml-0">
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-colors flex items-center ${viewMode === 'list' ? 'bg-white shadow-sm text-[#487AD0]' : 'text-[#6B7280] hover:text-[#1F2937]'}`} title="Vista Lista">
                <List size={16} />
              </button>
              <button onClick={() => setViewMode('calendar')} className={`p-1.5 rounded-md transition-colors flex items-center ${viewMode === 'calendar' ? 'bg-white shadow-sm text-[#487AD0]' : 'text-[#6B7280] hover:text-[#1F2937]'}`} title="Vista Calendario (Solo lectura)">
                <CalendarDays size={16} />
              </button>
            </div>
          </div>

          {}
          {viewMode === 'list' ? (
            <div className="bg-white rounded-xl shadow-[0_4px_20px_-2px_rgba(31,41,55,0.05)] border border-gray-100/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr>
                      <th className="py-4 px-6 border-b border-gray-100 text-[#6B7280] font-semibold text-xs uppercase tracking-wider bg-gray-50/50">Cliente</th>
                      <th className="py-4 px-6 border-b border-gray-100 text-[#6B7280] font-semibold text-xs uppercase tracking-wider bg-gray-50/50">Detalle Reserva</th>
                      <th className="py-4 px-6 border-b border-gray-100 text-[#6B7280] font-semibold text-xs uppercase tracking-wider bg-gray-50/50">Pax</th>
                      <th className="py-4 px-6 border-b border-gray-100 text-[#6B7280] font-semibold text-xs uppercase tracking-wider bg-gray-50/50">Estado</th>
                      <th className="py-4 px-6 border-b border-gray-100 text-[#6B7280] font-semibold text-xs uppercase tracking-wider bg-gray-50/50">Pago</th>
                      <th className="py-4 px-6 border-b border-gray-100 text-[#6B7280] font-semibold text-xs uppercase tracking-wider bg-gray-50/50 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {mockBookings.map((booking) => (
                      <tr 
                        key={booking.id} 
                        onClick={() => setSelectedBooking(booking)}
                        className={`hover:bg-[#F5F7FA]/50 transition-colors cursor-pointer group ${selectedBooking?.id === booking.id ? 'bg-[#F5F7FA]' : ''}`}
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${booking.client.color}`}>
                              {booking.client.initials}
                            </div>
                            <div>
                              <p className="font-semibold text-[#1F2937] text-sm group-hover:text-[#487AD0] transition-colors">{booking.client.name}</p>
                              <p className="text-xs text-[#6B7280] mt-0.5 font-mono">{booking.code}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <p className="font-medium text-[#1F2937] text-sm">{booking.space}</p>
                          <p className="text-xs text-[#6B7280] mt-0.5">{booking.date} • {booking.time}</p>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center text-sm text-[#6B7280]">
                            <Users size={14} className="mr-1.5 opacity-70" /> {booking.pax}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${getStatusStyles(booking.status)}`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                           <div>
                              <p className="font-semibold text-[#1F2937] text-sm">${booking.total.toFixed(2)}</p>
                              <p className={`text-[10px] font-bold uppercase mt-1 inline-flex px-1.5 py-0.5 rounded ${getPaymentStyles(booking.paymentStatus)}`}>
                                {booking.paymentStatus}
                              </p>
                           </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {booking.status === 'Pendiente' && (
                              <button className="p-1.5 text-[#27AE60] hover:bg-[#27AE60]/10 rounded-md transition-colors" title="Confirmar" onClick={(e) => e.stopPropagation()}>
                                <CheckCircle2 size={16} />
                              </button>
                            )}
                            <button className="p-1.5 text-[#487AD0] hover:bg-[#487AD0]/10 rounded-md transition-colors" title="Contactar" onClick={(e) => e.stopPropagation()}>
                              <MessageSquare size={16} />
                            </button>
                            <button className="p-1.5 text-gray-400 hover:text-[#1F2937] hover:bg-gray-100 rounded-md transition-colors" title="Ver opciones" onClick={(e) => e.stopPropagation()}>
                              <MoreVertical size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-[0_4px_20px_-2px_rgba(31,41,55,0.05)] border border-gray-100/50 flex items-center justify-center h-96 text-center">
              <div>
                <div className="w-16 h-16 bg-[#F5F7FA] rounded-full flex items-center justify-center mx-auto mb-4 text-[#487AD0]">
                  <CalendarDays size={24} />
                </div>
                <h3 className="text-lg font-bold text-[#1F2937]">Vista de Calendario (Lectura)</h3>
                <p className="text-sm text-[#6B7280] mt-1 max-w-sm mx-auto">Esta vista mostrará las reservas en formato calendario. Recuerda que para editar la disponibilidad debes ir al módulo "Disponibilidad".</p>
              </div>
            </div>
          )}

        </div>

        {}
        {selectedBooking && (
          <>
            <div 
              className="fixed inset-0 bg-gray-900/20 backdrop-blur-[2px] z-40 transition-opacity" 
              onClick={() => setSelectedBooking(null)} 
            />
            <div className="fixed inset-y-0 right-0 w-full max-w-md bg-[#F5F7FA] shadow-2xl z-50 transform transition-transform border-l border-gray-200 flex flex-col">
              
              {/* Drawer Header */}
              <div className="bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-lg font-bold text-[#1F2937]">Detalle de Reserva</h2>
                  <p className="text-xs font-mono text-[#6B7280] mt-0.5">{selectedBooking.code}</p>
                </div>
                <button onClick={() => setSelectedBooking(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Body (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Status Badges Row */}
                <div className="flex gap-3">
                  <div className={`flex-1 p-3 rounded-xl border flex flex-col justify-center items-center text-center ${getStatusStyles(selectedBooking.status).replace('border', 'border-opacity-50')}`}>
                    <span className="text-[10px] uppercase font-bold opacity-70 mb-1">Estado</span>
                    <span className="font-semibold text-sm">{selectedBooking.status}</span>
                  </div>
                  <div className={`flex-1 p-3 rounded-xl border border-transparent flex flex-col justify-center items-center text-center ${getPaymentStyles(selectedBooking.paymentStatus)}`}>
                    <span className="text-[10px] uppercase font-bold opacity-70 mb-1">Pago</span>
                    <span className="font-semibold text-sm">{selectedBooking.paymentStatus}</span>
                  </div>
                </div>

                {/* Client Info Card */}
                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                  <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-4 flex items-center">
                    <UserCheck size={14} className="mr-2" /> Datos del Cliente
                  </h3>
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${selectedBooking.client.color}`}>
                      {selectedBooking.client.initials}
                    </div>
                    <div>
                      <p className="font-bold text-[#1F2937]">{selectedBooking.client.name}</p>
                      <button className="text-xs text-[#487AD0] font-medium hover:underline mt-0.5">Ver perfil completo</button>
                    </div>
                  </div>
                  <div className="space-y-3 pt-4 border-t border-gray-50">
                    <div className="flex items-center text-sm">
                      <Phone size={14} className="text-gray-400 mr-3 w-5" />
                      <span className="text-[#1F2937] font-medium">{selectedBooking.client.phone}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Mail size={14} className="text-gray-400 mr-3 w-5" />
                      <span className="text-[#1F2937] font-medium">{selectedBooking.client.email}</span>
                    </div>
                  </div>
                </div>

                {/* Booking Info Card */}
                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                   <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-4 flex items-center">
                    <MapPin size={14} className="mr-2" /> Espacio Reservado
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="font-semibold text-[#1F2937] text-lg">{selectedBooking.space}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Fecha y Hora</p>
                        <p className="text-sm font-medium text-[#1F2937]">{selectedBooking.date}</p>
                        <p className="text-sm text-[#6B7280]">{selectedBooking.time}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Asistentes</p>
                        <p className="text-sm font-medium text-[#1F2937] flex items-center">
                           <Users size={14} className="mr-1.5 text-gray-400" /> {selectedBooking.pax} personas
                        </p>
                      </div>
                    </div>
                    {selectedBooking.notes && (
                      <div className="pt-4 border-t border-gray-50">
                        <p className="text-xs text-gray-400 mb-1">Observaciones del cliente</p>
                        <p className="text-sm text-[#1F2937] bg-[#F5F7FA] p-3 rounded-lg border border-gray-100">
                          "{selectedBooking.notes}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Attendance Tracking (Actionable) */}
                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                  <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-3">Asistencia</h3>
                  <div className="flex gap-2">
                    <button className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${selectedBooking.attendance === 'Asistió' ? 'bg-[#27AE60]/10 border-[#27AE60]/30 text-[#27AE60]' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      Asistió
                    </button>
                    <button className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${selectedBooking.attendance === 'No asistió' ? 'bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444]' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      No asistió
                    </button>
                  </div>
                </div>

                {}
                <div className="pt-2">
                  <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-4">Línea de Tiempo</h3>
                  <div className="relative border-l-2 border-gray-200 ml-3 space-y-6 pb-4">
                    {selectedBooking.timeline.map((event, i) => (
                      <div key={event.id} className="relative pl-6">
                        {/* Timeline Dot */}
                        <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 bg-white ${getTimelineDotColor(event.type).split(' ')[1]} flex items-center justify-center`}>
                           <div className={`w-2 h-2 rounded-full ${getTimelineDotColor(event.type).split(' ')[0]}`}></div>
                        </div>
                        {/* Event Content */}
                        <div>
                          <p className="text-sm font-semibold text-[#1F2937]">{event.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{event.date} • {event.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
              </div>

              {}
              <div className="bg-white p-5 border-t border-gray-100 shrink-0 space-y-3">
                {selectedBooking.status === 'Pendiente' && (
                   <button className="w-full flex items-center justify-center py-2.5 px-4 bg-[#27AE60] text-white rounded-lg hover:bg-[#219653] transition-colors font-medium text-sm shadow-md">
                    <CheckCircle2 size={16} className="mr-2" /> Confirmar Reserva
                  </button>
                )}
                
                <div className="grid grid-cols-2 gap-3">
                  <button className="flex items-center justify-center py-2 px-4 bg-white border border-gray-200 text-[#1F2937] rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                    <CreditCard size={16} className="mr-2 text-gray-400" /> Pagar
                  </button>
                  <button className="flex items-center justify-center py-2 px-4 bg-white border border-gray-200 text-[#1F2937] rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                    <MessageSquare size={16} className="mr-2 text-gray-400" /> Mensaje
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                   <button className="flex items-center justify-center py-2 px-4 text-[#6B7280] hover:text-[#1F2937] transition-colors text-xs font-medium">
                    <ArrowRightLeft size={14} className="mr-1.5" /> Reagendar
                  </button>
                  <button className="flex items-center justify-center py-2 px-4 text-[#EF4444] hover:bg-[#EF4444]/5 rounded-lg transition-colors text-xs font-medium">
                    <Ban size={14} className="mr-1.5" /> Cancelar reserva
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
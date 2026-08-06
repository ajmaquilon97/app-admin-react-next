"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Lock, AlertCircle, CheckCircle2, XCircle, Tent } from "lucide-react";

import type {
  Block,
  ViewMode,
  Statistics,
  Schedule,
  AvailabilityException,
  ToastMessage,
  Espacio,
} from "./types";
import {
  fetchAvailability,
  fetchAvailabilityStatistics,
  fetchServerNow,
  fetchSchedule,
  saveSchedule,
  fetchExceptions,
  createException,
  updateException,
  deleteException,
  createBlock,
  deleteBlock,
} from "@/actions/availability";
import {
  getWeekStart,
  getWeekDates,
  formatISODate,
} from "@/lib/availability-mock";
import { getArchetype } from "@/lib/espacio-archetype";
import { HeaderSpaceSelector } from "@/components/ui/HeaderSpaceSelector";

import { AvailabilityStats } from "./AvailabilityStats";
import { AvailabilityToolbar } from "./AvailabilityToolbar";
import { AvailabilityCalendar } from "./AvailabilityCalendar";
import { AvailabilityBlockDrawer } from "./AvailabilityBlockDrawer";
import { GeneralScheduleCard } from "./GeneralScheduleCard";
import { ExceptionsCard } from "./ExceptionsCard";
import { BlockModal } from "./BlockModal";
import { ExceptionModal } from "./ExceptionModal";
import { CreateAvailabilityModal } from "./CreateAvailabilityModal";
import { AforoPanel } from "./AforoPanel";

// ── Toast ────────────────────────────────────────────────────────────────────

function ToastList({ toasts }: { toasts: ToastMessage[] }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium text-white ${
            t.type === "success" ? "bg-success" : "bg-error"
          }`}
        >
          {t.type === "success" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export function AvailabilityPage({ spaces }: { spaces: Espacio[] }) {
  // Filters & navigation
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  // Siempre un espacio específico — no existe una vista "todos los espacios".
  const [selectedEspacioId, setSelectedEspacioId] = useState<number | null>(spaces[0]?.id ?? null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()));

  // Data
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [stats, setStats] = useState<Statistics | null>(null);
  // Hora del servidor — evita que la grilla dependa del reloj del navegador del usuario.
  const [serverNow, setServerNow] = useState<Date | null>(null);
  const [schedule, setSchedule] = useState<Schedule>({
    apertura: "08:00",
    cierre: "22:00",
    diasActivos: [0, 1, 2, 3, 4, 5, 6],
  });
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);

  // Loading
  const [isLoadingBlocks, setIsLoadingBlocks] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [isActingOnBlock, setIsActingOnBlock] = useState(false);

  // UI
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockModalPrefill, setBlockModalPrefill] = useState<{
    date?: string;
    hour?: number;
    espacioId?: number;
  }>({});
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [editingException, setEditingException] = useState<AvailabilityException | undefined>();
  const [showCreateAvailModal, setShowCreateAvailModal] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const addToast = useCallback((type: "success" | "error", message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  // ── Data fetching ─────────────────────────────────────────────────────────

  // Hora del servidor — una sola vez al montar, no depende de semana/espacio.
  useEffect(() => {
    fetchServerNow()
      .then((iso) => setServerNow(new Date(iso)))
      .catch((err) => console.error("[availability] error obteniendo la hora del servidor:", err));
  }, []);

  useEffect(() => {
    if (selectedEspacioId == null) return;
    // Los espacios de cupo compartido (piscinas) no usan la grilla horaria —
    // evita el fetch y el toast de error que dispararía sin necesidad. blocks/stats
    // no se renderizan para este archetype (ver AforoPanel), así que no hace falta limpiarlos.
    const espacio = spaces.find((s) => s.id === selectedEspacioId);
    if (getArchetype({ modalidadReserva: espacio?.modalidadReserva ?? null }) === "cupo_compartido") return;

    const dates = getWeekDates(weekStart);
    const fechaInicio = formatISODate(dates[0]!);
    const fechaFin = formatISODate(dates[6]!);

    setIsLoadingBlocks(true);
    setIsLoadingStats(true);

    Promise.all([
      fetchAvailability(fechaInicio, fechaFin, selectedEspacioId),
      fetchAvailabilityStatistics(fechaInicio, fechaFin, selectedEspacioId),
    ])
      .then(([newBlocks, newStats]) => {
        setBlocks(newBlocks);
        setStats(newStats);
      })
      .catch((err) => {
        console.error("[availability] error cargando datos:", err);
        addToast("error", "No se pudo cargar la disponibilidad.");
      })
      .finally(() => {
        setIsLoadingBlocks(false);
        setIsLoadingStats(false);
      });
  }, [weekStart, selectedEspacioId, addToast, spaces]);

  // Load schedule for the selected space
  useEffect(() => {
    if (selectedEspacioId == null) return;
    setIsLoadingSchedule(true);
    fetchSchedule(selectedEspacioId)
      .then(setSchedule)
      .catch(() => {
        // If no schedule configured yet, keep defaults
      })
      .finally(() => setIsLoadingSchedule(false));
  }, [selectedEspacioId]);

  // Load exceptions
  useEffect(() => {
    if (selectedEspacioId == null) return;
    fetchExceptions(selectedEspacioId)
      .then(setExceptions)
      .catch(() => addToast("error", "No se pudieron cargar las excepciones."));
  }, [selectedEspacioId, addToast]);

  // ── Navigation ────────────────────────────────────────────────────────────

  const goToPrev = () =>
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });

  const goToNext = () =>
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });

  const goToToday = () => setWeekStart(getWeekStart(new Date()));

  // ── Block actions ─────────────────────────────────────────────────────────

  const handleBlockClick = (block: Block) => {
    if (block.status !== "closed") setSelectedBlock(block);
  };

  const handleEmptyCellClick = (date: string, hour: number) => {
    setBlockModalPrefill({
      date,
      hour,
      espacioId: selectedEspacioId ?? undefined,
    });
    setShowBlockModal(true);
  };

  const handleBlockFromDrawer = async (block: Block) => {
    setIsActingOnBlock(true);
    try {
      const created = await createBlock({
        espacioId: block.espacioId,
        fecha: block.date,
        hourStart: block.hour,
        hourEnd: block.hour + 1,
        estado: "blocked",
      });
      // Reemplaza el slot optimista por el registro real del backend (con su
      // id real) — el slot "available" original puede no tener un id válido
      // para borrar, ya que no está respaldado por una fila propia.
      setBlocks((prev) => {
        const filtered = prev.filter(
          (b) => !(b.date === block.date && b.espacioId === block.espacioId && b.hour === block.hour),
        );
        return [...filtered, ...created];
      });
      setSelectedBlock(null);
      addToast("success", "Horario bloqueado correctamente.");
    } catch (e) {
      addToast("error", e instanceof Error ? e.message : "No se pudo bloquear el horario.");
    } finally {
      setIsActingOnBlock(false);
    }
  };

  const handleReleaseFromDrawer = async (block: Block) => {
    setIsActingOnBlock(true);
    try {
      await deleteBlock(block.id);
      setBlocks((prev) =>
        prev.map((b) =>
          b.id === block.id ? { ...b, status: "available", notes: undefined } : b,
        ),
      );
      setSelectedBlock(null);
      addToast("success", "Horario liberado correctamente.");
    } catch (e) {
      addToast("error", e instanceof Error ? e.message : "No se pudo liberar el horario.");
    } finally {
      setIsActingOnBlock(false);
    }
  };

  const handleCreateBlock = async (data: {
    espacioId: number;
    fecha: string;
    hourStart: number;
    hourEnd: number;
    estado: "blocked" | "maintenance";
    notas?: string;
  }) => {
    const created = await createBlock(data);
    setBlocks((prev) => {
      const filtered = prev.filter(
        (b) =>
          !(
            b.date === data.fecha &&
            b.espacioId === data.espacioId &&
            b.hour >= data.hourStart &&
            b.hour < data.hourEnd
          ),
      );
      return [...filtered, ...created];
    });
    setShowBlockModal(false);
    addToast("success", "Bloqueo creado correctamente.");
  };

  // ── Schedule ──────────────────────────────────────────────────────────────

  const handleSaveSchedule = async (s: Schedule) => {
    if (selectedEspacioId == null) return;
    const updated = await saveSchedule({ ...s, espacioId: selectedEspacioId });
    setSchedule(updated);
    addToast("success", "Horario general guardado.");
  };

  // ── Exceptions ────────────────────────────────────────────────────────────

  const getActiveEspacioId = (): number | undefined => selectedEspacioId ?? undefined;

  const handleSaveException = async (data: Omit<AvailabilityException, "id">) => {
    const espacioId = getActiveEspacioId();
    if (!espacioId) return;

    if (editingException) {
      const updated = await updateException(editingException.id, { ...data, espacioId });
      setExceptions((prev) => prev.map((e) => (e.id === editingException.id ? updated : e)));
      addToast("success", "Excepción actualizada.");
    } else {
      const created = await createException({ ...data, espacioId });
      setExceptions((prev) => [...prev, created]);
      addToast("success", "Excepción agregada.");
    }
    setShowExceptionModal(false);
    setEditingException(undefined);
  };

  const handleDeleteException = async (id: string) => {
    await deleteException(id);
    setExceptions((prev) => prev.filter((e) => e.id !== id));
    addToast("success", "Excepción eliminada.");
  };

  // ── Create availability ───────────────────────────────────────────────────

  const handleCreateAvailability = async (data: {
    espacioId: number;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    descripcion?: string;
  }) => {
    // Convierte el rango horario a bloques disponibles en el estado local
    const [startH, startM] = data.horaInicio.split(":").map(Number);
    const [endH, endM] = data.horaFin.split(":").map(Number);
    const startTotal = (startH ?? 0) * 60 + (startM ?? 0);
    const endTotal = (endH ?? 0) * 60 + (endM ?? 0);

    // Marca como "available" las celdas del calendario que caen dentro del rango
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.date !== data.fecha || b.espacioId !== data.espacioId) return b;
        const blockMinutes = b.hour * 60;
        if (blockMinutes >= startTotal && blockMinutes < endTotal) {
          return { ...b, status: "available" as const, notes: data.descripcion };
        }
        return b;
      }),
    );

    setShowCreateAvailModal(false);
    addToast(
      "success",
      `Disponibilidad creada: ${data.horaInicio}–${data.horaFin} el ${new Date(data.fecha + "T00:00:00").toLocaleDateString("es-EC", { day: "numeric", month: "long" })}.`,
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (spaces.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-8 bg-background">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-20 text-center">
          <Tent className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-semibold text-text-main">No tienes espacios aún</h3>
          <p className="mt-1 text-sm text-text-muted">
            Crea un espacio para poder gestionar su disponibilidad.
          </p>
        </div>
      </div>
    );
  }

  // A esta altura siempre hay al menos un espacio (ver early-return arriba).
  const activeEspacioId = selectedEspacioId ?? spaces[0]!.id;
  const activeEspacio = spaces.find((s) => s.id === activeEspacioId) ?? spaces[0]!;
  const archetype = getArchetype({ modalidadReserva: activeEspacio.modalidadReserva });
  const esCupoCompartido = archetype === "cupo_compartido";

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-background">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main tracking-tight">Agenda</h1>
          <p className="text-text-muted mt-1 text-sm">
            Gestiona horarios, bloqueos y reservas de todos tus espacios.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <HeaderSpaceSelector
            espacios={spaces.map((s) => ({
              id: String(s.id),
              nombre: s.nombre,
              tipoEspacioNombre: s.tipoEspacioNombre,
            }))}
            value={String(activeEspacioId)}
            onChange={(id) => setSelectedEspacioId(Number(id))}
          />
          <button
            onClick={() => { setEditingException(undefined); setShowExceptionModal(true); }}
            className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors text-text-main"
          >
            <AlertCircle size={15} className="mr-2 text-gray-400" />
            Agregar excepción
          </button>
          {!esCupoCompartido && (
            <>
              <button
                onClick={() => {
                  setBlockModalPrefill({ espacioId: activeEspacioId });
                  setShowBlockModal(true);
                }}
                className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors text-text-main"
              >
                <Lock size={15} className="mr-2 text-gray-400" />
                Bloquear horario
              </button>
              <button
                onClick={() => setShowCreateAvailModal(true)}
                className="flex items-center px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors shadow-[0_4px_12px_rgba(30,58,95,0.25)]"
              >
                <Plus size={15} className="mr-2" />
                Crear disponibilidad
              </button>
            </>
          )}
        </div>
      </div>

      {/* KPI cards */}
      {!esCupoCompartido && (
        <div className="mb-8">
          <AvailabilityStats stats={stats} isLoading={isLoadingStats} />
        </div>
      )}

      {/* Toolbar */}
      <div className="mb-6">
        <AvailabilityToolbar
          viewMode={viewMode}
          setViewMode={setViewMode}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          weekStart={weekStart}
          onPrev={goToPrev}
          onNext={goToNext}
          onToday={goToToday}
          simplified={esCupoCompartido}
        />
      </div>

      {/* Calendar / Aforo workspace */}
      {esCupoCompartido ? (
        <div className="mb-8">
          <AforoPanel espacio={activeEspacio} weekStart={weekStart} />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-soft border border-gray-100/50 overflow-hidden mb-8">
          <AvailabilityCalendar
            blocks={blocks}
            weekStart={weekStart}
            selectedEspacioId={activeEspacioId}
            statusFilter={statusFilter}
            isLoading={isLoadingBlocks}
            onBlockClick={handleBlockClick}
            onEmptyCellClick={handleEmptyCellClick}
            serverNow={serverNow}
          />
        </div>
      )}

      {/* Bottom cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
        <GeneralScheduleCard
          schedule={schedule}
          isLoading={isLoadingSchedule}
          onSave={handleSaveSchedule}
        />
        <ExceptionsCard
          exceptions={exceptions}
          onAdd={() => { setEditingException(undefined); setShowExceptionModal(true); }}
          onEdit={(exc) => { setEditingException(exc); setShowExceptionModal(true); }}
          onDelete={handleDeleteException}
        />
      </div>

      {/* Drawers / Modals */}
      {selectedBlock && (
        <AvailabilityBlockDrawer
          block={selectedBlock}
          isActing={isActingOnBlock}
          onClose={() => setSelectedBlock(null)}
          onBlock={handleBlockFromDrawer}
          onRelease={handleReleaseFromDrawer}
        />
      )}

      {showBlockModal && (
        <BlockModal
          spaces={spaces}
          prefilledDate={blockModalPrefill.date}
          prefilledHour={blockModalPrefill.hour}
          prefilledEspacioId={blockModalPrefill.espacioId}
          onClose={() => setShowBlockModal(false)}
          onConfirm={handleCreateBlock}
        />
      )}

      {showExceptionModal && (
        <ExceptionModal
          exception={editingException}
          onClose={() => { setShowExceptionModal(false); setEditingException(undefined); }}
          onConfirm={handleSaveException}
        />
      )}

      {showCreateAvailModal && (
        <CreateAvailabilityModal
          spaces={spaces}
          prefilledEspacioId={activeEspacioId}
          prefilledDate={formatISODate(weekStart)}
          onClose={() => setShowCreateAvailModal(false)}
          onConfirm={handleCreateAvailability}
        />
      )}

      <ToastList toasts={toasts} />
    </div>
  );
}

"use client";

import { useCallback, useState } from "react";
import { Lock, AlertCircle, CheckCircle2, XCircle, Tent } from "lucide-react";

import type {
  Block,
  ViewMode,
  Schedule,
  AvailabilityException,
  ToastMessage,
  Espacio,
} from "../types";
import {
  useServerNow,
  useAvailabilityBlocks,
  useAvailabilityStatistics,
  useSchedule,
  useExceptions,
} from "../hooks/useAvailability";
import {
  useCreateBlock,
  useDeleteBlock,
  useSaveSchedule,
  useSaveException,
  useDeleteException,
} from "../hooks/useAvailabilityActions";
import { getWeekStart } from "../utils/date";
import { getArchetype } from "@/lib/domain";
import { HeaderSpaceSelector } from "@/components/ui/HeaderSpaceSelector";

import { AvailabilityStats } from "./AvailabilityStats";
import { AvailabilityToolbar } from "./AvailabilityToolbar";
import { AvailabilityCalendar } from "./AvailabilityCalendar";
import { AvailabilityBlockDrawer } from "./AvailabilityBlockDrawer";
import { GeneralScheduleCard } from "./GeneralScheduleCard";
import { ExceptionsCard } from "./ExceptionsCard";
import { BlockModal } from "./BlockModal";
import { ExceptionModal } from "./ExceptionModal";
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
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const addToast = useCallback((type: "success" | "error", message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  // ── Data ──────────────────────────────────────────────────────────────────

  // Los espacios de cupo compartido (piscinas) no usan la grilla horaria: usan
  // el panel de aforo. Se apagan sus queries para no pedir datos que no se
  // renderizan ni disparar un error innecesario.
  const selectedEspacio = spaces.find((s) => s.id === selectedEspacioId);
  const usaGrilla =
    getArchetype({ modalidadReserva: selectedEspacio?.modalidadReserva ?? null }) !==
    "cupo_compartido";

  const { data: serverNow } = useServerNow();
  const blocksQuery = useAvailabilityBlocks(selectedEspacioId, weekStart, usaGrilla);
  const statsQuery = useAvailabilityStatistics(selectedEspacioId, weekStart, usaGrilla);
  const { schedule, isLoading: isLoadingSchedule } = useSchedule(selectedEspacioId);
  const exceptionsQuery = useExceptions(selectedEspacioId);

  const blocks = blocksQuery.data ?? [];
  const exceptions = exceptionsQuery.data ?? [];

  // Feedback de error de carga (antes lo hacía el .catch de cada fetch). Se
  // deriva del estado de las queries en vez de empujarse con setState desde un
  // efecto: así el aviso se muestra mientras el error persiste y desaparece
  // solo cuando el refetch tiene éxito.
  const errorToasts: ToastMessage[] = [
    ...(blocksQuery.isError
      ? [{ id: "err-blocks", type: "error" as const, message: "No se pudo cargar la disponibilidad." }]
      : []),
    ...(exceptionsQuery.isError
      ? [{ id: "err-exceptions", type: "error" as const, message: "No se pudieron cargar las excepciones." }]
      : []),
  ];

  const createBlockMutation = useCreateBlock();
  const deleteBlockMutation = useDeleteBlock();
  const saveScheduleMutation = useSaveSchedule();
  const saveExceptionMutation = useSaveException();
  const deleteExceptionMutation = useDeleteException(selectedEspacioId);

  const isActingOnBlock = createBlockMutation.isPending || deleteBlockMutation.isPending;

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

  // Tras cada mutación la grilla se invalida y se vuelve a pedir al backend,
  // así que ya no hace falta reconciliar el array de bloques a mano.
  const handleBlockFromDrawer = async (block: Block) => {
    try {
      await createBlockMutation.mutateAsync({
        espacioId: block.espacioId,
        fecha: block.date,
        hourStart: block.hour,
        hourEnd: block.hour + 1,
        estado: "blocked",
      });
      setSelectedBlock(null);
      addToast("success", "Horario bloqueado correctamente.");
    } catch (e) {
      addToast("error", e instanceof Error ? e.message : "No se pudo bloquear el horario.");
    }
  };

  const handleReleaseFromDrawer = async (block: Block) => {
    try {
      await deleteBlockMutation.mutateAsync(block.id);
      setSelectedBlock(null);
      addToast("success", "Horario liberado correctamente.");
    } catch (e) {
      addToast("error", e instanceof Error ? e.message : "No se pudo liberar el horario.");
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
    await createBlockMutation.mutateAsync(data);
    setShowBlockModal(false);
    addToast("success", "Bloqueo creado correctamente.");
  };

  // ── Schedule ──────────────────────────────────────────────────────────────

  const handleSaveSchedule = async (s: Schedule) => {
    if (selectedEspacioId == null) return;
    await saveScheduleMutation.mutateAsync({ ...s, espacioId: selectedEspacioId });
    addToast("success", "Horario general guardado.");
  };

  // ── Exceptions ────────────────────────────────────────────────────────────

  const getActiveEspacioId = (): number | undefined => selectedEspacioId ?? undefined;

  const handleSaveException = async (data: Omit<AvailabilityException, "id">) => {
    const espacioId = getActiveEspacioId();
    if (!espacioId) return;

    await saveExceptionMutation.mutateAsync({
      id: editingException?.id,
      data: { ...data, espacioId },
    });
    addToast("success", editingException ? "Excepción actualizada." : "Excepción agregada.");
    setShowExceptionModal(false);
    setEditingException(undefined);
  };

  const handleDeleteException = async (id: string) => {
    await deleteExceptionMutation.mutateAsync(id);
    addToast("success", "Excepción eliminada.");
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (spaces.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-8 bg-background">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-20 text-center">
          <Tent className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="subtitle">No tienes espacios aún</h3>
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
          <h1 className="page-title">Agenda</h1>
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
          )}
        </div>
      </div>

      {/* KPI cards */}
      {!esCupoCompartido && (
        <div className="mb-8">
          <AvailabilityStats stats={statsQuery.data ?? null} isLoading={statsQuery.isPending} />
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
            isLoading={blocksQuery.isPending}
            onBlockClick={handleBlockClick}
            onEmptyCellClick={handleEmptyCellClick}
            serverNow={serverNow ?? null}
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

      <ToastList toasts={[...toasts, ...errorToasts]} />
    </div>
  );
}

"use client";

// DESPUÉS
import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CalendarDays, BanIcon } from "lucide-react";
import { WeekView } from "./WeekView";
import { DayView } from "./DayView";
import { AppointmentModal } from "./AppointmentModal";
import { BlockCalendarModal } from "./BlockCalendarModal";
import { StaffFilter } from "./StaffFilter";
import { CalendarAppointment } from "./AppointmentCard";
import { ScheduleBlock } from "@/db/schema";
import {
  getWeekStart,
  getWeekDays,
  formatDateKey,
  formatDayHeader,
} from "@/lib/calendar-utils";

type StaffOption = { id: string; name: string };

type Props = {
  staffList: StaffOption[];
};

export function CalendarClient({ staffList }: Props) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [isMobile, setIsMobile] = useState(false);
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<CalendarAppointment | null>(null);
  const [blockModalOpen, setBlockModalOpen] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const weekStart = getWeekStart(currentDate);
  const weekDays = getWeekDays(weekStart);

const fromDate = useMemo(
  () => isMobile ? formatDateKey(currentDate) : formatDateKey(weekStart),
  [isMobile, currentDate, weekStart]
);
const toDate = useMemo(
  () => isMobile ? formatDateKey(currentDate) : formatDateKey(weekDays[6]),
  [isMobile, currentDate, weekDays]
);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ from: fromDate, to: toDate });
      if (selectedStaffId) params.set("staffId", selectedStaffId);

      const [apptRes, blocksRes] = await Promise.all([
        fetch(`/api/appointments/calendar?${params}`),
        fetch(`/api/schedule-blocks?from=${fromDate}&to=${toDate}`),
      ]);

      const [apptData, blocksData] = await Promise.all([
        apptRes.json(),
        blocksRes.json(),
      ]);

      setAppointments(apptData);
      setBlocks(blocksData);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, selectedStaffId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function goToPrev() {
    const d = new Date(currentDate);
    isMobile ? d.setDate(d.getDate() - 1) : d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  }

  function goToNext() {
    const d = new Date(currentDate);
    isMobile ? d.setDate(d.getDate() + 1) : d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  function handleAppointmentCancelled(id: string) {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  }

  async function handleDeleteBlock(id: string) {
    await fetch(`/api/schedule-blocks/${id}`, { method: "DELETE" });
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  }

  const periodTitle = isMobile
    ? formatDayHeader(currentDate)
    : (() => {
        const start = weekDays[0];
        const end = weekDays[6];
        const startStr = `${start.getDate()}/${start.getMonth() + 1}`;
        const endStr = `${end.getDate()}/${end.getMonth() + 1}/${end.getFullYear()}`;
        return `${startStr} – ${endStr}`;
      })();

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Hoy
          </Button>
          <span className="text-sm font-medium text-gray-700 ml-1">{periodTitle}</span>
        </div>

        <div className="flex items-center gap-2">
          <StaffFilter
            staffList={staffList}
            selectedStaffId={selectedStaffId}
            onChange={setSelectedStaffId}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBlockModalOpen(true)}
            className="text-destructive border-destructive/40 hover:bg-destructive/10"
          >
            <BanIcon className="h-4 w-4 mr-1" />
            Bloquear agenda
          </Button>
        </div>
      </div>

      {/* Leyenda de colores */}
      <div className="flex flex-wrap gap-2 mb-3">
        {[
          { label: "Consulta",     color: "bg-blue-200"   },
          { label: "Cirugía",      color: "bg-red-200"    },
          { label: "Peluquería",   color: "bg-pink-200"   },
          { label: "Vacunación",   color: "bg-green-200"  },
          { label: "Domicilio",    color: "bg-orange-200" },
          { label: "Reproducción", color: "bg-purple-200" },
          { label: "Cardiología",  color: "bg-violet-200" },
        ].map(({ label, color }) => (
          <span key={label} className="flex items-center gap-1 text-xs text-gray-600">
            <span className={`w-3 h-3 rounded-full ${color}`} />
            {label}
          </span>
        ))}
        <span className="flex items-center gap-1 text-xs text-gray-600">
          <span className="w-3 h-3 rounded-full bg-gray-300" />
          Bloqueado
        </span>
      </div>

      {/* Calendario */}
      <div className="flex-1 overflow-auto border border-gray-200 rounded-lg bg-white">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
            <CalendarDays className="h-5 w-5 mr-2 animate-pulse" />
            Cargando turnos...
          </div>
        ) : isMobile ? (
          <DayView
            date={currentDate}
            appointments={appointments}
            blocks={blocks}
            onAppointmentClick={setSelectedAppointment}
            onDeleteBlock={handleDeleteBlock}
          />
        ) : (
          <WeekView
            weekStart={weekStart}
            appointments={appointments}
            blocks={blocks}
            onAppointmentClick={setSelectedAppointment}
            onDeleteBlock={handleDeleteBlock}
          />
        )}
      </div>

      <AppointmentModal
        appointment={selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        onCancelled={handleAppointmentCancelled}
      />

      <BlockCalendarModal
        open={blockModalOpen}
        onClose={() => setBlockModalOpen(false)}
        onCreated={fetchData}
      />
    </div>
  );
}
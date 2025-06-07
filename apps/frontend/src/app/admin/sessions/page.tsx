// src/app/schedule/page.tsx
"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Calendar,
  Clock,
  Users,
  MapPin,
  Filter,
  Search,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  User,
  Brain,
  Building,
} from "lucide-react";

// Types
interface ScheduleEvent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  type: "individual" | "group" | "online";
  module: string;
  participants: string[];
  maxParticipants: number;
  status: "scheduled" | "ongoing" | "completed" | "cancelled";
  notes?: string;
  createdBy: string;
  company: string;
}

// Dummy data untuk jadwal
const dummySchedules: ScheduleEvent[] = [
  {
    id: "SCH001",
    title: "Sesi Psikotes Batch Januari - PT ABC",
    date: "2025-01-30",
    startTime: "09:00",
    endTime: "11:30",
    location: "Ruang Meeting A - Lantai 3",
    type: "group",
    module: "DISC Assessment + IQ Test",
    participants: [
      "Ahmad Fauzi",
      "Siti Nurhaliza",
      "Budi Santoso",
      "Diana Putri",
    ],
    maxParticipants: 8,
    status: "scheduled",
    notes: "Pastikan proyektor dan sound system berfungsi dengan baik",
    createdBy: "Admin HR",
    company: "PT ABC Corporation",
  },
  {
    id: "SCH002",
    title: "Tes Individual - Management Trainee",
    date: "2025-01-30",
    startTime: "14:00",
    endTime: "15:30",
    location: "Online - Zoom Room",
    type: "online",
    module: "Big Five Personality + EQ Test",
    participants: ["Maya Sari"],
    maxParticipants: 1,
    status: "ongoing",
    notes: "Kandidat sudah dikirim link meeting",
    createdBy: "Dr. Sarah Psikolog",
    company: "PT XYZ Industries",
  },
  {
    id: "SCH003",
    title: "Psikotes Karyawan Internal",
    date: "2025-01-31",
    startTime: "08:30",
    endTime: "10:00",
    location: "Ruang Training B",
    type: "group",
    module: "Leadership Style Assessment",
    participants: ["Andi Kurniawan", "Lestari Dewi", "Hendro Wijaya"],
    maxParticipants: 5,
    status: "scheduled",
    notes: "Untuk promosi internal ke posisi supervisor",
    createdBy: "Admin HR",
    company: "Syntegra Services",
  },
  {
    id: "SCH004",
    title: "Evaluasi Psikologi Calon Manager",
    date: "2025-02-01",
    startTime: "10:00",
    endTime: "12:00",
    location: "Ruang Konsultasi - Lt. 2",
    type: "individual",
    module: "Comprehensive Assessment",
    participants: ["Fitri Handayani"],
    maxParticipants: 1,
    status: "scheduled",
    createdBy: "Dr. Michael Hartono",
    company: "PT DEF Group",
  },
  {
    id: "SCH005",
    title: "Tes Massal Fresh Graduate",
    date: "2025-02-03",
    startTime: "13:00",
    endTime: "16:00",
    location: "Auditorium Utama",
    type: "group",
    module: "Holland Interest + Stress Management",
    participants: [
      "Dedi Supriadi",
      "Nur Aini",
      "Agus Setiawan",
      "Wulan Dari",
      "Irwan Setiabudi",
    ],
    maxParticipants: 20,
    status: "scheduled",
    notes: "Program rekrutmen fresh graduate 2025",
    createdBy: "Admin HR",
    company: "PT GHI Technology",
  },
  {
    id: "SCH006",
    title: "Follow-up Assessment",
    date: "2025-01-29",
    startTime: "15:30",
    endTime: "16:30",
    location: "Online - Microsoft Teams",
    type: "individual",
    module: "Interview + Feedback Session",
    participants: ["Ratna Sari"],
    maxParticipants: 1,
    status: "completed",
    createdBy: "Dr. Linda Sari",
    company: "PT JKL Consulting",
  },
];

// Status badge component
const StatusBadge = ({ status }: { status: ScheduleEvent["status"] }) => {
  const variants = {
    scheduled: "bg-blue-100 text-blue-700 hover:bg-blue-200",
    ongoing: "bg-green-100 text-green-700 hover:bg-green-200",
    completed: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    cancelled: "bg-red-100 text-red-700 hover:bg-red-200",
  };

  const labels = {
    scheduled: "Terjadwal",
    ongoing: "Berlangsung",
    completed: "Selesai",
    cancelled: "Dibatalkan",
  };

  return (
    <Badge className={variants[status]} variant="secondary">
      {labels[status]}
    </Badge>
  );
};

// Type badge component
const TypeBadge = ({ type }: { type: ScheduleEvent["type"] }) => {
  const variants = {
    individual: "bg-purple-100 text-purple-700",
    group: "bg-emerald-100 text-emerald-700",
    online: "bg-cyan-100 text-cyan-700",
  };

  const labels = {
    individual: "Individual",
    group: "Grup",
    online: "Online",
  };

  return (
    <Badge className={variants[type]} variant="secondary">
      {labels[type]}
    </Badge>
  );
};

// Calendar component
const MiniCalendar = ({
  selectedDate,
  onDateSelect,
}: {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();

  const today = new Date();

  const prevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  };

  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  // Check if date has events
  const hasEvents = (date: number) => {
    const checkDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      date
    );
    const dateString = checkDate.toISOString().split("T")[0];
    return dummySchedules.some((schedule) => schedule.date === dateString);
  };

  const isSelected = (date: number) => {
    const checkDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      date
    );
    return checkDate.toDateString() === selectedDate.toDateString();
  };

  const isToday = (date: number) => {
    const checkDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      date
    );
    return checkDate.toDateString() === today.toDateString();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </CardTitle>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-muted-foreground p-2"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for days before the first day of the month */}
          {Array.from({ length: firstDayOfMonth }, (_, i) => (
            <div key={`empty-${i}`} className="h-8"></div>
          ))}

          {/* Days of the month */}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const date = i + 1;
            return (
              <button
                key={date}
                onClick={() =>
                  onDateSelect(
                    new Date(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth(),
                      date
                    )
                  )
                }
                className={`
                  h-8 w-8 text-sm rounded-md flex items-center justify-center relative
                  hover:bg-primary/10 transition-colors
                  ${
                    isSelected(date) ? "bg-primary text-primary-foreground" : ""
                  }
                  ${isToday(date) ? "ring-2 ring-primary ring-offset-1" : ""}
                `}
              >
                {date}
                {hasEvents(date) && (
                  <div className="absolute bottom-0 right-0 w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Ada jadwal</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showNewScheduleDialog, setShowNewScheduleDialog] = useState(false);

  // Filter schedules based on selected date and filters
  const filteredSchedules = useMemo(() => {
    const selectedDateString = selectedDate.toISOString().split("T")[0];

    return dummySchedules.filter((schedule) => {
      const matchesDate = schedule.date === selectedDateString;
      const matchesSearch =
        schedule.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schedule.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schedule.participants.some((p) =>
          p.toLowerCase().includes(searchTerm.toLowerCase())
        );
      const matchesStatus =
        statusFilter === "all" || schedule.status === statusFilter;
      const matchesType = typeFilter === "all" || schedule.type === typeFilter;

      return matchesDate && matchesSearch && matchesStatus && matchesType;
    });
  }, [selectedDate, searchTerm, statusFilter, typeFilter]);

  // Get all schedules for statistics
  const todaySchedules = dummySchedules.filter(
    (s) => s.date === new Date().toISOString().split("T")[0]
  );
  const stats = {
    today: todaySchedules.length,
    ongoing: dummySchedules.filter((s) => s.status === "ongoing").length,
    upcoming: dummySchedules.filter((s) => s.status === "scheduled").length,
    thisWeek: dummySchedules.filter((s) => {
      const scheduleDate = new Date(s.date);
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return scheduleDate >= weekStart && scheduleDate <= weekEnd;
    }).length,
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Jadwal & Sesi Psikotes
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm">
            Kelola jadwal tes psikotes, atur sesi evaluasi, dan pantau kehadiran
            peserta dengan sistem penjadwalan yang terintegrasi.
          </p>
        </div>

        <Button
          onClick={() => setShowNewScheduleDialog(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Buat Jadwal Baru
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hari Ini</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.today}
            </div>
            <p className="text-xs text-muted-foreground">
              Jadwal untuk hari ini
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Sedang Berlangsung
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.ongoing}
            </div>
            <p className="text-xs text-muted-foreground">Sesi aktif saat ini</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Akan Datang</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.upcoming}
            </div>
            <p className="text-xs text-muted-foreground">Jadwal terjadwal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Minggu Ini</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.thisWeek}
            </div>
            <p className="text-xs text-muted-foreground">
              Total sesi minggu ini
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-12">
        {/* Left Side - Schedule List (8 columns) */}
        <div className="md:col-span-8 space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter & Pencarian
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 md:flex-row md:items-end">
                <div className="flex-1">
                  <Label htmlFor="search">Cari Jadwal</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Cari berdasarkan judul, perusahaan, atau peserta..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="w-full md:w-48">
                  <Label htmlFor="status-filter">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Semua Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="scheduled">Terjadwal</SelectItem>
                      <SelectItem value="ongoing">Berlangsung</SelectItem>
                      <SelectItem value="completed">Selesai</SelectItem>
                      <SelectItem value="cancelled">Dibatalkan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full md:w-48">
                  <Label htmlFor="type-filter">Tipe</Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Semua Tipe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Tipe</SelectItem>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="group">Grup</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selected Date Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">
                Jadwal untuk{" "}
                {selectedDate.toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </h3>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              Ditemukan {filteredSchedules.length} jadwal pada tanggal ini
            </p>
          </div>

          {/* Schedule List */}
          <div className="space-y-4">
            {filteredSchedules.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-24 w-24 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Tidak Ada Jadwal</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Belum ada jadwal untuk tanggal yang dipilih
                  </p>
                  <Button onClick={() => setShowNewScheduleDialog(true)}>
                    Buat Jadwal Baru
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredSchedules.map((schedule) => (
                <Card
                  key={schedule.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">
                            {schedule.title}
                          </CardTitle>
                          <StatusBadge status={schedule.status} />
                          <TypeBadge type={schedule.type} />
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Building className="h-4 w-4" />
                            {schedule.company}
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {schedule.createdBy}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {schedule.startTime} - {schedule.endTime}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{schedule.location}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Brain className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{schedule.module}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {schedule.participants.length} /{" "}
                            {schedule.maxParticipants} peserta
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm font-medium">Peserta:</div>
                          <div className="flex flex-wrap gap-1">
                            {schedule.participants
                              .slice(0, 3)
                              .map((participant, index) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {participant}
                                </Badge>
                              ))}
                            {schedule.participants.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{schedule.participants.length - 3} lainnya
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {schedule.notes && (
                      <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                        <div className="text-sm">
                          <span className="font-medium">Catatan: </span>
                          {schedule.notes}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Right Side - Calendar (4 columns) */}
        <div className="md:col-span-4 space-y-4">
          <MiniCalendar
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Aksi Cepat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => setShowNewScheduleDialog(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Buat Jadwal Baru
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Lihat Semua Jadwal
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Kelola Peserta
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Clock className="mr-2 h-4 w-4" />
                Pengaturan Waktu
              </Button>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle>Jadwal Mendatang</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dummySchedules
                  .filter((s) => s.status === "scheduled")
                  .slice(0, 3)
                  .map((schedule) => (
                    <div
                      key={schedule.id}
                      className="flex items-center gap-3 p-2 rounded-lg border"
                    >
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <div className="text-sm font-medium truncate">
                          {schedule.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(schedule.date).toLocaleDateString("id-ID", {
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          • {schedule.startTime}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* New Schedule Dialog */}
      <Dialog
        open={showNewScheduleDialog}
        onOpenChange={setShowNewScheduleDialog}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Buat Jadwal Baru</DialogTitle>
            <DialogDescription>
              Atur jadwal sesi psikotes baru untuk kandidat atau karyawan
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="schedule-title">Judul Sesi</Label>
              <Input
                id="schedule-title"
                placeholder="Contoh: Psikotes Batch Februari - PT ABC"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="schedule-date">Tanggal</Label>
                <Input
                  id="schedule-date"
                  type="date"
                  defaultValue={selectedDate.toISOString().split("T")[0]}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="schedule-company">Perusahaan</Label>
                <Input id="schedule-company" placeholder="Nama perusahaan" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start-time">Waktu Mulai</Label>
                <Input id="start-time" type="time" defaultValue="09:00" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="end-time">Waktu Selesai</Label>
                <Input id="end-time" type="time" defaultValue="11:00" />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="location">Lokasi</Label>
              <Input
                id="location"
                placeholder="Ruang meeting, alamat, atau platform online"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="session-type">Tipe Sesi</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tipe sesi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="group">Grup</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="max-participants">Maksimal Peserta</Label>
                <Input
                  id="max-participants"
                  type="number"
                  placeholder="8"
                  defaultValue="8"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="module">Modul Psikotes</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih modul yang akan digunakan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disc">DISC Assessment</SelectItem>
                  <SelectItem value="iq">IQ Test (WAIS-IV)</SelectItem>
                  <SelectItem value="bigfive">Big Five Personality</SelectItem>
                  <SelectItem value="eq">Emotional Intelligence</SelectItem>
                  <SelectItem value="holland">
                    Holland Interest Inventory
                  </SelectItem>
                  <SelectItem value="comprehensive">
                    Comprehensive Assessment
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Catatan (Opsional)</Label>
              <Textarea
                id="notes"
                placeholder="Tambahkan catatan khusus untuk sesi ini..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewScheduleDialog(false)}
            >
              Batal
            </Button>
            <Button onClick={() => setShowNewScheduleDialog(false)}>
              Buat Jadwal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Eye,
  Clock,
  Users,
  Brain,
  Target,
  BookOpen,
  FileText,
  ChevronLeft,
  ChevronRight,
  Settings,
  BarChart3,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useTests } from "@/hooks/useTests";
import { toast } from "sonner";

// Module type labels mapping
const MODULE_TYPE_LABELS = {
  intelligence: "Inteligensi",
  personality: "Kepribadian",
  aptitude: "Bakat",
  interest: "Minat",
  projective: "Proyektif",
  cognitive: "Kognitif",
} as const;

// Category labels mapping
const CATEGORY_LABELS = {
  wais: "WAIS",
  mbti: "MBTI",
  wartegg: "Wartegg",
  riasec: "RIASEC",
  kraepelin: "Kraepelin",
  pauli: "Pauli",
  big_five: "Big Five",
  papi_kostick: "PAPI Kostick",
  dap: "DAP",
  raven: "Raven",
  epps: "EPPS",
  army_alpha: "Army Alpha",
  htp: "HTP",
  disc: "DISC",
  iq: "IQ Test",
  eq: "EQ Test",
} as const;

// Status badge component
const StatusBadge = ({
  status,
}: {
  status: "active" | "inactive" | "archived";
}) => {
  const variants = {
    active: "bg-green-100 text-green-700 hover:bg-green-200",
    inactive: "bg-red-100 text-red-700 hover:bg-red-200",
    archived: "bg-gray-100 text-gray-700 hover:bg-gray-200",
  };

  const labels = {
    active: "Aktif",
    inactive: "Tidak Aktif",
    archived: "Diarsipkan",
  };

  return (
    <Badge className={variants[status]} variant="secondary">
      {labels[status]}
    </Badge>
  );
};

// Module type badge component
const ModuleTypeBadge = ({
  moduleType,
}: {
  moduleType: keyof typeof MODULE_TYPE_LABELS;
}) => {
  const variants = {
    intelligence: "bg-cyan-100 text-cyan-700",
    personality: "bg-pink-100 text-pink-700",
    aptitude: "bg-emerald-100 text-emerald-700",
    interest: "bg-amber-100 text-amber-700",
    projective: "bg-purple-100 text-purple-700",
    cognitive: "bg-indigo-100 text-indigo-700",
  };

  return (
    <Badge className={variants[moduleType]} variant="secondary">
      {MODULE_TYPE_LABELS[moduleType]}
    </Badge>
  );
};

// Category badge component
const CategoryBadge = ({
  category,
}: {
  category: keyof typeof CATEGORY_LABELS;
}) => {
  return (
    <Badge variant="outline" className="text-xs">
      {CATEGORY_LABELS[category]}
    </Badge>
  );
};

export default function AdminTestsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [moduleTypeFilter, setModuleTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // API calls
  const {
    useGetTests,
    useGetTestStats,
    useGetTestFilterOptions,
    useDeleteTest,
  } = useTests();

  // Get tests with current filters
  const testsQuery = useGetTests({
    page: currentPage,
    limit: itemsPerPage,
    search: searchTerm || undefined,
    module_type:
      moduleTypeFilter !== "all" ? (moduleTypeFilter as any) : undefined,
    category: categoryFilter !== "all" ? (categoryFilter as any) : undefined,
    status: statusFilter !== "all" ? (statusFilter as any) : undefined,
    sort_by: "display_order",
    sort_order: "asc",
  });

  // Get test statistics
  const statsQuery = useGetTestStats();

  // Get filter options
  const filterOptionsQuery = useGetTestFilterOptions();

  // Delete mutation
  const deleteTestMutation = useDeleteTest();

  // Reset pagination when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  // Format tanggal
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Handle delete test
  const handleDeleteTest = async (testId: string, testName: string) => {
    if (
      window.confirm(`Apakah Anda yakin ingin menghapus tes "${testName}"?`)
    ) {
      try {
        await deleteTestMutation.mutateAsync(testId);
        toast.success("Tes berhasil dihapus");
      } catch (error: any) {
        toast.error("Gagal menghapus tes", {
          description: error.message || "Terjadi kesalahan saat menghapus tes",
        });
      }
    }
  };

  // Loading state
  if (testsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="size-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Memuat data tes...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (testsQuery.error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="size-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-600 mb-2">
              Gagal Memuat Data
            </h3>
            <p className="text-muted-foreground mb-4">
              {testsQuery.error.message ||
                "Terjadi kesalahan saat memuat data tes"}
            </p>
            <Button onClick={() => testsQuery.refetch()} variant="outline">
              <RefreshCw className="size-4 mr-2" />
              Coba Lagi
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const tests = testsQuery.data?.data || [];
  const meta = testsQuery.data?.meta;
  const stats = statsQuery.data?.data;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Modul Psikotes</h1>
          <p className="text-muted-foreground max-w-2xl">
            Kelola berbagai jenis modul psikotes untuk evaluasi kandidat. Buat
            modul baru, edit yang sudah ada, dan pantau performa setiap tes
            untuk pengambilan keputusan yang tepat.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              testsQuery.refetch();
              statsQuery.refetch();
            }}
            disabled={testsQuery.isFetching}
          >
            <RefreshCw
              className={`h-4 w-4 ${testsQuery.isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button variant="outline" className="gap-2">
            <Settings className="h-4 w-4" />
            Pengaturan
          </Button>
          <Button asChild className="gap-2">
            <Link href="/admin/tests/new">
              <Plus className="h-4 w-4" />
              Buat Tes Baru
            </Link>
          </Button>
        </div>
      </div>

      {/* Statistik Singkat */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_tests || 0}</div>
            <p className="text-xs text-muted-foreground">
              Tersedia dalam sistem
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tes Aktif</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.active_tests || 0}
            </div>
            <p className="text-xs text-muted-foreground">Siap digunakan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tidak Aktif</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats?.inactive_tests || 0}
            </div>
            <p className="text-xs text-muted-foreground">Tidak digunakan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Rata-rata Durasi
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(stats?.avg_time_limit || 0)} min
            </div>
            <p className="text-xs text-muted-foreground">Waktu pengerjaan</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter dan Pencarian */}
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
              <Label htmlFor="search">Cari Tes</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Cari nama tes, deskripsi..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    handleFilterChange();
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="w-full md:w-48">
              <Label>Tipe Modul</Label>
              <Select
                value={moduleTypeFilter}
                onValueChange={(value) => {
                  setModuleTypeFilter(value);
                  handleFilterChange();
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  {filterOptionsQuery.data?.data.module_types.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-48">
              <Label>Kategori</Label>
              <Select
                value={categoryFilter}
                onValueChange={(value) => {
                  setCategoryFilter(value);
                  handleFilterChange();
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {filterOptionsQuery.data?.data.categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-48">
              <Label>Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  handleFilterChange();
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  {filterOptionsQuery.data?.data.statuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabel Tests */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Tes Psikotes</CardTitle>
          <CardDescription>
            {meta
              ? `Menampilkan ${tests.length} dari ${meta.total} tes`
              : "Memuat data..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama & Kategori</TableHead>
                  <TableHead>Tipe & Durasi</TableHead>
                  <TableHead>Pertanyaan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dibuat</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {testsQuery.isFetching ? (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="size-4 animate-spin" />
                            Memuat data...
                          </div>
                        ) : (
                          "Tidak ada tes yang ditemukan"
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  tests.map((test) => (
                    <TableRow key={test.id}>
                      <TableCell>
                        <Link href={`/admin/tests/${test.id}`}>
                          <div className="space-y-2">
                            <div className="font-medium hover:underline cursor-pointer">
                              {test.name}
                            </div>
                            <div className="flex items-center gap-2">
                              <CategoryBadge
                                category={
                                  test.category as keyof typeof CATEGORY_LABELS
                                }
                              />
                            </div>
                            {test.description && (
                              <div className="text-sm text-muted-foreground max-w-xs truncate">
                                {test.description}
                              </div>
                            )}
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <ModuleTypeBadge
                            moduleType={
                              test.module_type as keyof typeof MODULE_TYPE_LABELS
                            }
                          />
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {test.time_limit} menit
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <FileText className="h-3 w-3 text-muted-foreground" />
                          {test.total_questions || 0} soal
                        </div>
                        {test.passing_score && (
                          <div className="text-xs text-muted-foreground">
                            Passing: {test.passing_score}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={test.status || "active"} />
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div>{formatDate(test.created_at as any)}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Buka menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Aksi Tes</DropdownMenuLabel>
                            <Link href={`/admin/tests/${test.id}`}>
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                Lihat Detail
                              </DropdownMenuItem>
                            </Link>
                            <Link href={`/admin/tests/edit?testId=${test.id}`}>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Tes
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplikasi
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <Link href={`/admin/tests/${test.id}/questions`}>
                              <DropdownMenuItem>
                                <FileText className="mr-2 h-4 w-4" />
                                Kelola Pertanyaan
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem>
                              <BarChart3 className="mr-2 h-4 w-4" />
                              Lihat Statistik
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() =>
                                handleDeleteTest(test.id, test.name)
                              }
                              disabled={deleteTestMutation.isPending}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {deleteTestMutation.isPending
                                ? "Menghapus..."
                                : "Hapus Tes"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {meta && meta.total_pages > 1 && (
            <div className="flex items-center justify-between px-2 py-4">
              <div className="text-sm text-muted-foreground">
                Menampilkan {(meta.current_page - 1) * meta.per_page + 1} hingga{" "}
                {Math.min(meta.current_page * meta.per_page, meta.total)} dari{" "}
                {meta.total} tes
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!meta.has_prev_page}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Sebelumnya
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from(
                    { length: Math.min(5, meta.total_pages) },
                    (_, i) => {
                      let page;
                      if (meta.total_pages <= 5) {
                        page = i + 1;
                      } else if (currentPage <= 3) {
                        page = i + 1;
                      } else if (currentPage >= meta.total_pages - 2) {
                        page = meta.total_pages - 4 + i;
                      } else {
                        page = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-8 h-8 p-0"
                        >
                          {page}
                        </Button>
                      );
                    }
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!meta.has_next_page}
                >
                  Berikutnya
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions Section */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/admin/tests/new">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors mb-3">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Buat Tes Baru</CardTitle>
              <CardDescription>
                Mulai dari template atau buat tes psikotes kustom sesuai
                kebutuhan spesifik
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors mb-3">
              <Copy className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>Import Template</CardTitle>
            <CardDescription>
              Import tes dari template standar industri atau file eksternal
            </CardDescription>
          </CardHeader>
        </Card>

        <Link href="/admin/tests/analytics">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors mb-3">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Analisis Performa</CardTitle>
              <CardDescription>
                Lihat statistik lengkap dan performa semua tes yang telah
                digunakan
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Info Panel */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Brain className="h-5 w-5" />
            Tips Penggunaan Tes
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">Praktik Terbaik:</h4>
              <ul className="text-sm space-y-1">
                <li>
                  • Gunakan kombinasi beberapa tes untuk evaluasi komprehensif
                </li>
                <li>
                  • Sesuaikan durasi tes dengan tingkat posisi yang dilamar
                </li>
                <li>
                  • Lakukan kalibrasi berkala untuk memastikan validitas hasil
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Rekomendasi Tes:</h4>
              <ul className="text-sm space-y-1">
                <li>
                  • <strong>Security:</strong> WAIS, MBTI, Wartegg, RIASEC
                </li>
                <li>
                  • <strong>Staff:</strong> Kraepelin, Big Five, PAPI Kostick,
                  DAP
                </li>
                <li>
                  • <strong>Manager:</strong> Raven, EPPS, Army Alpha, HTP
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

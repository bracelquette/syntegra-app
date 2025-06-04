"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Plus,
  Download,
  Users,
  UserCheck,
  Clock,
  UserX,
  MoreHorizontal,
  Edit2,
  Trash2,
  MapPin,
  Calendar,
  Mail,
  Eye,
  Edit,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useUsers } from "@/hooks/useUsers";
import type { UserData, GetUsersRequest } from "shared-types";
import { Label } from "@/components/ui/label";

export default function UsersManagementPage() {
  // Filter states
  const [filters, setFilters] = useState<GetUsersRequest>({
    page: 1,
    limit: 1,
    search: "",
    role: "participant",
    gender: undefined,
    is_active: undefined,
    sort_by: "created_at",
    sort_order: "desc",
  });

  // Get users data
  const { useGetUsers } = useUsers();
  const { data: usersResponse, isLoading, error } = useGetUsers(filters);
  console.log("usersResponse", usersResponse);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!usersResponse?.data)
      return { total: 0, completed: 0, testing: 0, notStarted: 0 };

    const participants = usersResponse.data.filter(
      (user) => user.role === "participant"
    );
    return {
      total: participants.length,
      completed: 5, // Mock data - ini bisa diambil dari test results
      testing: 4, // Mock data - sedang mengerjakan test
      notStarted: participants.length - 9, // Mock calculation
    };
  }, [usersResponse?.data]);

  // Handle filter changes
  const updateFilter = (key: keyof GetUsersRequest, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key !== "page" ? 1 : value, // Reset to page 1 when changing filters
    }));
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    updateFilter("page", page);
  };

  // Format age from birth_date
  const calculateAge = (birthDate: Date | null) => {
    if (!birthDate) return "-";
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      return age - 1;
    }
    return age;
  };

  // Get status badge
  const getStatusBadge = (user: UserData) => {
    // Mock logic for status - this would be based on test results
    const rand = Math.random();
    if (rand < 0.25)
      return <Badge className="bg-green-100 text-green-800">Lulus</Badge>;
    if (rand < 0.5)
      return <Badge className="bg-blue-100 text-blue-800">Sedang Test</Badge>;
    if (rand < 0.75)
      return <Badge className="bg-yellow-100 text-yellow-800">Terjadwal</Badge>;
    return <Badge className="bg-gray-100 text-gray-800">Belum Test</Badge>;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Manajemen Peserta
          </h1>
          <p className="text-muted-foreground">
            Kelola data peserta psikotes: pantau status tes, dan atur jadwal
            evaluasi dengan sistem yang terintegrasi dan efisien.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Import Data Peserta
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Tambah Peserta
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Peserta</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sudah Lulus</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.completed}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sedang Test</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.testing}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Belum Test</CardTitle>
            <UserX className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {stats.notStarted}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Section */}
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
              <Label htmlFor="search">Cari Peserta</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Cari nama, email, atau nomor HP..."
                  value={filters.search || ""}
                  onChange={(e) => updateFilter("search", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={filters.is_active?.toString()}
                onValueChange={(value) =>
                  updateFilter(
                    "is_active",
                    value === "all" ? undefined : value === "true"
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="true">Aktif</SelectItem>
                  <SelectItem value="false">Tidak Aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Jenis Kelamin</label>
              <Select
                value={filters.gender || "all"}
                onValueChange={(value) =>
                  updateFilter("gender", value === "all" ? undefined : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="male">Laki-laki</SelectItem>
                  <SelectItem value="female">Perempuan</SelectItem>
                  <SelectItem value="other">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Peserta</CardTitle>
          <CardDescription>
            {usersResponse?.meta && (
              <span>
                Menampilkan{"  "}
                {(usersResponse.meta.current_page - 1) *
                  usersResponse.meta.per_page +
                  1}{" "}
                dari {usersResponse.meta.total} peserta
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-muted-foreground">Memuat data...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-destructive">Gagal memuat data peserta</div>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Peserta</TableHead>
                      <TableHead>Jenis Kelamin</TableHead>
                      <TableHead>Usia</TableHead>
                      <TableHead>Domisili</TableHead>
                      <TableHead>Kontak</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tanggal Daftar</TableHead>
                      <TableHead className="w-[50px]">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersResponse?.data?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-semibold text-sm">
                              {user.name}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">
                          {user.gender === "male"
                            ? "Laki-laki"
                            : user.gender === "female"
                              ? "Perempuan"
                              : "Lainnya"}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">
                              {calculateAge(user.birth_date)} tahun
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {user.birth_date
                                ? new Date(user.birth_date).toLocaleDateString(
                                    "id-ID",
                                    {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    }
                                  )
                                : "-"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="max-w-[150px] truncate">
                              {user.regency && user.province
                                ? `${user.regency}, ${user.province}`
                                : user.address || "-"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">{user.phone || "-"}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          {getStatusBadge(user)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(user.created_at).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
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
                              <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                              <DropdownMenuItem
                              // onClick={}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Lihat Detail
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Peserta
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Hapus Peserta
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {usersResponse?.meta && usersResponse.meta.total_pages > 1 && (
                <div className="flex items-center justify-between py-4">
                  <div className="text-sm text-muted-foreground">
                    Menampilkan {usersResponse.meta.current_page} dari{" "}
                    {usersResponse.meta.total_pages} halaman
                  </div>
                  <div className="flex items-center space-x-2">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() =>
                              handlePageChange(
                                Number(usersResponse.meta.current_page) - 1
                              )
                            }
                            className={
                              usersResponse.meta.has_prev_page
                                ? "cursor-pointer"
                                : "cursor-not-allowed opacity-50"
                            }
                          />
                        </PaginationItem>

                        <PaginationItem>
                          <PaginationNext
                            onClick={() =>
                              handlePageChange(
                                Number(usersResponse.meta.current_page) + 1
                              )
                            }
                            className={
                              usersResponse.meta.has_next_page
                                ? "cursor-pointer"
                                : "cursor-not-allowed opacity-50"
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

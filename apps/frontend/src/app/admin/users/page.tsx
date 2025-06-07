"use client";

import React, { useState, useMemo } from "react";
import { Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUsers } from "@/hooks/useUsers";
import type { GetUsersRequest } from "shared-types";
import { useModalStore } from "@/stores/useModalStore";
import { CreateUserDialog } from "@/components/modals/CreateUserDialog";
import { UpdateUserDialog } from "@/components/modals/UpdateUserDialog";
import { CardAnalyticsUser } from "./_components/CardAnalyticsUser";
import { FilterUser } from "./_components/FilterUser";
import { TableUser } from "./_components/TableUser";
import { DeleteUserDialog } from "./_components/DeleteUserDialog";

export default function UsersManagementPage() {
  const { openCreateUserModal, openEditUserModal } = useModalStore();

  // Filter states
  const [filters, setFilters] = useState<GetUsersRequest>({
    page: 1,
    limit: 10,
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

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Manajemen Peserta
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Kelola data peserta psikotes: pantau status tes, dan atur jadwal
            evaluasi dengan sistem yang terintegrasi dan efisien.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Import Data Peserta
          </Button>
          <Button className="gap-2" onClick={openCreateUserModal}>
            <Plus className="h-4 w-4" />
            Tambah Peserta
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <CardAnalyticsUser stats={stats} />

      {/* Filters Section */}
      <FilterUser filters={filters} onFilterChange={updateFilter} />

      {/* Users Table */}
      <TableUser
        usersResponse={usersResponse}
        isLoading={isLoading}
        error={error}
        filters={filters}
        onFilterChange={updateFilter}
        onPageChange={handlePageChange}
        onEditUser={openEditUserModal}
      />

      {/* Modals */}
      <CreateUserDialog />
      <UpdateUserDialog />
      <DeleteUserDialog />
    </div>
  );
}

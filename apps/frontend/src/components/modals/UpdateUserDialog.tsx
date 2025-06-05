"use client";

import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit,
} from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { useModalStore } from "@/stores/useModalStore";
import { useUsers } from "@/hooks/useUsers";
import type { UpdateUserRequest } from "shared-types";

// Form validation schema
const updateUserSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(255, "Nama terlalu panjang"),
  email: z.string().email("Format email tidak valid"),

  // Profile fields - keep simple but handle empty strings in form logic
  gender: z.enum(["male", "female", "other"]).optional(),
  phone: z
    .string()
    .max(20, "Nomor telepon terlalu panjang")
    .optional()
    .or(z.literal("")),
  birth_place: z
    .string()
    .max(100, "Tempat lahir terlalu panjang")
    .optional()
    .or(z.literal("")),
  birth_date: z.date().optional(),
  religion: z
    .enum([
      "islam",
      "kristen",
      "katolik",
      "hindu",
      "buddha",
      "konghucu",
      "other",
    ])
    .optional(),
  education: z
    .enum(["sd", "smp", "sma", "diploma", "s1", "s2", "s3", "other"])
    .optional(),
  address: z.string().optional().or(z.literal("")),
  province: z
    .string()
    .max(100, "Nama provinsi terlalu panjang")
    .optional()
    .or(z.literal("")),
  regency: z
    .string()
    .max(100, "Nama kabupaten terlalu panjang")
    .optional()
    .or(z.literal("")),
  district: z
    .string()
    .max(100, "Nama kecamatan terlalu panjang")
    .optional()
    .or(z.literal("")),
  village: z
    .string()
    .max(100, "Nama kelurahan terlalu panjang")
    .optional()
    .or(z.literal("")),
  postal_code: z
    .string()
    .max(10, "Kode pos terlalu panjang")
    .optional()
    .or(z.literal("")),
});

type UpdateUserFormData = z.infer<typeof updateUserSchema>;

export function UpdateUserDialog() {
  const { isEditUserModalOpen, editUserId, closeEditUserModal } =
    useModalStore();
  const { useGetUserById, useUpdateUser } = useUsers();

  // Get user data
  const {
    data: userData,
    isLoading: isLoadingUser,
    error: userError,
  } = useGetUserById(editUserId || "");
  const updateUserMutation = useUpdateUser();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    control,
    formState: { errors, isSubmitting, isValid, isDirty },
  } = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
    mode: "onChange", // Enable real-time validation
    defaultValues: {
      name: "",
      email: "",
      gender: undefined,
      phone: "",
      birth_place: "",
      birth_date: undefined,
      religion: undefined,
      education: undefined,
      address: "",
      province: "",
      regency: "",
      district: "",
      village: "",
      postal_code: "",
    },
  });

  // Populate form when user data is loaded
  useEffect(() => {
    if (userData?.data) {
      const user = userData.data;
      reset({
        name: user.name || "",
        email: user.email || "",
        gender: user.gender || undefined,
        phone: user.phone || "",
        birth_place: user.birth_place || "",
        birth_date: user.birth_date ? new Date(user.birth_date) : undefined,
        religion: user.religion || undefined,
        education: user.education || undefined,
        address: user.address || "",
        province: user.province || "",
        regency: user.regency || "",
        district: user.district || "",
        village: user.village || "",
        postal_code: user.postal_code || "",
      });
    }
  }, [userData]);

  const onSubmit = async (data: UpdateUserFormData) => {
    if (!editUserId) {
      toast.error("Gagal!", {
        description: "ID pengguna tidak ditemukan",
      });
      return;
    }

    try {
      // Convert form data to API format, handling empty strings
      const updateUserData: UpdateUserRequest = {
        name: data.name,
        email: data.email,
        gender: data.gender ?? "other",
        phone: data.phone && data.phone.trim() !== "" ? data.phone : undefined,
        birth_place:
          data.birth_place && data.birth_place.trim() !== ""
            ? data.birth_place
            : undefined,
        birth_date: data.birth_date ? new Date(data.birth_date) : undefined,
        religion: data.religion,
        education: data.education,
        address:
          data.address && data.address.trim() !== "" ? data.address : undefined,
        province:
          data.province && data.province.trim() !== ""
            ? data.province
            : undefined,
        regency:
          data.regency && data.regency.trim() !== "" ? data.regency : undefined,
        district:
          data.district && data.district.trim() !== ""
            ? data.district
            : undefined,
        village:
          data.village && data.village.trim() !== "" ? data.village : undefined,
        postal_code:
          data.postal_code && data.postal_code.trim() !== ""
            ? data.postal_code
            : undefined,
      };

      await updateUserMutation.mutateAsync({
        id: editUserId,
        data: updateUserData,
      });

      toast.success("Berhasil!", {
        description: "Data peserta berhasil diperbarui.",
      });

      handleClose();
    } catch (error: any) {
      console.error("Update user error:", error);

      const errorMessage = error?.message || "Gagal memperbarui data pengguna";
      toast.error("Gagal!", {
        description: errorMessage,
      });
    }
  };

  const handleClose = () => {
    reset();
    closeEditUserModal();
  };

  if (!isEditUserModalOpen) return null;

  return (
    <Dialog open={isEditUserModalOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Data Peserta
          </DialogTitle>
          <DialogDescription>
            Perbarui informasi peserta psikotes. Pastikan semua informasi yang
            dimasukkan sudah benar dan terbaru.
          </DialogDescription>
        </DialogHeader>

        {/* Loading State */}
        {isLoadingUser ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : userError ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center space-y-2">
              <div className="text-destructive">Gagal memuat data peserta</div>
              <Button variant="outline" onClick={handleClose}>
                Tutup
              </Button>
            </div>
          </div>
        ) : userData?.data ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Informasi Dasar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Lengkap *</Label>
                    <Input
                      id="name"
                      {...register("name")}
                      placeholder="Masukkan nama lengkap"
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        {...register("email")}
                        placeholder="contoh@email.com"
                        className="pl-10"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-destructive">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Informasi Pribadi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gender">Jenis Kelamin</Label>
                    <Controller
                      name="gender"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value || ""}
                          onValueChange={(value) =>
                            field.onChange(value || undefined)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Pilih jenis kelamin" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Laki-laki</SelectItem>
                            <SelectItem value="female">Perempuan</SelectItem>
                            <SelectItem value="other">Lainnya</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Nomor Telepon</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="phone"
                        {...register("phone")}
                        placeholder="+62812345678"
                        className="pl-10"
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-sm text-destructive">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="birth_place">Tempat Lahir</Label>
                    <Input
                      id="birth_place"
                      type="text"
                      {...register("birth_place")}
                      placeholder="Masukkan tempat lahir"
                    />
                    {errors.birth_place && (
                      <p className="text-sm text-destructive">
                        {errors.birth_place.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="birth_date">Tanggal Lahir</Label>
                    <Input
                      id="birth_date"
                      type="date"
                      {...register("birth_date")}
                    />
                    {errors.birth_date && (
                      <p className="text-sm text-destructive">
                        {errors.birth_date.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="religion">Agama</Label>
                    <Controller
                      name="religion"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value || ""}
                          onValueChange={(value) =>
                            field.onChange(value || undefined)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Pilih agama" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="islam">Islam</SelectItem>
                            <SelectItem value="kristen">Kristen</SelectItem>
                            <SelectItem value="katolik">Katolik</SelectItem>
                            <SelectItem value="hindu">Hindu</SelectItem>
                            <SelectItem value="buddha">Buddha</SelectItem>
                            <SelectItem value="konghucu">Konghucu</SelectItem>
                            <SelectItem value="other">Lainnya</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="education">Pendidikan</Label>
                    <Controller
                      name="education"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value || ""}
                          onValueChange={(value) =>
                            field.onChange(value || undefined)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Pilih pendidikan" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sd">SD</SelectItem>
                            <SelectItem value="smp">SMP</SelectItem>
                            <SelectItem value="sma">SMA</SelectItem>
                            <SelectItem value="diploma">Diploma</SelectItem>
                            <SelectItem value="s1">S1</SelectItem>
                            <SelectItem value="s2">S2</SelectItem>
                            <SelectItem value="s3">S3</SelectItem>
                            <SelectItem value="other">Lainnya</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Informasi Alamat
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Alamat Lengkap</Label>
                  <Textarea
                    id="address"
                    {...register("address")}
                    placeholder="Masukkan alamat lengkap"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="province">Provinsi</Label>
                    <Input
                      id="province"
                      {...register("province")}
                      placeholder="Masukkan provinsi"
                    />
                    {errors.province && (
                      <p className="text-sm text-destructive">
                        {errors.province.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="regency">Kabupaten/Kota</Label>
                    <Input
                      id="regency"
                      {...register("regency")}
                      placeholder="Masukkan kabupaten/kota"
                    />
                    {errors.regency && (
                      <p className="text-sm text-destructive">
                        {errors.regency.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="district">Kecamatan</Label>
                    <Input
                      id="district"
                      {...register("district")}
                      placeholder="Masukkan kecamatan"
                    />
                    {errors.district && (
                      <p className="text-sm text-destructive">
                        {errors.district.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="village">Kelurahan/Desa</Label>
                    <Input
                      id="village"
                      {...register("village")}
                      placeholder="Masukkan kelurahan/desa"
                    />
                    {errors.village && (
                      <p className="text-sm text-destructive">
                        {errors.village.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postal_code">Kode Pos</Label>
                    <Input
                      id="postal_code"
                      {...register("postal_code")}
                      placeholder="12345"
                      maxLength={10}
                    />
                    {errors.postal_code && (
                      <p className="text-sm text-destructive">
                        {errors.postal_code.message}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={
                  isSubmitting || (!isValid && Object.keys(errors).length > 0)
                }
                className="relative"
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </DialogFooter>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

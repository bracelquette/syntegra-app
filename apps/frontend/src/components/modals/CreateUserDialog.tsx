"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, User, Mail, Phone, MapPin, Calendar } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";

import { useModalStore } from "@/stores/useModalStore";
import { useUsers } from "@/hooks/useUsers";
import type { CreateUserRequest } from "shared-types";

// Form validation schema
const createUserSchema = z.object({
  nik: z.string().min(1, "NIK wajib diisi").max(16, "NIK maksimal 16 karakter"),
  name: z.string().min(1, "Nama wajib diisi").max(255, "Nama terlalu panjang"),
  email: z.string().email("Format email tidak valid"),

  // Profile fields
  gender: z.enum(["male", "female", "other"]).optional(),
  phone: z.string().max(20, "Nomor telepon terlalu panjang").optional(),
  birth_place: z.string().max(100, "Tempat lahir terlalu panjang").optional(),
  birth_date: z.string().optional(),
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
  address: z.string().optional(),
  province: z.string().max(100, "Nama provinsi terlalu panjang").optional(),
  regency: z.string().max(100, "Nama kabupaten terlalu panjang").optional(),
  district: z.string().max(100, "Nama kecamatan terlalu panjang").optional(),
  village: z.string().max(100, "Nama kelurahan terlalu panjang").optional(),
  postal_code: z.string().max(10, "Kode pos terlalu panjang").optional(),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

export function CreateUserDialog() {
  const { isCreateUserModalOpen, closeCreateUserModal } = useModalStore();
  const { useCreateUser } = useUsers();
  const createUserMutation = useCreateUser();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      gender: "other",
    },
  });

  const onSubmit = async (data: CreateUserFormData) => {
    try {
      // Convert form data to API format
      const createUserData: CreateUserRequest = {
        nik: data.nik,
        name: data.name,
        role: "participant",
        email: data.email,
        gender: data.gender,
        phone: data.phone,
        birth_place: data.birth_place,
        birth_date: data.birth_date ? new Date(data.birth_date) : undefined,
        religion: data.religion,
        education: data.education,
        address: data.address,
        province: data.province,
        regency: data.regency,
        district: data.district,
        village: data.village,
        postal_code: data.postal_code,
      };

      await createUserMutation.mutateAsync(createUserData);

      toast.success("Berhasil!", {
        description: "Peserta baru berhasil dibuat.",
      });

      handleClose();
    } catch (error: any) {
      console.error("Create user error:", error);

      const errorMessage = error?.message || "Gagal membuat pengguna baru";
      toast.error("Gagal!", {
        description: errorMessage,
      });
    }
  };

  const handleClose = () => {
    reset();
    closeCreateUserModal();
  };

  return (
    <Dialog open={isCreateUserModalOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Tambah Pengguna Baru
          </DialogTitle>
          <DialogDescription>
            Buat akun baru untuk admin atau peserta psikotes. Pastikan semua
            informasi yang dimasukkan sudah benar.
          </DialogDescription>
        </DialogHeader>

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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Label htmlFor="nik">NIK *</Label>
                  <Input
                    id="nik"
                    {...register("nik")}
                    placeholder="Masukkan NIK"
                    maxLength={16}
                  />
                  {errors.nik && (
                    <p className="text-sm text-destructive">
                      {errors.nik.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
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
                  <Select
                    value={watch("gender")}
                    onValueChange={(value) => setValue("gender", value as any)}
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
                  <Select
                    value={watch("religion")}
                    onValueChange={(value) =>
                      setValue("religion", value as any)
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="education">Pendidikan</Label>
                  <Select
                    value={watch("education")}
                    onValueChange={(value) =>
                      setValue("education", value as any)
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

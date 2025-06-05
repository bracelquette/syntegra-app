"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Save,
  Loader2,
  Brain,
  Clock,
  Target,
  FileText,
  Info,
  Lightbulb,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useTests } from "@/hooks/useTests";
import {
  createTestSchema,
  createTestDefaultValues,
  moduleTypeOptions,
  categoryOptionsByModuleType,
  statusOptions,
  type CreateTestFormData,
} from "@/lib/validations/test";
import { z } from "zod";

export default function CreateTestPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { useCreateTest } = useTests();
  const createTestMutation = useCreateTest();

  const form = useForm({
    // @ts-ignore - temporary type bypass due to schema inference issues
    resolver: zodResolver(createTestSchema),
    defaultValues: {
      name: "",
      description: "",
      module_type: "intelligence",
      category: "wais",
      time_limit: 30,
      passing_score: 0,
      display_order: 0,
      status: "active",
    },
    mode: "onChange",
  });

  const watchedModuleType = form.watch("module_type");

  // Reset category when module type changes
  useEffect(() => {
    if (watchedModuleType) {
      form.setValue("category", undefined as any);
    }
  }, [watchedModuleType, form]);

  // Get available categories based on selected module type
  const availableCategories = watchedModuleType
    ? categoryOptionsByModuleType[watchedModuleType] || []
    : [];

  const onSubmit = async (data: CreateTestFormData) => {
    try {
      setIsSubmitting(true);

      // Prepare data for API
      const submitData = {
        ...data,
        description: data.description || undefined,
        passing_score: data.passing_score || undefined,
        display_order: data.display_order || undefined,
      };

      await createTestMutation.mutateAsync(submitData);

      toast.success("Tes berhasil dibuat!", {
        description: `Tes "${data.name}" telah ditambahkan ke sistem.`,
        duration: 5000,
      });

      // Redirect to tests page
      router.push("/admin/tests");
    } catch (error: any) {
      console.error("Error creating test:", error);
      toast.error("Gagal membuat tes", {
        description:
          error?.message ||
          "Terjadi kesalahan saat membuat tes. Silakan coba lagi.",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (form.formState.isDirty) {
      if (window.confirm("Perubahan belum disimpan. Yakin ingin keluar?")) {
        router.push("/admin/tests");
      }
    } else {
      router.push("/admin/tests");
    }
  };

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Buat Tes Baru
              </h1>
              <p className="text-muted-foreground">
                Tambahkan modul psikotes baru ke dalam sistem untuk evaluasi
                kandidat
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  {/* Basic Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Informasi Dasar
                      </CardTitle>
                      <CardDescription>
                        Masukkan informasi dasar tentang tes psikotes
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nama Tes *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Masukkan nama tes psikotes..."
                                {...field}
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormDescription>
                              Nama yang akan ditampilkan pada kandidat dan admin
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Deskripsi</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Jelaskan tujuan dan cara kerja tes ini..."
                                className="min-h-[100px]"
                                {...field}
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormDescription>
                              Deskripsi singkat tentang tes (opsional)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Test Configuration */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        Konfigurasi Tes
                      </CardTitle>
                      <CardDescription>
                        Tentukan tipe, kategori, dan pengaturan tes
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="module_type"
                        render={({ field }) => (
                          <FormItem className="md:col-span-1">
                            <FormLabel>Tipe Modul *</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={isSubmitting}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Pilih tipe modul" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {moduleTypeOptions.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Klasifikasi utama dari tes psikotes
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem className="md:col-span-1">
                            <FormLabel>Kategori *</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={isSubmitting || !watchedModuleType}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Pilih kategori" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {availableCategories.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              {!watchedModuleType
                                ? "Pilih tipe modul terlebih dahulu"
                                : "Kategori spesifik dari tes"}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="time_limit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Batas Waktu (menit) *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="30"
                                min="1"
                                max="480"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value) || 0)
                                }
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormDescription>
                              Waktu maksimal pengerjaan (1-480 menit)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={isSubmitting}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Pilih status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {statusOptions.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Status ketersediaan tes
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Advanced Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Pengaturan Lanjutan
                      </CardTitle>
                      <CardDescription>
                        Konfigurasi tambahan untuk tes (opsional)
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="passing_score"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Skor Kelulusan</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                min="0"
                                max="100"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value) || 0)
                                }
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormDescription>
                              Skor minimum untuk lulus (0-100, kosongkan jika
                              tidak ada)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="display_order"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Urutan Tampilan</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                min="0"
                                max="9999"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value) || 0)
                                }
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormDescription>
                              Urutan tampilan tes dalam daftar (0 = default)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Form Actions */}
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex gap-4">
                        <Button
                          type="submit"
                          disabled={isSubmitting || !form.formState.isValid}
                          className="min-w-[120px]"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Menyimpan...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Simpan Tes
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCancel}
                          disabled={isSubmitting}
                        >
                          Batal
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </form>
              </Form>
            </div>

            {/* Sidebar with Tips */}
            <div className="space-y-6">
              {/* Tips */}
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-900">
                    <Lightbulb className="h-5 w-5" />
                    Tips Membuat Tes
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-blue-800 text-sm space-y-3">
                  <div>
                    <h4 className="font-semibold mb-1">Penamaan Tes:</h4>
                    <p>
                      Gunakan nama yang jelas dan deskriptif, misalnya "WAIS-IV
                      Intelligence Test" atau "MBTI Personality Assessment"
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Waktu Pengerjaan:</h4>
                    <p>
                      Sesuaikan dengan kompleksitas tes. Umumnya 15-60 menit
                      untuk tes kepribadian, 30-90 menit untuk tes inteligensi
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Skor Kelulusan:</h4>
                    <p>
                      Tentukan jika ada standar minimal. Kosongkan jika tes
                      bersifat deskriptif tanpa nilai pass/fail
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Module Type Guide */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Panduan Tipe Modul
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-3">
                  <div>
                    <Badge variant="outline" className="mb-2">
                      Inteligensi
                    </Badge>
                    <p className="text-muted-foreground">
                      Tes kemampuan kognitif dan kecerdasan umum
                    </p>
                  </div>
                  <div>
                    <Badge variant="outline" className="mb-2">
                      Kepribadian
                    </Badge>
                    <p className="text-muted-foreground">
                      Tes untuk mengidentifikasi karakteristik kepribadian
                    </p>
                  </div>
                  <div>
                    <Badge variant="outline" className="mb-2">
                      Bakat
                    </Badge>
                    <p className="text-muted-foreground">
                      Tes kemampuan spesifik dan keterampilan kerja
                    </p>
                  </div>
                  <div>
                    <Badge variant="outline" className="mb-2">
                      Minat
                    </Badge>
                    <p className="text-muted-foreground">
                      Tes preferensi karir dan bidang pekerjaan
                    </p>
                  </div>
                  <div>
                    <Badge variant="outline" className="mb-2">
                      Proyektif
                    </Badge>
                    <p className="text-muted-foreground">
                      Tes berbasis gambar dan interpretasi
                    </p>
                  </div>
                  <div>
                    <Badge variant="outline" className="mb-2">
                      Kognitif
                    </Badge>
                    <p className="text-muted-foreground">
                      Tes kecerdasan emosional dan kognitif lainnya
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Next Steps */}
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-900">
                    <CheckCircle className="h-5 w-5" />
                    Langkah Selanjutnya
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-green-800 text-sm">
                  <p>
                    Setelah tes dibuat, Anda perlu menambahkan pertanyaan dan
                    jawaban. Tes baru akan otomatis tersedia dengan status
                    "Aktif" dan siap digunakan setelah pertanyaan ditambahkan.
                  </p>
                </CardContent>
              </Card>

              {/* Current Form Status */}
              {form.formState.isDirty && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Form memiliki perubahan yang belum disimpan.
                    {form.formState.isValid
                      ? " Form sudah valid dan siap disimpan."
                      : " Lengkapi semua field yang wajib diisi."}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

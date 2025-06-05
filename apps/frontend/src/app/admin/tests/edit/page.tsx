"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  AlertCircle,
  RefreshCw,
  Edit,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useTests } from "@/hooks/useTests";
import {
  createTestSchema,
  moduleTypeOptions,
  categoryOptionsByModuleType,
  statusOptions,
  type CreateTestFormData,
} from "@/lib/validations/test";

export default function EditTestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const testId = searchParams.get("testId");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  const { useGetTestById, useUpdateTest } = useTests();

  // Get test data
  const {
    data: testData,
    isLoading: isLoadingTest,
    error: testError,
    refetch: refetchTest,
  } = useGetTestById(testId || "");

  const updateTestMutation = useUpdateTest();

  const form = useForm({
    // @ts-ignore - temporary type bypass due to schema inference issues
    resolver: zodResolver(createTestSchema),
    mode: "onChange",
  });

  const watchedModuleType = form.watch("module_type");

  // Redirect if no testId
  useEffect(() => {
    if (!testId) {
      toast.error("ID tes tidak ditemukan");
      router.push("/admin/tests");
    }
  }, [testId, router]);

  // Load initial data into form
  useEffect(() => {
    if (testData?.data && !initialDataLoaded) {
      const test = testData.data;

      form.reset({
        name: test.name,
        description: test.description || "",
        module_type: test.module_type,
        category: test.category,
        time_limit: test.time_limit,
        passing_score: test.passing_score || 0,
        display_order: test.display_order || 0,
        status: test.status || "active",
      });

      setInitialDataLoaded(true);
    }
  }, [testData, form, initialDataLoaded]);

  // Reset category when module type changes (but not on initial load)
  useEffect(() => {
    if (watchedModuleType && initialDataLoaded) {
      const currentCategory = form.getValues("category");
      const availableCategories =
        categoryOptionsByModuleType[watchedModuleType] || [];

      // Check if current category is still valid for the new module type
      const isCategoryValid = availableCategories.some(
        (cat) => cat.value === currentCategory
      );

      if (!isCategoryValid) {
        form.setValue("category", "wais" as any);
        toast.info(
          "Kategori direset karena tidak kompatibel dengan tipe modul yang dipilih"
        );
      }
    }
  }, [watchedModuleType, form, initialDataLoaded]);

  // Get available categories based on selected module type
  const availableCategories = watchedModuleType
    ? categoryOptionsByModuleType[watchedModuleType] || []
    : [];

  const onSubmit = async (data: CreateTestFormData) => {
    if (!testId) return;

    try {
      setIsSubmitting(true);

      // Prepare data for API (only include changed fields)
      const originalData = testData?.data;
      const changedData: any = {};

      // Compare each field and only include if changed
      if (data.name !== originalData?.name) changedData.name = data.name;
      if (data.description !== (originalData?.description || "")) {
        changedData.description = data.description || undefined;
      }
      if (data.module_type !== originalData?.module_type)
        changedData.module_type = data.module_type;
      if (data.category !== originalData?.category)
        changedData.category = data.category;
      if (data.time_limit !== originalData?.time_limit)
        changedData.time_limit = data.time_limit;
      if (data.passing_score !== (originalData?.passing_score || 0)) {
        changedData.passing_score = data.passing_score || undefined;
      }
      if (data.display_order !== (originalData?.display_order || 0)) {
        changedData.display_order = data.display_order || undefined;
      }
      if (data.status !== (originalData?.status || "active"))
        changedData.status = data.status;

      // Check if there are any changes
      if (Object.keys(changedData).length === 0) {
        toast.info("Tidak ada perubahan untuk disimpan");
        return;
      }

      await updateTestMutation.mutateAsync({
        id: testId,
        data: changedData,
      });

      toast.success("Tes berhasil diperbarui!", {
        description: `Perubahan pada tes "${data.name}" telah disimpan.`,
        duration: 5000,
      });

      // Redirect to tests page
      router.back();
    } catch (error: any) {
      console.error("Error updating test:", error);
      toast.error("Gagal memperbarui tes", {
        description:
          error?.message ||
          "Terjadi kesalahan saat memperbarui tes. Silakan coba lagi.",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (form.formState.isDirty) {
      if (window.confirm("Perubahan belum disimpan. Yakin ingin keluar?")) {
        router.back();
      }
    } else {
      router.back();
    }
  };

  // Loading state
  if (isLoadingTest) {
    return (
      <>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" disabled>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Edit Tes</h1>
                <p className="text-muted-foreground">Memuat data tes...</p>
              </div>
            </div>

            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <Loader2 className="size-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Memuat data tes...</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Error state
  if (testError || !testData?.data) {
    return (
      <>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/admin/tests")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Edit Tes</h1>
                <p className="text-muted-foreground">Gagal memuat data tes</p>
              </div>
            </div>

            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <AlertCircle className="size-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-600 mb-2">
                  Gagal Memuat Data
                </h3>
                <p className="text-muted-foreground mb-4">
                  {testError?.message ||
                    "Tes tidak ditemukan atau terjadi kesalahan"}
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => refetchTest()} variant="outline">
                    <RefreshCw className="size-4 mr-2" />
                    Coba Lagi
                  </Button>
                  <Button onClick={() => router.push("/admin/tests")}>
                    Kembali ke Daftar Tes
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const test = testData.data;

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
            <div className="flex-1">
              <h1 className="text-3xl font-bold tracking-tight">Edit Tes</h1>
              <p className="text-muted-foreground">
                Perbarui informasi tes psikotes "{test.name}"
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              ID: {test.id}
            </Badge>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {initialDataLoaded ? (
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
                          Edit informasi dasar tentang tes psikotes
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
                                Nama yang akan ditampilkan pada kandidat dan
                                admin
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
                          Edit tipe, kategori, dan pengaturan tes
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
                                    field.onChange(
                                      parseInt(e.target.value) || 0
                                    )
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
                          Edit konfigurasi tambahan untuk tes (opsional)
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
                                    field.onChange(
                                      parseInt(e.target.value) || 0
                                    )
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
                                    field.onChange(
                                      parseInt(e.target.value) || 0
                                    )
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
                            disabled={
                              isSubmitting ||
                              !form.formState.isValid ||
                              !form.formState.isDirty
                            }
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
                                Simpan Perubahan
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
                          {!form.formState.isDirty && (
                            <span className="text-sm text-muted-foreground self-center">
                              Tidak ada perubahan
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </form>
                </Form>
              ) : (
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <Loader2 className="size-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground">Memuat form...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar with Tips and Info */}
            <div className="space-y-6">
              {/* Test Info */}
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-900">
                    <Info className="h-5 w-5" />
                    Informasi Tes
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-blue-800 text-sm space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="font-medium">Dibuat:</span>
                      <br />
                      <span className="text-xs">
                        {new Date(test.created_at).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Diperbarui:</span>
                      <br />
                      <span className="text-xs">
                        {new Date(test.updated_at).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Total Pertanyaan:</span>{" "}
                    {test.total_questions || 0}
                  </div>
                  <div>
                    <span className="font-medium">Status Saat Ini:</span>{" "}
                    <Badge variant="outline" className="ml-1">
                      {test.status === "active"
                        ? "Aktif"
                        : test.status === "inactive"
                          ? "Tidak Aktif"
                          : "Diarsipkan"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Tips */}
              <Card className="border-amber-200 bg-amber-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-900">
                    <Lightbulb className="h-5 w-5" />
                    Tips Edit Tes
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-amber-800 text-sm space-y-3">
                  <div>
                    <h4 className="font-semibold mb-1">
                      Perubahan Tipe Modul:
                    </h4>
                    <p>
                      Jika mengubah tipe modul, kategori akan direset otomatis
                      untuk memastikan kompatibilitas
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Status Tes:</h4>
                    <p>
                      Tes yang sedang digunakan dalam sesi aktif sebaiknya tidak
                      diubah statusnya ke "Tidak Aktif"
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Optimisasi Performa:</h4>
                    <p>
                      Sistem hanya akan menyimpan field yang berubah untuk
                      mengoptimalkan performa
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Edit className="h-5 w-5" />
                    Aksi Lanjutan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href={`/admin/tests/${test.id}/questions`}>
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      Kelola Pertanyaan
                    </Button>
                  </Link>
                  <Link href={`/admin/tests/${test.id}`}>
                    <Button variant="outline" className="w-full justify-start">
                      <Info className="h-4 w-4 mr-2" />
                      Lihat Detail Lengkap
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full justify-start">
                    <Target className="h-4 w-4 mr-2" />
                    Lihat Statistik
                  </Button>
                </CardContent>
              </Card>

              {/* Current Form Status */}
              {form.formState.isDirty && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Form memiliki perubahan yang belum disimpan.
                    {form.formState.isValid
                      ? " Form sudah valid dan siap disimpan."
                      : " Lengkapi semua field yang wajib diisi."}
                  </AlertDescription>
                </Alert>
              )}

              {!form.formState.isDirty && initialDataLoaded && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Tidak ada perubahan pada form. Lakukan perubahan pada field
                    yang ingin diperbarui.
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

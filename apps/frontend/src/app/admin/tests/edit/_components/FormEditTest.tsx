"use client";

import { UseFormReturn } from "react-hook-form";
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
import { Save, Loader2, Brain, Target, FileText, Palette } from "lucide-react";
import {
  moduleTypeOptions,
  statusOptions,
  type CreateTestFormData,
} from "@/lib/validations/test";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { ColorPicker } from "@/components/ui/color-picker";

interface TestData {
  id: string;
  name: string;
  description: string | null;
  module_type: string;
  category: string;
  time_limit: number;
  icon: string | null;
  card_color: string | null;
  passing_score: number | null;
  display_order: number;
  status: string;
  created_at: string | Date;
  updated_at: string | Date;
  total_questions: number;
}

interface FormEditTestProps {
  form: UseFormReturn<any>;
  onSubmit: (data: CreateTestFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  watchedModuleType: string | undefined;
  watchedIcon: string | undefined;
  watchedCardColor: string | undefined;
  watchedName: string | undefined;
  watchedDescription: string | undefined;
  availableCategories: readonly {
    readonly value: string;
    readonly label: string;
  }[];
  test: TestData;
  initialDataLoaded: boolean;
}

export function FormEditTest({
  form,
  onSubmit,
  onCancel,
  isSubmitting,
  watchedModuleType,
  watchedIcon,
  watchedCardColor,
  watchedName,
  watchedDescription,
  availableCategories,
  test,
  initialDataLoaded,
}: FormEditTestProps) {
  if (!initialDataLoaded) {
    return (
      <div className="lg:col-span-2">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="size-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Memuat form...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:col-span-2 space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

          {/* Visual Design */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Desain Visual
              </CardTitle>
              <CardDescription>
                Edit icon dan warna untuk tes ini
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon Tes</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <EmojiPicker
                            value={field.value}
                            onChange={field.onChange}
                            disabled={isSubmitting}
                          />
                          <div className="flex-1">
                            <Input
                              placeholder="Atau ketik emoji manual..."
                              {...field}
                              disabled={isSubmitting}
                              className="text-center"
                              maxLength={2}
                            />
                          </div>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Emoji yang akan ditampilkan pada card tes
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="card_color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Warna Tema</FormLabel>
                      <FormControl>
                        <ColorPicker
                          value={field.value}
                          onChange={field.onChange}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormDescription>
                        Warna yang akan ditampilkan pada card tes
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Preview */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium mb-2 block">
                  Preview Card
                </Label>
                <div className="w-full max-w-sm">
                  <div
                    className={`p-4 rounded-lg border transition-all ${
                      watchedCardColor ||
                      test.card_color ||
                      "bg-gray-100 text-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {(watchedIcon || test.icon) && (
                        <span className="text-2xl">
                          {watchedIcon || test.icon}
                        </span>
                      )}
                      <div>
                        <h3 className="font-semibold">
                          {watchedName || test.name || "Nama Tes"}
                        </h3>
                        <p className="text-sm opacity-90">
                          {watchedDescription ||
                            test.description ||
                            "Deskripsi tes"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current vs New Comparison */}
              {form.formState.isDirty &&
                (watchedIcon !== test.icon ||
                  watchedCardColor !== test.card_color) && (
                  <div className="border-t pt-4">
                    <Label className="text-sm font-medium mb-2 block">
                      Perbandingan (Sebelum vs Sesudah)
                    </Label>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Before */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">
                          Sebelum:
                        </p>
                        <div
                          className={`p-3 rounded-lg border transition-all ${
                            test.card_color || "bg-gray-100 text-gray-700"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {test.icon && (
                              <span className="text-lg">{test.icon}</span>
                            )}
                            <div>
                              <h4 className="font-medium text-sm">
                                {test.name}
                              </h4>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* After */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">
                          Sesudah:
                        </p>
                        <div
                          className={`p-3 rounded-lg border transition-all ${
                            watchedCardColor || "bg-gray-100 text-gray-700"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {watchedIcon && (
                              <span className="text-lg">{watchedIcon}</span>
                            )}
                            <div>
                              <h4 className="font-medium text-sm">
                                {watchedName || test.name}
                              </h4>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
                          <SelectItem key={option.value} value={option.value}>
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
                          <SelectItem key={option.value} value={option.value}>
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
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Status ketersediaan tes</FormDescription>
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
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      Skor minimum untuk lulus (0-100, kosongkan jika tidak ada)
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
                  onClick={onCancel}
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
    </div>
  );
}

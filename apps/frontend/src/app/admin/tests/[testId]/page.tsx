"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Edit,
  Settings,
  BarChart3,
  RefreshCw,
  AlertCircle,
  Loader2,
  Eye,
  Play,
} from "lucide-react";
import Link from "next/link";
import { useTests } from "@/hooks/useTests";
import { TestOverview } from "./components/TestOverview";
import { TestBankSoal } from "./components/TestBankSoal";

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

export default function TestDetailPage() {
  const params = useParams();
  const testId = params.testId as string;
  const [activeTab, setActiveTab] = useState("overview");

  // API calls
  const { useGetTestById } = useTests();
  const testQuery = useGetTestById(testId);

  // Handle refresh
  const handleRefresh = () => {
    testQuery.refetch();
  };

  // Loading state
  if (testQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="size-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Memuat detail tes...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (testQuery.error) {
    return (
      <div className="space-y-6">
        {/* Back button */}
        <div className="flex items-center gap-3">
          <Button variant="link" size="sm" asChild>
            <Link href="/admin/tests">
              <ArrowLeft className="size-4 mr-2" />
              Kembali
            </Link>
          </Button>
        </div>

        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="size-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-600 mb-2">
              Gagal Memuat Detail Tes
            </h3>
            <p className="text-muted-foreground mb-4">
              {testQuery.error.message ||
                "Terjadi kesalahan saat memuat detail tes"}
            </p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="size-4 mr-2" />
              Coba Lagi
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const test = testQuery.data?.data;

  if (!test) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="link" size="sm" asChild>
            <Link href="/admin/tests">
              <ArrowLeft className="size-4 mr-2" />
              Kembali
            </Link>
          </Button>
        </div>

        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="size-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Tes Tidak Ditemukan</h3>
            <p className="text-muted-foreground">
              Tes dengan ID tersebut tidak ditemukan dalam sistem
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Button variant="link" size="sm" asChild>
        <Link href="/admin/tests">
          <ArrowLeft className="size-4 mr-2" />
          Kembali
        </Link>
      </Button>
      <div className="flex items-center gap-3">
        <Separator orientation="vertical" className="h-6" />
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold">{test.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  className="bg-cyan-100 text-cyan-700"
                  variant="secondary"
                >
                  {
                    MODULE_TYPE_LABELS[
                      test.module_type as keyof typeof MODULE_TYPE_LABELS
                    ]
                  }
                </Badge>
                <Badge variant="outline">
                  {
                    CATEGORY_LABELS[
                      test.category as keyof typeof CATEGORY_LABELS
                    ]
                  }
                </Badge>
                <StatusBadge status={test.status || "active"} />
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button asChild>
            <Link href={`/admin/tests/edit?testId=${testId}`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Tes
            </Link>
          </Button>
        </div>
      </div>

      {/* Content */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="bank-soal" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Bank Soal
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <TestOverview
            test={{
              ...test,
              description: test.description ?? undefined,
              icon: test.icon ?? undefined,
              card_color: test.card_color ?? undefined,
              test_prerequisites: test.test_prerequisites ?? undefined,
              subcategory: test.subcategory ?? undefined,
              passing_score: test.passing_score ?? undefined,
              instructions: test.instructions ?? undefined,
              created_at: test.created_at
                ? new Date(test.created_at).toISOString()
                : undefined,
              updated_at: test.updated_at
                ? new Date(test.updated_at).toISOString()
                : undefined,
              created_by: test.created_by ?? undefined,
              updated_by: test.updated_by ?? undefined,
            }}
          />
        </TabsContent>

        <TabsContent value="bank-soal" className="space-y-6">
          <TestBankSoal testId={testId} test={test} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

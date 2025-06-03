import { createFileRoute, useRouter } from "@tanstack/react-router";
import { BulkUserUpload } from "~/components/BulkUserUpload";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  ArrowLeft,
  Users,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import type { BulkCreateUsersResponse } from "shared-types";

export const Route = createFileRoute("/admin/users/bulk-import")({
  component: BulkImportComponent,
  beforeLoad: ({ context }) => {
    // Check if user is admin (this should be handled by your auth middleware)
    // For now, we'll assume auth context is available
    // if (!context.user || context.user.role !== 'admin') {
    //   throw redirect({ to: '/login' })
    // }
  },
});

function BulkImportComponent() {
  const router = useRouter();

  const handleImportComplete = (result: BulkCreateUsersResponse) => {
    console.log("Bulk import completed:", result);

    // Show success notification
    if (result.data.successful > 0) {
      // You can add a toast notification here
      console.log(`Successfully created ${result.data.successful} users`);
    }

    // Optionally navigate to users list after completion
    // setTimeout(() => {
    //   router.navigate({ to: '/admin/users' })
    // }, 3000)
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            onClick={() => router.navigate({ to: "/admin/users" })}
            className="p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Bulk User Import</h1>
            <p className="text-muted-foreground">
              Import multiple users from an Excel file
            </p>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Supported Formats
            </CardTitle>
            <FileSpreadsheet className="h-4 w-4 ml-auto text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">.xlsx, .xls</div>
            <p className="text-xs text-muted-foreground">
              Excel files up to 10MB
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Batch Limit</CardTitle>
            <Users className="h-4 w-4 ml-auto text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,000</div>
            <p className="text-xs text-muted-foreground">Users per import</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Auto Validation
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 ml-auto text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Yes</div>
            <p className="text-xs text-muted-foreground">
              Data checked before import
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Important Notes */}
      <Card className="mb-8 border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <AlertTriangle className="w-5 h-5" />
            Important Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="text-amber-700">
          <ul className="space-y-2 text-sm">
            <li>
              • All users will be created with <strong>participant</strong> role
              by default
            </li>
            <li>
              • Participants authenticate using <strong>NIK + Email</strong> (no
              password required)
            </li>
            <li>• NIK and Email must be unique - duplicates will be skipped</li>
            <li>
              • Date format should be: <strong>YYYY-MM-DD</strong> (e.g.,
              1990-01-01)
            </li>
            <li>
              • Gender values: <strong>L/Laki-laki/Male</strong> or{" "}
              <strong>P/Perempuan/Female</strong>
            </li>
            <li>
              • Phone format: <strong>+62812345678</strong> or{" "}
              <strong>08123456789</strong>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Required Columns Info */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Required Excel Columns</CardTitle>
          <CardDescription>
            Your Excel file must contain these columns in the first row (header)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              {
                name: "NIK",
                required: true,
                description: "16-digit ID number",
              },
              { name: "Nama", required: true, description: "Full name" },
              { name: "Email", required: true, description: "Email address" },
              {
                name: "Jenis Kelamin",
                required: true,
                description: "Gender (L/P)",
              },
              { name: "No HP", required: true, description: "Phone number" },
              {
                name: "Tempat Lahir",
                required: false,
                description: "Birth place",
              },
              {
                name: "Tanggal Lahir",
                required: false,
                description: "Birth date",
              },
              { name: "Agama", required: false, description: "Religion" },
              { name: "Pendidikan", required: false, description: "Education" },
              { name: "Alamat", required: false, description: "Address" },
              { name: "Provinsi", required: false, description: "Province" },
              {
                name: "Kabupaten/Kota",
                required: false,
                description: "Regency/City",
              },
              { name: "Kecamatan", required: false, description: "District" },
              {
                name: "Kelurahan/Desa",
                required: false,
                description: "Village",
              },
              { name: "Kode Pos", required: false, description: "Postal code" },
            ].map((column) => (
              <div
                key={column.name}
                className={`p-3 rounded-lg border ${
                  column.required
                    ? "border-red-200 bg-red-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <div
                  className={`font-medium ${column.required ? "text-red-700" : "text-gray-700"}`}
                >
                  {column.name}
                  {column.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {column.description}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> Column names are case-insensitive and
              flexible. For example, "Email" can also match "E-mail", "email",
              etc.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Upload Component */}
      <BulkUserUpload onComplete={handleImportComplete} />

      {/* Additional Help */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Common Issues:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>
                  • <strong>NIK Format Error:</strong> NIK must be exactly 16
                  digits
                </li>
                <li>
                  • <strong>Email Format Error:</strong> Use valid email format
                  (user@domain.com)
                </li>
                <li>
                  • <strong>Date Format Error:</strong> Use YYYY-MM-DD format
                  for dates
                </li>
                <li>
                  • <strong>Gender Values:</strong> Use L/Laki-laki/Male for
                  male, P/Perempuan/Female for female
                </li>
                <li>
                  • <strong>Duplicate Entries:</strong> Each NIK and Email must
                  be unique
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Data Processing:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>
                  • Phone numbers are automatically formatted to +62 format
                </li>
                <li>• Gender values are normalized (L→male, P→female)</li>
                <li>• Religion and education values are standardized</li>
                <li>• Empty optional fields are allowed</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">After Import:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Users can login using their NIK and Email</li>
                <li>• No password is required for participant accounts</li>
                <li>• Users will appear in the main users list</li>
                <li>• You can assign users to test sessions</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

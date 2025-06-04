import { LoginFormParticipant } from "@/components/form/login-form-participant";

export default function ParticipantLoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginFormParticipant />
      </div>
    </div>
  );
}

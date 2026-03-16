"use client";

import AuthGate from "@/components/AuthGate";
import MathSprintV4 from "@/components/MathSprintV4";

export default function Page() {
  return (
    <AuthGate>
      {() => <MathSprintV4 />}
    </AuthGate>
  );
}
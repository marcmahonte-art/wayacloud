"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import RegisterPage from "@/app/(auth)/register/page";
import { storage } from "@/lib/storage";

function JoinContent() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");

  useEffect(() => {
    if (ref) {
      storage.set("wayacloud_referral_code", ref);
    }
  }, [ref]);

  return <RegisterPage />;
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}>
      <JoinContent />
    </Suspense>
  );
}

export const dynamic = "force-dynamic";

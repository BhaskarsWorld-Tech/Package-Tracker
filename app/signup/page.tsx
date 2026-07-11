import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import AuthForm from "@/components/AuthForm";

export default async function SignupPage() {
  const cookieStore = await cookies();
  const session = await verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (session) {
    redirect("/");
  }

  return (
    <Suspense>
      <AuthForm mode="signup" />
    </Suspense>
  );
}

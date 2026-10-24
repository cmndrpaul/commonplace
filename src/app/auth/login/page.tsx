import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ registered?: string; next?: string }> }) {
  const params = await searchParams;
  return <div className="auth-page"><AuthForm mode="login" registered={params.registered === "1"} next={params.next} /></div>;
}
import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "Create an account" };

export default function RegisterPage() {
  return <div className="auth-page"><AuthForm mode="register" /></div>;
}
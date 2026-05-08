import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LoginScreen } from "@/components/auth/login-screen";

export default function LoginPage() {
  const hasAuthToken = Boolean(cookies().get("token")?.value);

  if (hasAuthToken) {
    redirect("/dashboard");
  }

  return <LoginScreen />;
}

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hasAuthToken = Boolean(cookies().get("token")?.value);

  if (!hasAuthToken) {
    redirect("/login");
  }

  return children;
}

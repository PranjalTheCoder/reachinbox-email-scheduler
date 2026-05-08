import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default function Home() {
  const hasAuthToken = Boolean(cookies().get("token")?.value);

  redirect(hasAuthToken ? "/dashboard" : "/login");
}

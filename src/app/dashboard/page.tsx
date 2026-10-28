import { redirect } from "next/navigation";
import { listUserApps, requireUser } from "@/server/access";

export default async function DashboardHome() {
  const user = await requireUser();
  const [first] = await listUserApps(user.id);
  redirect(first ? `/dashboard/${first.id}` : "/dashboard/new");
}

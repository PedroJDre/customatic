import Link from "next/link";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <main className="mx-auto grid max-w-[440px] gap-4 px-5 py-24">
      <Logo />
      <h1 className="mt-6 text-[24px] font-bold">This page doesn&apos;t exist</h1>
      <p className="text-muted">The link may be wrong, or you don&apos;t have access to this app.</p>
      <Link href="/dashboard" className="btn-primary justify-self-start">Go to the dashboard</Link>
    </main>
  );
}

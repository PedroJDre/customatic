"use client";

import { useTransition } from "react";
import { acceptInvitation } from "@/server/actions";

export function AcceptButton({ id, label }: { id: string; label: string }) {
  const [pending, start] = useTransition();
  return (
    <button className="btn-primary h-11" disabled={pending} onClick={() => start(() => acceptInvitation(id))}>
      {label}
    </button>
  );
}

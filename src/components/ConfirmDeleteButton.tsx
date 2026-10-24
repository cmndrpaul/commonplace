"use client";

import type { FormEvent } from "react";

export function ConfirmDeleteButton({ action, compact = false }: { action: () => void | Promise<void>; compact?: boolean }) {
  function confirmDelete(event: FormEvent<HTMLFormElement>) {
    if (!window.confirm("Delete this project? This cannot be undone.")) event.preventDefault();
  }

  return <form action={action} onSubmit={confirmDelete}><button className={compact ? "row-delete-link" : "button button-secondary danger-button"} type="submit">Delete</button></form>;
}
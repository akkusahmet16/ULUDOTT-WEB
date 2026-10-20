"use client";
import { useRef, type ReactNode } from "react";
import { Button } from "./button";
export function Dialog({
  title,
  trigger,
  children,
  onOpen,
}: {
  title: string;
  trigger: string;
  children: ReactNode;
  onOpen?: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <Button onClick={() => { onOpen?.(); ref.current?.showModal(); }}>{trigger}</Button>
      <dialog ref={ref} aria-label={title}>
        <h2>{title}</h2>
        {children}
        <form method="dialog">
          <Button>Kapat</Button>
        </form>
      </dialog>
    </>
  );
}

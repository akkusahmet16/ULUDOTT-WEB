"use client";
import { useRef, type ReactNode } from "react";
import { Button } from "./button";
export function Dialog({
  title,
  trigger,
  children,
}: {
  title: string;
  trigger: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <Button onClick={() => ref.current?.showModal()}>{trigger}</Button>
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

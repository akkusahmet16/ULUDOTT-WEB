"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
export function PhotoGallery({
  photos,
  name,
  reference = true,
}: {
  photos: readonly string[];
  name: string;
  reference?: boolean;
}) {
  const [active, setActive] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null),
    trigger = useRef<HTMLAnchorElement | null>(null);
  const close = () => {
    dialog.current?.close();
    setActive(null);
    trigger.current?.focus();
  };
  const opened = active !== null;
  useEffect(() => {
    if (!opened) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.showModal();
    return () => {
      document.body.style.overflow = previous;
    };
  }, [opened]);
  const move = (step: number) =>
    setActive((i) =>
      i === null ? null : (i + step + photos.length) % photos.length,
    );
  return (
    <>
      <div className="people-gallery">
        {photos.map((photo, i) => (
          <figure key={photo} className={`people-photo photo-${i}`}>
            <a
              href={photo}
              data-gallery-photo
              aria-label={`${name}${reference ? " referans" : ""} fotoğrafı ${i + 1}, büyük görüntü`}
              onClick={(e) => {
                e.preventDefault();
                trigger.current = e.currentTarget;
                setActive(i);
              }}
            >
              <Image
                src={photo}
                alt={`${name}${reference ? " GTA VI görsel yer tutucusu" : " detay fotoğrafı"} ${i + 1}`}
                width={1600}
                height={1100}
                unoptimized
              />
              <span aria-hidden="true">↗</span>
            </a>
          </figure>
        ))}
      </div>
      <dialog
        className="photo-dialog"
        ref={dialog}
        aria-label="Fotoğraf galerisi"
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") {
            e.preventDefault();
            move(1);
          }
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            move(-1);
          }
        }}
      >
        <div className="dialog-toolbar">
          <span>
            {name} · {(active ?? 0) + 1} / {photos.length}
          </span>
          <button
            aria-label="Galeriyi kapat"
            data-close-gallery
            onClick={close}
          >
            ×
          </button>
        </div>
        {active !== null && (
          <Image
            src={photos[active]}
            alt={`${name}${reference ? " referans" : ""} fotoğrafı ${active + 1}`}
            width={1600}
            height={1100}
            unoptimized
          />
        )}
        <div className="photo-controls">
          <button aria-label="Önceki fotoğraf" onClick={() => move(-1)}>
            ←
          </button>
          <button aria-label="Sonraki fotoğraf" onClick={() => move(1)}>
            →
          </button>
        </div>
      </dialog>
    </>
  );
}

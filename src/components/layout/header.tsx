"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
const links = [
  ["/", "Ana sayfa"],
  ["/hakkimizda", "Hakkımızda"],
  ["/ulujam", "UluJam"],
  ["/etkinlikler", "Etkinlikler"],
  ["/duyurular", "Duyurular"],
  ["/oyunlar", "Oyunlar"],
  ["/linkler", "Linkler"],
  ["/destek", "Destek"],
] as const;
export function Header() {
  const path = usePathname(),
    [open, setOpen] = useState(false),
    toggle = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);
  return (
    <header
      ref={header}
      className={`site-header ${open ? "menu-open" : ""}`}
      onKeyDown={(e) => {
        if (!open) return;
        if (e.key === "Escape") {
          e.preventDefault();
          setOpen(false);
          toggle.current?.focus();
        }
        if (e.key === "Tab") {
          const items = header.current?.querySelectorAll<
            HTMLAnchorElement | HTMLButtonElement
          >("a, button");
          if (!items?.length) return;
          const first = items[0],
            last = items[items.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }}
    >
      <div className="wrap header-inner">
        <Link href="/" className="brand" aria-label="Uludott ana sayfa">
          <Image src="/brand/uludott-white.svg" alt="" width={48} height={48} />
          <span>ULUDOTT</span>
        </Link>
        <button
          ref={toggle}
          className="button secondary menu-toggle"
          aria-label="Menü"
          aria-expanded={open}
          aria-controls="main-menu"
          onClick={() => setOpen(!open)}
        >
          <span className="menu-label">Menü</span>
          <span className="menu-lines" aria-hidden="true">
            <i />
            <i />
          </span>
        </button>
        <nav
          id="main-menu"
          className={`site-nav ${open ? "open" : ""}`}
          aria-label="Ana menü"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              toggle.current?.focus();
            }
          }}
        >
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              aria-current={path === href ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

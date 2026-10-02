"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useRef } from "react";
const links = [
  ["/", "Ana sayfa"],
  ["/hakkimizda", "Hakkımızda"],
  ["/ulujam", "UluJam"],
  ["/etkinlikler", "Etkinlikler"],
  ["/duyurular", "Duyurular"],
  ["/destek", "Destek"],
] as const;
export function Header() {
  const path = usePathname(),
    [open, setOpen] = useState(false),
    toggle = useRef<HTMLButtonElement>(null);
  return (
    <header className="site-header">
      <div className="wrap header-inner">
        <Link href="/" className="brand" aria-label="Uludott ana sayfa">
          <Image
            src="/brand/uludott-white.svg"
            alt="Uludott"
            width={48}
            height={48}
          />
          <span>ULUDOTT</span>
        </Link>
        <button
          ref={toggle}
          className="button secondary menu-toggle"
          aria-expanded={open}
          aria-controls="main-menu"
          onClick={() => setOpen(!open)}
        >
          Menü
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

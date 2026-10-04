"use client";
import Link from "next/link";
import Image from "next/image";
import type { CSSProperties } from "react";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
const links = [
  ["/", "Ana sayfa"],
  ["/hakkimizda", "Hakkımızda"],
  ["/ulujam", "UluJam"],
  ["/etkinlikler", "Etkinlikler"],
  ["/duyurular", "Duyurular"],
  ["/oyunlar", "Oyunlar"],
  ["/linkler", "Bağlantılar"],
  ["/destek", "Destek"],
] as const;
export function Header() {
  const path = usePathname(),
    [open, setOpen] = useState(false),
    toggle = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [preview, setPreview] = useState("/theme/reference/community.avif");
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
          const visible = [...(items ?? [])].filter(
            (item) => item.getBoundingClientRect().width > 0,
          );
          if (!visible.length) return;
          const first = visible[0],
            last = visible[visible.length - 1];
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
          <Image
            src="/brand/uludott-white-text.png"
            alt=""
            className="brand-wordmark"
            width={3000}
            height={390}
            unoptimized
          />
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
        <div className="menu-scene" hidden={!open} aria-hidden="true">
          <Image
            className="menu-scene-art"
            src={preview}
            alt=""
            fill
            unoptimized
          />
          <Image
            className="menu-scene-logo"
            src="/brand/uludott-white-text.png"
            alt=""
            width={3000}
            height={390}
            unoptimized
          />
          <p>Bir fikir. Bir takım. Bir oyun.</p>
        </div>
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
          <p className="menu-caption">Uludott / Keşfet</p>
          {links.map(([href, label], index) => {
            const children =
              href === "/hakkimizda"
                ? [
                    ["/hakkimizda#yonetim-kurulu", "Yönetim kurulu"],
                    ["/hakkimizda#mekanlar", "Sponsorlar & mekânlar"],
                  ]
                : href === "/oyunlar"
                  ? [
                      ["/oyunlar#derece-oyunlari", "Dereceye giren oyunlar"],
                      ["/oyunlar#yayinlanan-oyunlar", "Yayımlanan oyunlar"],
                    ]
                  : [];
            const groupLabel =
              href === "/hakkimizda"
                ? "Topluluk alt menüsü"
                : "Oyunlar alt menüsü";
            return (
              <div
                className="menu-item"
                key={href}
                style={{ "--menu-index": index } as CSSProperties}
                onMouseEnter={() =>
                  setPreview(
                    href === "/hakkimizda"
                      ? "/theme/reference/board-1.avif"
                      : href === "/etkinlikler" || href === "/destek"
                        ? "/theme/reference/venue-1.avif"
                        : "/theme/reference/community.avif",
                  )
                }
              >
                <div className="menu-row">
                  <Link
                    href={href}
                    aria-current={path === href ? "page" : undefined}
                    onClick={() => setOpen(false)}
                  >
                    {label}
                  </Link>
                  {!!children.length && (
                    <button
                      className="menu-expand"
                      aria-label={groupLabel}
                      aria-expanded={expanded === href}
                      aria-controls={`submenu-${index}`}
                      onClick={() =>
                        setExpanded(expanded === href ? null : href)
                      }
                    >
                      <span aria-hidden="true">
                        {expanded === href ? "−" : "+"}
                      </span>
                    </button>
                  )}
                </div>
                {!!children.length && (
                  <div
                    id={`submenu-${index}`}
                    className="menu-submenu"
                    hidden={expanded !== href}
                  >
                    {children.map(([url, name]) => (
                      <Link href={url} key={url} onClick={() => setOpen(false)}>
                        {name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

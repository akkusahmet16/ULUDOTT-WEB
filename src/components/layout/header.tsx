"use client";
import Link from "next/link";
import Image from "next/image";
import type { CSSProperties } from "react";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {
  DEFAULT_MENU_PREVIEW_IMAGE,
  getNavbarRoutes,
} from "../../config/routes.config.ts";
import { useTranslator } from "../../i18n/client.tsx";

const navRoutes = getNavbarRoutes();

export function Header() {
  const t = useTranslator();
  const path = usePathname(),
    [open, setOpen] = useState(false),
    toggle = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [preview, setPreview] = useState<string>(DEFAULT_MENU_PREVIEW_IMAGE);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);
  const activeRoute = navRoutes.find(
    (route) =>
      route.path !== "/" &&
      (path === route.path || path.startsWith(route.path + "/")),
  );
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
        <Link href="/" className="brand" aria-label={t("nav.homeLogoAria")}>
          <Image src="/brand/uludott-white.svg" alt="" width={48} height={48} />
        </Link>
        {path !== "/" && (
          <span className="header-page-name">
            {activeRoute
              ? t(activeRoute.labelKey)
              : path === "/"
                ? t("nav.home")
                : t("brand.name")}
          </span>
        )}
        <button
          ref={toggle}
          className="menu-toggle"
          aria-label={t("nav.menuButton")}
          aria-expanded={open}
          aria-controls="main-menu"
          onClick={() => setOpen(!open)}
        >
          <span className="menu-label">{t("nav.menuButton")}</span>
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
          <p>{t("brand.motto")}</p>
        </div>
        <nav
          id="main-menu"
          className={`site-nav ${open ? "open" : ""}`}
          aria-label={t("nav.mainMenuAria")}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              toggle.current?.focus();
            }
          }}
        >
          <p className="menu-caption">{t("nav.discoverCaption")}</p>
          {navRoutes.map((route, index) => {
            const href = route.path;
            const label = t(route.labelKey);
            const children = route.children ?? [];
            const groupLabel = route.submenuAriaKey
              ? t(route.submenuAriaKey)
              : t("nav.gamesSubmenuAria");
            return (
              <div
                className="menu-item"
                key={href}
                style={{ "--menu-index": index } as CSSProperties}
                onMouseEnter={() =>
                  setPreview(route.previewImage ?? DEFAULT_MENU_PREVIEW_IMAGE)
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
                    {children.map((child) => (
                      <Link
                        href={child.href}
                        key={child.href}
                        onClick={() => setOpen(false)}
                      >
                        {t(child.labelKey)}
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

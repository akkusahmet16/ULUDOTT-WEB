"use client";

import React, { type CSSProperties, type ReactNode } from "react";

export type StatusMarkStatus = "idle" | "pending" | "running" | "done" | "failed" | "cancelled";

export interface StatusMarkClassNames {
  root?: string;
  glyph?: string;
  track?: string;
  ring?: string;
  ringPending?: string;
  ringRunning?: string;
  ringDone?: string;
  ringFailed?: string;
  check?: string;
  cross?: string;
  label?: string;
  strike?: string;
  srOnly?: string;
}

export interface StatusMarkProps {
  status?: StatusMarkStatus;
  progress?: number;
  label?: ReactNode;
  size?: number;
  strokeWidth?: number;
  strike?: boolean;
  className?: string;
  style?: CSSProperties;
  classes?: StatusMarkClassNames;
}

const CHECK_PATH = "M7.5 12.25 10.5 15.25 16.75 8.75";
const CROSS_PATH = "M8.5 8.5 15.5 15.5M15.5 8.5 8.5 15.5";

const STATUS_TEXT: Record<StatusMarkStatus, string> = {
  idle: "Hazır",
  pending: "Bekliyor",
  running: "Yükleniyor",
  done: "Tamamlandı",
  failed: "Başarısız",
  cancelled: "İptal edildi",
};

export function StatusMark({
  status = "pending",
  progress,
  label,
  size = 20,
  strokeWidth = 2,
  strike = false,
  className = "",
  style,
  classes = {},
}: StatusMarkProps) {
  const r = 10 - strokeWidth / 2;
  const circumference = 2 * Math.PI * r;
  const isDeterminate = status === "running" && typeof progress === "number" && Number.isFinite(progress);
  const clampedProgress = isDeterminate ? Math.min(1, Math.max(0, progress as number)) : 0;

  const ringStateClass =
    status === "running"
      ? (classes.ringRunning || "")
      : status === "done"
        ? (classes.ringDone || "")
        : status === "failed" || status === "cancelled"
          ? (classes.ringFailed || "")
          : (classes.ringPending || "");

  const determinateDasharray = isDeterminate
    ? `${clampedProgress * circumference} ${circumference}`
    : undefined;

  const spoken = STATUS_TEXT[status] + (isDeterminate ? ` (%${Math.round(clampedProgress * 100)})` : "");
  const hasLabel = label !== undefined && label !== null;

  return (
    <span
      className={`${classes.root || ""}${className ? ` ${className}` : ""}`}
      data-status={status}
      data-strike={strike ? "true" : "false"}
      style={style}
    >
      <svg
        className={classes.glyph}
        viewBox="0 0 24 24"
        width={size}
        height={size}
        role={hasLabel ? undefined : "img"}
        aria-label={hasLabel ? undefined : spoken}
        aria-hidden={hasLabel || undefined}
      >
        <circle
          className={classes.track}
          cx="12"
          cy="12"
          r={r}
          strokeWidth={strokeWidth}
          transform="rotate(-90 12 12)"
        />
        <circle
          className={`${classes.ring || ""} ${ringStateClass}`.trim()}
          cx="12"
          cy="12"
          r={r}
          strokeWidth={strokeWidth}
          strokeDasharray={determinateDasharray}
          transform="rotate(-90 12 12)"
        />
        <path
          className={classes.check}
          d={CHECK_PATH}
          strokeWidth={strokeWidth}
          pathLength="1"
        />
        <path
          className={classes.cross}
          d={CROSS_PATH}
          strokeWidth={strokeWidth}
          pathLength="1"
        />
      </svg>
      {hasLabel ? <span className={classes.srOnly}>{spoken}: </span> : null}
      {hasLabel ? (
        <span className={classes.label}>
          {label}
          <span className={classes.strike} aria-hidden="true" />
        </span>
      ) : null}
    </span>
  );
}

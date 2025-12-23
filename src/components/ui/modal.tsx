"use client";

import React from "react";
import { X } from "lucide-react";

type ModalAction = {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "danger";
};

type Microtext = {
  label: string;
  value?: string;
};

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  actions?: ModalAction[];
  microtexts?: Microtext[]; // small helper texts, hints, or metadata
  children?: React.ReactNode; // additional custom content
  size?: "sm" | "md" | "lg" | "xl" | "full";
  bodyClassName?: string;
};

export function Modal({
  open,
  onClose,
  title,
  description,
  actions = [],
  microtexts = [],
  children,
  size = "md",
  bodyClassName = "",
}: ModalProps) {
  if (!open) return null;

  const widthClass =
    size === "xl"
      ? "w-[min(980px,96vw)]"
      : size === "lg"
      ? "w-[min(720px,96vw)]"
      : size === "full"
      ? "w-[96vw]"
      : size === "sm"
      ? "w-[min(420px,96vw)]"
      : "w-[min(560px,96vw)]";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className={`relative z-50 ${widthClass} rounded-2xl border bg-background shadow-2xl max-h-[96vh] md:max-h-[97vh] flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold">{title}</h2>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-foreground/5 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className={`px-5 py-4 space-y-4 overflow-y-auto flex-1 ${bodyClassName || ""}`}>
          {children}

          {/* Microtext grid */}
          {microtexts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {microtexts.map((m, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border px-3 py-2 bg-foreground/3"
                >
                  <div className="text-xs font-medium text-muted-foreground">
                    {m.label}
                  </div>
                  {typeof m.value !== "undefined" && (
                    <div className="text-sm text-foreground mt-0.5 break-all">
                      {m.value}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t flex items-center justify-end gap-2 shrink-0">
          {actions.map((a, i) => {
            const base =
              "px-4 py-2 text-sm rounded-md transition-colors border";
            const variant =
              a.variant === "danger"
                ? "bg-red-600 text-white hover:bg-red-700 border-red-700"
                : a.variant === "secondary"
                ? "bg-background text-foreground hover:bg-foreground/5"
                : "bg-primary text-primary-foreground hover:bg-primary/90 border-primary";
            return (
              <button
                key={i}
                onClick={a.onClick}
                className={`${base} ${variant}`}
              >
                {a.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Modal;

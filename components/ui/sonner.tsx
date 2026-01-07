"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import React from "react";
import { Toaster as Sonner, type ToasterProps, toast, useSonner } from "sonner";

function SonnerClickToDismissBridge({
  position,
}: {
  position: ToasterProps["position"];
}) {
  const { toasts } = useSonner();

  const toastsRef = React.useRef(toasts);
  const positionRef = React.useRef(position);

  React.useEffect(() => {
    toastsRef.current = toasts;
  }, [toasts]);

  React.useEffect(() => {
    positionRef.current = position;
  }, [position]);

  React.useEffect(() => {
    const handler = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      // action/cancel/closeButton を押した場合はライブラリ側に任せる
      if (target.closest("[data-button], [data-close-button]")) return;

      const toastEl = target.closest("[data-sonner-toast]");
      if (!(toastEl instanceof HTMLElement)) return;

      const index = Number.parseInt(toastEl.dataset.index ?? "", 10);
      if (!Number.isFinite(index)) return;

      const y = toastEl.dataset.yPosition;
      const x = toastEl.dataset.xPosition;
      if (!y || !x) return;

      const clickedPosition = `${y}-${x}` as ToasterProps["position"];
      const globalPosition = positionRef.current ?? "bottom-right";

      // DOM上の data-index は「該当positionのトースト配列」に対する index（0=最前面）
      const candidates = toastsRef.current.filter(
        (t) => (t.position ?? globalPosition) === clickedPosition,
      );
      const clicked = candidates[index];
      if (!clicked) return;

      toast.dismiss(clicked.id);
    };

    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, []);

  return null;
}

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <>
      <Sonner
        theme={theme as ToasterProps["theme"]}
        className="toaster group"
        icons={{
          success: <CircleCheckIcon className="size-4" />,
          info: <InfoIcon className="size-4" />,
          warning: <TriangleAlertIcon className="size-4" />,
          error: <OctagonXIcon className="size-4" />,
          loading: <Loader2Icon className="size-4 animate-spin" />,
        }}
        style={
          {
            "--normal-bg": "var(--popover)",
            "--normal-text": "var(--popover-foreground)",
            "--normal-border": "var(--border)",
            "--border-radius": "var(--radius)",
          } as React.CSSProperties
        }
        {...props}
      />
      {/* sonner本体がonClickを提供していないため、DOM属性とuseSonnerを使ってクリックdismissを実現 */}
      <SonnerClickToDismissBridge position={props.position} />
    </>
  );
};

export { Toaster };

"use client";

import { useEffect, useRef, useState } from "react";
import { Spinner } from "./spinner";

interface SpinnerWithFadeProps {
  isLoading: boolean;
  className?: string;
}

/**
 * SpinnerWithFade
 * フェードイン/アウト演出とレイアウトシフト防止を実装したSpinnerラッパー
 *
 * 仕様:
 * - 処理開始: スピナーをマウント、1秒かけてフェードイン
 * - 処理終了: 1秒かけてフェードアウト、スピナーをアンマウント
 */
export function SpinnerWithFade({
  isLoading,
  className,
}: SpinnerWithFadeProps) {
  const [shouldRender, setShouldRender] = useState(false);
  const [opacity, setOpacity] = useState<"opacity-0" | "opacity-100">(
    "opacity-0",
  );
  const unmountTimerRef = useRef<number | null>(null);

  useEffect(() => {
    // 既存のタイマーをクリア
    if (unmountTimerRef.current !== null) {
      window.clearTimeout(unmountTimerRef.current);
      unmountTimerRef.current = null;
    }

    if (isLoading) {
      // 処理開始: マウントしてフェードイン
      setShouldRender(true);
      setOpacity("opacity-0");

      // 短い遅延後にフェードイン開始（レイアウトシフト防止のため）
      const fadeInTimer = window.setTimeout(() => {
        setOpacity("opacity-100");
      }, 10);

      return () => {
        window.clearTimeout(fadeInTimer);
      };
    }

    // 処理終了: フェードアウト
    if (shouldRender) {
      setOpacity("opacity-0");

      // 1秒後にアンマウント
      unmountTimerRef.current = window.setTimeout(() => {
        setShouldRender(false);
        unmountTimerRef.current = null;
      }, 1000);
    }
  }, [isLoading, shouldRender]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      data-spinner-container
      className={`inline-flex items-center gap-2 transition-opacity duration-1000 ${opacity} ${className || ""}`}
      style={{ minHeight: "1.5rem" }} // レイアウトシフト防止のため最小高さを設定
    >
      <Spinner />
      <span className="text-sm text-slate-700">読み込み中…</span>
    </div>
  );
}

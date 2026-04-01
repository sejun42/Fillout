"use client";

import { useEffect, useState } from "react";

import { buttonStyles, Card } from "@/components/ui";

interface DeferredInstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<DeferredInstallPrompt | null>(null);
  const [isStandalone] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia("(display-mode: standalone)").matches,
  );
  const [isIos] = useState(() =>
    typeof window === "undefined" ? false : /iPad|iPhone|iPod/.test(navigator.userAgent),
  );

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as DeferredInstallPrompt);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  if (isStandalone) {
    return null;
  }

  async function handleInstall() {
    if (!deferredPrompt) {
      return;
    }

    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }

  return (
    <Card className="overflow-hidden bg-[linear-gradient(135deg,_rgba(16,37,63,0.98),_rgba(24,78,119,0.9))] text-white">
      <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#8fc8ff]">PWA</p>
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold tracking-[-0.03em]">홈 화면에 추가해서 앱처럼 사용</h3>
          <p className="text-sm leading-6 text-white/74">
            운동 중 빠르게 열 수 있도록 설치형 사용을 지원합니다.
            {isIos ? " iPhone에서는 공유 버튼 후 '홈 화면에 추가'를 사용하세요." : ""}
          </p>
        </div>
        {deferredPrompt ? (
          <button type="button" onClick={handleInstall} className={buttonStyles("secondary")}>
            설치하기
          </button>
        ) : (
          <span className="rounded-full bg-white/12 px-3 py-2 text-xs text-white/70">
            브라우저가 설치 가능 조건을 만족하면 버튼이 표시됩니다
          </span>
        )}
      </div>
    </Card>
  );
}

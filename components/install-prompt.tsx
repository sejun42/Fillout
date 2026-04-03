"use client";

import { useEffect, useState } from "react";

import { buttonStyles, Card } from "@/components/ui";

interface DeferredInstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function detectStandalone() {
  if (typeof window === "undefined") {
    return false;
  }

  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    navigatorWithStandalone.standalone === true
  );
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<DeferredInstallPrompt | null>(null);
  const [isStandalone, setIsStandalone] = useState(detectStandalone);
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

  useEffect(() => {
    const standaloneMediaQuery = window.matchMedia("(display-mode: standalone)");
    const fullscreenMediaQuery = window.matchMedia("(display-mode: fullscreen)");

    function handleDisplayModeChange() {
      setIsStandalone(detectStandalone());
    }

    standaloneMediaQuery.addEventListener("change", handleDisplayModeChange);
    fullscreenMediaQuery.addEventListener("change", handleDisplayModeChange);
    window.addEventListener("focus", handleDisplayModeChange);
    window.addEventListener("pageshow", handleDisplayModeChange);

    return () => {
      standaloneMediaQuery.removeEventListener("change", handleDisplayModeChange);
      fullscreenMediaQuery.removeEventListener("change", handleDisplayModeChange);
      window.removeEventListener("focus", handleDisplayModeChange);
      window.removeEventListener("pageshow", handleDisplayModeChange);
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
    <Card className="overflow-hidden p-4 bg-[linear-gradient(135deg,_rgba(16,37,63,0.98),_rgba(24,78,119,0.9))] text-white">
      <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[#8fc8ff]">PWA</p>
      <div className="mt-1.5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h3 className="text-base font-medium tracking-[-0.03em]">홈 화면에 추가해서 앱처럼 사용</h3>
          <p className="text-xs leading-5 text-white/74">
            운동 중 빠르게 열 수 있도록 설치형 사용을 지원합니다.
            {isIos
              ? " iPhone에서는 공유 버튼 후 '홈 화면에 추가'를 사용하세요."
              : " 설치 버튼이 안 보이면 브라우저 메뉴에서 'Install' 또는 '홈 화면에 추가'를 확인하세요."}
          </p>
        </div>
        {deferredPrompt ? (
          <button type="button" onClick={handleInstall} className={buttonStyles("secondary")}>
            설치하기
          </button>
        ) : (
          <span className="rounded-full bg-white/12 px-3 py-1.5 text-[11px] text-white/70">
            설치 가능 조건을 만족하면 버튼이 자동 표시됩니다
          </span>
        )}
      </div>
    </Card>
  );
}

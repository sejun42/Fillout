"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { useWorkoutApp } from "@/components/providers/workout-app-provider";
import { Card, SectionHeading, buttonStyles } from "@/components/ui";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Mode = "sign-in" | "sign-up";

export function LoginPanel() {
  const router = useRouter();
  const { signIn, supabaseConfigured } = useWorkoutApp();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    try {
      const trimmedEmail = email.trim();
      if (!trimmedEmail) {
        throw new Error("이메일을 입력하세요.");
      }

      if (!supabaseConfigured) {
        signIn(trimmedEmail, "supabase");
        router.replace("/");
        return;
      }

      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        throw new Error("Supabase 클라이언트를 초기화할 수 없습니다.");
      }

      const result =
        mode === "sign-in"
          ? await supabase.auth.signInWithPassword({
              email: trimmedEmail,
              password,
            })
          : await supabase.auth.signUp({
              email: trimmedEmail,
              password,
            });

      if (result.error) {
        throw result.error;
      }

      if (mode === "sign-up" && !result.data.session) {
        setError("회원가입은 완료됐습니다. 이메일 인증 후 다시 로그인하세요.");
        return;
      }

      router.replace("/");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "로그인에 실패했습니다.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-4 py-10 sm:px-6">
      <div className="grid w-full gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="bg-[linear-gradient(135deg,_rgba(16,37,63,0.98),_rgba(20,88,135,0.86))] text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8fc8ff]">Fillout MVP</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em]">
            머신 세팅까지 기억하는 운동 기록 앱
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/76">
            캘린더, 머신 브랜드, 안장 높이, 패드 위치, 이전 세트 기록, 주간 통계를 하나의 흐름으로 연결했습니다.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[24px] bg-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-white/66">Must have</p>
              <p className="mt-2 text-lg font-semibold">캘린더 + 세션 편집</p>
            </div>
            <div className="rounded-[24px] bg-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-white/66">Smart defaults</p>
              <p className="mt-2 text-lg font-semibold">이전 세팅 자동 프리필</p>
            </div>
          </div>
        </Card>

        <Card>
          <SectionHeading
            eyebrow="Auth"
            title={mode === "sign-in" ? "로그인" : "회원가입"}
            description={
              supabaseConfigured
                ? "Supabase Auth로 로그인하면 기기간 동기화가 됩니다."
                : "환경 변수가 없으면 로컬 전용 개인 워크스페이스로 동작합니다."
            }
          />
          <div className="mt-4 inline-flex rounded-full bg-[#edf3f9] p-1">
            <button
              type="button"
              onClick={() => setMode("sign-in")}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                mode === "sign-in" ? "bg-[#10253f] text-white" : "text-[#506981]"
              }`}
            >
              로그인
            </button>
            <button
              type="button"
              onClick={() => setMode("sign-up")}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                mode === "sign-up" ? "bg-[#10253f] text-white" : "text-[#506981]"
              }`}
            >
              회원가입
            </button>
          </div>

          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-[#506981]">이메일</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-2xl border border-[#d5dfeb] bg-white px-4 py-3 text-sm"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-[#506981]">비밀번호</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="비밀번호"
                className="w-full rounded-2xl border border-[#d5dfeb] bg-white px-4 py-3 text-sm"
              />
            </label>
            {error ? <p className="text-sm text-[#a93f3a]">{error}</p> : null}
            <div className="flex flex-wrap gap-3">
              <button type="submit" className={buttonStyles("primary")} disabled={pending}>
                {pending ? "처리 중..." : mode === "sign-in" ? "로그인" : "회원가입"}
              </button>
              <button
                type="button"
                className={buttonStyles("secondary")}
                onClick={() => {
                  signIn("demo@fillout.fit", "demo");
                  router.replace("/");
                }}
              >
                데모로 바로 진입
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";

import { useWorkoutApp } from "@/components/providers/workout-app-provider";
import { Card, SectionHeading, buttonStyles } from "@/components/ui";

export function SettingsDashboard() {
  const { state, signOut, supabaseConfigured } = useWorkoutApp();

  return (
    <div className="space-y-5">
      <Card>
        <SectionHeading eyebrow="Account" title="계정 및 세션" description="현재 로그인 상태와 데이터 소스를 확인합니다." />
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[24px] bg-[#f5f8fb] p-4">
            <p className="text-xs text-[#647b95]">현재 사용자</p>
            <p className="mt-2 text-lg font-semibold text-[#10253f]">
              {state.profile?.email ?? "로그인 안 됨"}
            </p>
            <p className="mt-1 text-sm text-[#647b95]">
              {state.profile?.nickname ?? "닉네임 없음"}
            </p>
          </div>
          <div className="rounded-[24px] bg-[#fff4e8] p-4">
            <p className="text-xs text-[#9a6b1b]">앱 모드</p>
            <p className="mt-2 text-lg font-semibold text-[#8b4a18]">{state.mode}</p>
            <p className="mt-1 text-sm text-[#9a6b1b]">
              {supabaseConfigured ? "Supabase 환경 변수가 감지되었습니다." : "환경 변수가 없어 데모 데이터로 동작합니다."}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/login" className={buttonStyles("secondary")}>
            로그인 화면 이동
          </Link>
          <button type="button" className={buttonStyles("danger")} onClick={signOut}>
            로그아웃
          </button>
        </div>
      </Card>

      <Card>
        <SectionHeading eyebrow="Deployment" title="Supabase / Vercel 연결 체크" description="실서비스 전 준비해야 하는 항목" />
        <div className="mt-5 space-y-3 text-sm leading-6 text-[#56697f]">
          <div className="rounded-[22px] bg-[#f5f8fb] p-4">
            `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`를 `.env.local`에 설정합니다.
          </div>
          <div className="rounded-[22px] bg-[#f5f8fb] p-4">
            [supabase/migrations/0001_mvp_schema.sql](/D:/Fillout/fillout-app/supabase/migrations/0001_mvp_schema.sql)을 적용하고
            [supabase/seed.sql](/D:/Fillout/fillout-app/supabase/seed.sql)로 초기 데이터를 넣습니다.
          </div>
          <div className="rounded-[22px] bg-[#f5f8fb] p-4">
            Vercel 배포 시 동일한 환경 변수를 넣고 PWA 아이콘과 manifest가 정상 노출되는지 확인합니다.
          </div>
        </div>
      </Card>
    </div>
  );
}

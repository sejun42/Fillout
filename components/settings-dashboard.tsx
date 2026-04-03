"use client";

import Link from "next/link";

import { useWorkoutApp } from "@/components/providers/workout-app-provider";
import { Card, Pill, SectionHeading, buttonStyles } from "@/components/ui";

export function SettingsDashboard() {
  const { state, signOut, supabaseConfigured, isSyncing, syncError } = useWorkoutApp();

  return (
    <div className="space-y-5">
      <Card>
        <SectionHeading eyebrow="Account" title="계정 및 동기화 상태" description="현재 로그인 상태와 데이터 소스를 확인합니다." />
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[24px] bg-[#f5f8fb] p-4">
            <p className="text-xs text-[#647b95]">현재 사용자</p>
            <p className="mt-2 text-lg font-semibold text-[#10253f]">
              {state.profile?.email ?? "로그인 안 됨"}
            </p>
            <p className="mt-1 text-sm text-[#647b95]">{state.profile?.nickname ?? "닉네임 없음"}</p>
          </div>
          <div className="rounded-[24px] bg-[#fff4e8] p-4">
            <p className="text-xs text-[#9a6b1b]">앱 모드</p>
            <p className="mt-2 text-lg font-semibold text-[#8b4a18]">{state.mode}</p>
            <p className="mt-1 text-sm text-[#9a6b1b]">
              {supabaseConfigured
                ? "Supabase 환경 변수 감지됨"
                : "환경 변수가 없어서 데모/로컬 모드로 동작 중"}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Pill>{isSyncing ? "Supabase 동기화 중" : "동기화 대기"}</Pill>
          {syncError ? <Pill className="bg-[#a93f3a] text-white">{syncError}</Pill> : null}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/login" className={buttonStyles("secondary")}>
            로그인 화면 이동
          </Link>
          <button
            type="button"
            className={buttonStyles("danger")}
            onClick={() => {
              void signOut();
            }}
          >
            로그아웃
          </button>
        </div>
      </Card>

      <Card>
        <SectionHeading eyebrow="Deployment" title="Supabase / Vercel 연결 체크" description="기기간 동기화와 공용 머신 공유를 위한 필수 항목" />
        <div className="mt-5 space-y-3 text-sm leading-6 text-[#56697f]">
          <div className="rounded-[22px] bg-[#f5f8fb] p-4">
            `.env.local`과 Vercel 환경 변수에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`를 넣습니다.
          </div>
          <div className="rounded-[22px] bg-[#f5f8fb] p-4">
            기존 [0001_mvp_schema.sql](/D:/Fillout/fillout-app/supabase/migrations/0001_mvp_schema.sql)과
            [seed.sql](/D:/Fillout/fillout-app/supabase/seed.sql)을 적용했다면,
            이번 작업용 추가 마이그레이션도 이어서 적용해야 합니다.
          </div>
          <div className="rounded-[22px] bg-[#f5f8fb] p-4">
            Supabase Auth의 `URL Configuration`에 로컬/배포 URL을 모두 등록해야 모바일과 PWA 로그인 흐름이 안정적입니다.
          </div>
        </div>
      </Card>
    </div>
  );
}

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fillout",
    short_name: "Fillout",
    description: "캘린더 중심 커스텀 운동 기록 웹앱",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f3ea",
    theme_color: "#10253f",
    icons: [
      {
        src: "/app-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}

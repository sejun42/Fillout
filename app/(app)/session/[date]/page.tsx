import { SessionEditor } from "@/components/session-editor";

export default async function SessionPage(props: PageProps<"/session/[date]">) {
  const { date } = await props.params;
  return <SessionEditor sessionDate={date} />;
}

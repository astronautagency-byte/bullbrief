import { PageHead } from "@/components/page-head";
import { KypHome } from "@/components/kyp/kyp-home";

export default function KypPage() {
  return (
    <>
      <PageHead title="Know Your Product" description="Evidence-backed product research, alternatives review and archived advisor rationale." canonical="https://bullbrief.vercel.app/kyp" />
      <KypHome />
    </>
  );
}

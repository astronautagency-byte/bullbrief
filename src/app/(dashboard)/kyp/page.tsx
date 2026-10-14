import { PageHead } from "@/components/page-head";
import { KypWorkspace } from "@/components/kyp/kyp-workspace";

export default function KypPage() {
  return (
    <>
      <PageHead title="Know Your Product" description="A simplified Morningstar-backed KYP review workspace for financial advisors." canonical="https://bullbrief.vercel.app/kyp" />
      <KypWorkspace />
    </>
  );
}

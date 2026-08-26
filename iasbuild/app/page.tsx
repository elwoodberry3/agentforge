import ClaudeMdForm from "@/components/ClaudeMdForm";
import { build021 } from "@/lib/build.config";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-12">
        <div className="mb-8 border-b border-[#E5E7EB] pb-6">
          <p className="font-mono text-xs uppercase tracking-wider text-[#3F7266]">
            IAS · Build {build021.buildNumber} · {build021.sector}
          </p>
          <h1 className="mt-1.5 text-2xl font-bold text-[#0A2E36]">
            {build021.name}
          </h1>
          <p className="mt-2 max-w-prose text-[15px] text-[#6B7280]">
            {build021.tagline}
          </p>
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#00E5A3] bg-[rgba(0,229,163,0.10)] px-2.5 py-1 font-mono text-[11px] text-[#0A2E36]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00E5A3]" />
            LIVE — the generator runs on this page
          </span>
        </div>
        <ClaudeMdForm />
      </main>
      <SiteFooter />
    </div>
  );
}

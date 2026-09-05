import ClaudeMdForm from "@/components/ClaudeMdForm";
import { build021 } from "@/lib/build.config";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-12">
        <div className="mb-8 border-b border-[#E5E7EB] pb-6">
          <Image
            src="/brand/agentforge.png"
            alt="AgentForge"
            width={425}
            height={50}
            priority
            className="h-9 w-auto"
          />
          <p className="mt-3 max-w-prose text-[15px] text-[#6B7280]">
            {build021.tagline}
          </p>
        </div>
        <ClaudeMdForm />
      </main>
      <SiteFooter />
    </div>
  );
}

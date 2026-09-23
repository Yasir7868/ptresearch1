import Image from "next/image";

/** Sign-in, first-owner setup, invite and reset pages: a single centered card. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px]">
        <div className="mb-6 flex items-center gap-3">
          <Image src="/brand/logo.png" alt="" width={40} height={40} className="size-10" priority />
          <div>
            <p className="text-[17px] leading-tight font-semibold tracking-[-0.015em] text-ink">Primetime Research</p>
            <p className="micro-label mt-0.5">Admin panel</p>
          </div>
        </div>
        {children}
      </div>
    </main>
  );
}

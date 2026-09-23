"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Menu } from "lucide-react";
import type { Role } from "@/lib/admin/permissions";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AdminSidebar } from "./AdminSidebar";

export function MobileTopBar(props: {
  user: { name: string; email: string; role: Role };
  storeUrl: string;
  wpAdminUrl: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="band-green sticky top-0 z-30 flex h-14 items-center gap-3 px-4 lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger className="-ml-1.5 rounded-lg p-1.5 text-[var(--mint-bright)] hover:bg-white/10">
          <Menu aria-hidden="true" className="size-6" />
          <span className="sr-only">Open menu</span>
        </SheetTrigger>
        <SheetContent side="left" showCloseButton={false} className="w-72 max-w-[85vw] border-none bg-band p-0">
          <SheetTitle className="sr-only">Admin menu</SheetTitle>
          <SheetDescription className="sr-only">Navigate the admin panel</SheetDescription>
          <AdminSidebar {...props} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <Link href="/admin" className="flex items-center gap-2.5">
        <Image src="/brand/logo-footer.png" alt="" width={28} height={28} className="size-7" />
        <span className="text-[15px] font-semibold text-[var(--mint-bright)]">Primetime admin</span>
      </Link>
    </header>
  );
}

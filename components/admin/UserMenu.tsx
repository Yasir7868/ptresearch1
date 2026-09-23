"use client";

import Link from "next/link";
import { ChevronsUpDown, ExternalLink, LogOut, Store, UserRound } from "lucide-react";
import { signOut } from "@/app/admin/(panel)/actions";
import { ROLE_INFO, type Role } from "@/lib/admin/permissions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0]![0]! + parts[parts.length - 1]![0]! : (parts[0] ?? "?").slice(0, 2);
  return letters.toUpperCase();
}

export function UserMenu({
  user,
  storeUrl,
  wpAdminUrl,
  onNavigate,
}: {
  user: { name: string; email: string; role: Role };
  storeUrl: string;
  wpAdminUrl: string;
  onNavigate?: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-white/[0.06] focus-visible:outline-offset-[-2px] data-[state=open]:bg-white/10">
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/12 text-[13px] font-semibold text-[var(--mint-bright)]"
        >
          {initials(user.name)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-medium text-[var(--mint-bright)]">{user.name}</span>
          <span className="block truncate text-[12px] text-mint/75">{ROLE_INFO[user.role].label}</span>
        </span>
        <ChevronsUpDown aria-hidden="true" className="size-4 shrink-0 text-mint/70" />
        <span className="sr-only">Account menu</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-60">
        <DropdownMenuLabel className="flex flex-col gap-0.5 font-normal">
          <span className="truncate text-sm font-medium text-ink">{user.name}</span>
          <span className="truncate text-xs">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/admin/account" onClick={onNavigate}>
            <UserRound /> Your account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={storeUrl} target="_blank" rel="noreferrer">
            <Store /> View storefront
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={wpAdminUrl} target="_blank" rel="noreferrer">
            <ExternalLink /> WordPress admin
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={signOut}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full">
              <LogOut /> Sign out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

import { notFound } from "next/navigation";
import { requireUser } from "@/lib/admin/auth";

/** Unknown /admin URLs render the admin 404 inside the panel, not the shop's. */
export default async function MissingAdminPage() {
  await requireUser();
  notFound();
}

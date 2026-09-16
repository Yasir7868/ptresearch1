/**
 * TrackOrderForm — prototype order-lookup form (order number + email), framed
 * as a soft specimen record card (16px radius, layered soft shadow).
 *
 * Disabled for the demo (no store backend wired yet). Server-rendered, no
 * submit path. A micro-label note explains the state and links to /contact.
 */
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const fieldLabel = "micro-label";

export function TrackOrderForm() {
  return (
    <div className="plate">
      <form
        className="plate-field flex flex-col gap-5 p-6 md:p-8"
        aria-describedby="track-demo-note"
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="track-order" className={fieldLabel}>
            Order number
          </Label>
          <Input id="track-order" name="order" placeholder="e.g. PT-10482" />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="track-email" className={fieldLabel}>
            Email on order
          </Label>
          <Input
            id="track-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@lab.org"
          />
        </div>

        <div className="flex flex-col gap-3">
          <Button type="button" disabled className="h-10 w-full sm:w-auto">
            Track order
          </Button>
          <p id="track-demo-note" className="micro-label leading-relaxed">
            Order tracking connects to the store backend at launch. Need help
            with an order now?{" "}
            <Link
              href="/contact"
              className="text-green normal-case tracking-normal underline decoration-hairline underline-offset-4 hover:text-green-deep"
            >
              Contact support
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}

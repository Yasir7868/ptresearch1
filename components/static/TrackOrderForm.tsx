/**
 * TrackOrderForm — prototype order-lookup form with the live /track-your-order/
 * labels (Order ID + Billing email, "Track"), framed as a soft specimen record
 * card (16px radius, layered soft shadow).
 *
 * Disabled for the demo (no store backend wired yet). Server-rendered, no
 * submit path. A micro-label note explains the state and links to /contact.
 */
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { contactInfo, trackOrderPage } from "@/content/site-copy";

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
            {trackOrderPage.orderIdLabel}
          </Label>
          <Input
            id="track-order"
            name="orderid"
            placeholder={trackOrderPage.orderIdPlaceholder}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="track-email" className={fieldLabel}>
            {trackOrderPage.emailLabel}
          </Label>
          <Input
            id="track-email"
            name="order_email"
            type="email"
            autoComplete="email"
            placeholder={trackOrderPage.emailPlaceholder}
          />
        </div>

        <div className="flex flex-col gap-3">
          <Button type="button" disabled className="h-10 w-full sm:w-auto">
            {trackOrderPage.submit}
          </Button>
          <p id="track-demo-note" className="micro-label leading-relaxed">
            Demo — order tracking connects to the store backend at launch.{" "}
            <Link
              href="/contact"
              className="text-green normal-case tracking-normal underline decoration-hairline underline-offset-4 hover:text-green-deep"
            >
              {contactInfo.cta}
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}

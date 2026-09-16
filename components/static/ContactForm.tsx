/**
 * ContactForm — prototype support form (name / email / topic / message),
 * framed as a soft specimen record card (16px radius, layered soft shadow).
 *
 * The submit control is deliberately DISABLED for the demo: there is no live
 * backend, so the form never posts. A micro-label note points researchers to
 * the support inbox instead. The Select is the only interactive leaf (radix,
 * client) — the rest is a plain server-rendered form with no submit path
 * (Enter can't post it because there is no enabled submit control).
 */
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TOPICS = [
  "General inquiry",
  "Product / COA request",
  "Order status",
  "Bulk order",
  "Other",
] as const;

const fieldLabel = "micro-label";

export function ContactForm({ supportEmail }: { supportEmail: string }) {
  return (
    <div className="plate">
      <form
        className="plate-field flex flex-col gap-5 p-6 md:p-8"
        aria-describedby="contact-demo-note"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="contact-name" className={fieldLabel}>
              Name
            </Label>
            <Input id="contact-name" name="name" autoComplete="name" placeholder="Full name" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="contact-email" className={fieldLabel}>
              Email
            </Label>
            <Input
              id="contact-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@lab.org"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="contact-topic" className={fieldLabel}>
            Topic
          </Label>
          <Select>
            <SelectTrigger id="contact-topic" className="h-9 w-full">
              <SelectValue placeholder="Select a topic" />
            </SelectTrigger>
            <SelectContent>
              {TOPICS.map((topic) => (
                <SelectItem key={topic} value={topic}>
                  {topic}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="contact-message" className={fieldLabel}>
            Message
          </Label>
          <Textarea
            id="contact-message"
            name="message"
            rows={5}
            placeholder="How can we help with your research?"
          />
        </div>

        <div className="flex flex-col gap-3">
          <Button type="button" disabled className="h-10 w-full sm:w-auto">
            Send message
          </Button>
          <p id="contact-demo-note" className="micro-label leading-relaxed">
            Form goes live at launch — email us directly meanwhile at{" "}
            <a
              href={`mailto:${supportEmail}`}
              className="text-green normal-case tracking-normal underline decoration-hairline underline-offset-4 hover:text-green-deep"
            >
              {supportEmail}
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}

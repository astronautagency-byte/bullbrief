import { BrandLogo } from "@/components/ui/brand-logo";
import { WealthSculpture } from "@/components/ui/wealth-sculpture";
import { CalendarDays, ClipboardCheck, Users } from "lucide-react";
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="institution-suite institutional-auth modern-auth"><aside className="auth-story"><div className="auth-brand-signet"><BrandLogo variant="wordmark" size="lg"/></div><div className="auth-story-copy"><p>Built around your practice</p><h2>More clarity.<br/>More time for clients.</h2><p>Your relationships, meeting preparation and product reviews, connected in one considered workspace.</p><ul><li><Users/>A complete view of your client book</li><li><CalendarDays/>Meetings with context and clear next steps</li><li><ClipboardCheck/>Product research with a record behind it</li></ul><WealthSculpture className="auth-wealth-sculpture"/></div><p>BullBrief · Canadian advisory workspace</p></aside><main className="auth-form-side">{children}</main></div>;
}

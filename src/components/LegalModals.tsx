import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const TOS_HEADERS = [
  "Acceptance of Terms",
  "Eligibility (18+ requirement)",
  "Description of the Service",
  "User Accounts and Responsibilities",
  "Subscription, Cancellation, and Refunds",
  "Electronic Communications and Consent",
  "Intellectual Property",
  "Limitation of Liability",
  "Indemnification",
  "Modifications to the Terms",
  "Governing Law and Jurisdiction",
  "Contact Information",
];

const PRIVACY_HEADERS = [
  "Information We Collect",
  "How We Use Your Information",
  "How We Share Your Information",
  "Data Retention",
  "Your Rights (access, correction, deletion, portability, opt-out)",
  "Security Measures",
  "Children's Privacy (no users under 18)",
  "International Data Transfers",
  "Changes to This Policy",
  "Contact Us",
];

interface Props {
  type: "terms" | "privacy" | null;
  onClose: () => void;
}

export function LegalModal({ type, onClose }: Props) {
  const open = type !== null;
  let title = "";
  let body: React.ReactNode = null;

  if (type === "terms") {
    title = "Terms of Service";
    body = (
      <div className="space-y-3 text-sm leading-relaxed">
        <p className="text-warning font-medium">
          Placeholder content. Final legal text must be reviewed by an attorney before launch.
        </p>
        {TOS_HEADERS.map((h, i) => (
          <div key={h}>
            <h4 className="font-semibold text-primary text-sm mt-3">{i + 1}. {h}</h4>
            <p className="text-muted-foreground">Section content to be drafted by counsel.</p>
          </div>
        ))}
      </div>
    );
  } else if (type === "privacy") {
    title = "Privacy Policy";
    body = (
      <div className="space-y-3 text-sm leading-relaxed">
        <p className="text-warning font-medium">
          Placeholder content. Final legal text must be reviewed by an attorney before launch.
        </p>
        {PRIVACY_HEADERS.map((h, i) => (
          <div key={h}>
            <h4 className="font-semibold text-primary text-sm mt-3">{i + 1}. {h}</h4>
            <p className="text-muted-foreground">Section content to be drafted by counsel.</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          {body}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

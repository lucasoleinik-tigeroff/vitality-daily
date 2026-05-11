import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export const MEDICAL_DISCLAIMER = `VitalMan is a wellness and lifestyle coaching application designed to support healthy daily habits. It is not a medical device and is not intended to diagnose, treat, cure, or prevent any disease or medical condition. The content, scores, and recommendations provided by the app are for informational and educational purposes only.

The health metrics shown in this app, including BMI, calorie estimates, hydration targets, heart rate zones, and waist circumference categories, are based on general formulas from public health literature. They are not medical diagnoses and do not replace clinical evaluation.

The information provided through VitalMan does not replace professional medical advice, diagnosis, or treatment. Always seek the advice of a qualified healthcare provider with any questions you may have regarding a medical condition. Never disregard professional medical advice or delay seeking it because of something you have read or seen in this app.

If you think you may have a medical emergency, call your doctor or emergency services immediately. Reliance on any information provided by VitalMan is solely at your own risk.

Statements regarding dietary supplements have not been evaluated by the Food and Drug Administration and are not intended to diagnose, treat, cure, or prevent any disease.

By using VitalMan, you acknowledge that you have read, understood, and agreed to these terms. You confirm that you are at least 18 years of age and legally able to enter into this agreement under the laws of your jurisdiction.`;

const TOS_HEADERS = [
  "Acceptance of Terms",
  "Eligibility (18+ requirement)",
  "Description of the Service",
  "Not Medical Advice",
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
  type: "medical" | "terms" | "privacy" | null;
  onClose: () => void;
}

export function LegalModal({ type, onClose }: Props) {
  const open = type !== null;
  let title = "";
  let body: React.ReactNode = null;

  if (type === "medical") {
    title = "Medical Disclaimer";
    body = (
      <div className="space-y-3 text-sm leading-relaxed text-foreground whitespace-pre-line">
        {MEDICAL_DISCLAIMER}
      </div>
    );
  } else if (type === "terms") {
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

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Section {
  heading: string;
  body: string;
}

const TOS_INTRO = "Last updated: May 2026";

const TOS_SECTIONS: Section[] = [
  {
    heading: "Acceptance of Terms",
    body: 'By downloading, accessing, or using the VitalMan application ("App"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the App. Your continued use of the App constitutes your ongoing acceptance of any updates to these Terms.',
  },
  {
    heading: "Eligibility",
    body: "You must be at least 18 years of age to use this App. By using VitalMan, you represent and warrant that you are 18 years of age or older and have the legal capacity to enter into these Terms under the laws of your jurisdiction. If you do not meet this requirement, you must not access or use the App.",
  },
  {
    heading: "Description of the Service",
    body: "VitalMan is a wellness and lifestyle coaching application designed to help adult men build healthy daily habits related to sleep, hydration, physical activity, stress management, and supplement use. The App provides educational content, personalized health metric calculations based on user-submitted data, daily habit tracking, and curated wellness resources. VitalMan is not a medical device, does not provide medical advice, and is not a substitute for professional medical care.",
  },
  {
    heading: "User Accounts and Responsibilities",
    body: "You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You agree to provide accurate and complete information during registration and to keep your information up to date. You must not share your account with any other person. You agree not to use the App for any unlawful purpose or in any way that could harm other users or the integrity of the service. We reserve the right to suspend or terminate accounts that violate these Terms.",
  },
  {
    heading: "Subscription, Cancellation, and Refunds",
    body: "Access to certain features of VitalMan may require a subscription or one-time purchase. All fees are disclosed prior to purchase. Subscriptions automatically renew unless cancelled before the renewal date. To cancel, follow the cancellation instructions in your account settings or contact us at the address provided in Section 12. Refunds are handled in accordance with the refund policy displayed at the time of purchase. We reserve the right to change pricing at any time with reasonable notice.",
  },
  {
    heading: "Electronic Communications and Consent",
    body: "By creating an account, you consent to receive electronic communications from VitalMan, including transactional messages, product updates, and wellness content. You may opt out of marketing communications at any time by using the unsubscribe link in any email or by updating your notification preferences in the App. Opting out of marketing communications does not affect delivery of essential account and service messages.",
  },
  {
    heading: "Intellectual Property",
    body: "All content within the App, including but not limited to text, graphics, logos, icons, images, audio, and software, is the property of VitalMan or its content suppliers and is protected by applicable intellectual property laws. You are granted a limited, non-exclusive, non-transferable license to access and use the App for personal, non-commercial purposes. You may not reproduce, distribute, modify, create derivative works of, publicly display, or commercially exploit any content from the App without prior written permission.",
  },
  {
    heading: "Limitation of Liability",
    body: "To the fullest extent permitted by applicable law, VitalMan and its owners, officers, employees, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the App, even if advised of the possibility of such damages. Our total liability to you for any claims arising from your use of the App shall not exceed the amount you paid to us in the twelve months preceding the claim. Some jurisdictions do not allow the exclusion or limitation of certain damages, so some of the above limitations may not apply to you.",
  },
  {
    heading: "Indemnification",
    body: "You agree to indemnify, defend, and hold harmless VitalMan and its owners, officers, employees, and affiliates from and against any claims, liabilities, damages, losses, and expenses, including reasonable legal fees, arising out of or in any way connected with your access to or use of the App, your violation of these Terms, or your violation of any rights of another person or entity.",
  },
  {
    heading: "Modifications to the Terms",
    body: "We reserve the right to modify these Terms at any time. When we make material changes, we will notify you through the App or by email. Your continued use of the App after the effective date of any changes constitutes your acceptance of the updated Terms. If you do not agree to the updated Terms, you must stop using the App.",
  },
  {
    heading: "Governing Law and Jurisdiction",
    body: "These Terms shall be governed by and construed in accordance with the laws of the State of Florida, United States, without regard to its conflict of law provisions. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the state and federal courts located in Florida. If you are located outside the United States, you agree to comply with all local laws and regulations applicable to your use of the App.",
  },
  {
    heading: "Contact Information",
    body: "If you have any questions about these Terms, please contact us at: support@vitalman.app",
  },
];

const PRIVACY_INTRO = "Last updated: May 2026";

const PRIVACY_SECTIONS: Section[] = [
  {
    heading: "Information We Collect",
    body: "We collect information you provide directly when you create an account, complete the onboarding process, or update your profile. This includes your name, email address, age, height, weight, waist circumference, activity level, health habits, and wellness goals. We also collect daily log data you enter in the App, including sleep hours, stress levels, physical activity, hydration, and supplement use. We automatically collect certain technical data when you use the App, including device type, operating system, and usage patterns.",
  },
  {
    heading: "How We Use Your Information",
    body: "We use the information we collect to provide and improve the App, personalize your experience, calculate your health metrics and vitality score, deliver coaching content relevant to your profile, send you communications you have consented to, and comply with our legal obligations. We do not use your data to make automated decisions that produce legal or similarly significant effects without human oversight.",
  },
  {
    heading: "How We Share Your Information",
    body: "We do not sell your personal data to third parties. We may share your information with trusted service providers who assist us in operating the App, such as cloud hosting and analytics providers, under strict confidentiality agreements. We may disclose your information if required by law or in response to valid legal process. In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity, subject to the same privacy protections.",
  },
  {
    heading: "Data Retention",
    body: "We retain your personal data for as long as your account is active or as needed to provide you with the service. If you delete your account, we will delete or anonymize your personal data within 30 days, except where we are required to retain it for legal or compliance purposes.",
  },
  {
    heading: "Your Rights",
    body: "Depending on your location, you may have the right to access the personal data we hold about you, correct inaccurate data, request deletion of your data, request a portable copy of your data, and opt out of certain uses of your data. To exercise any of these rights, contact us at support@vitalman.app. We will respond to your request within 30 days.",
  },
  {
    heading: "Security Measures",
    body: "We implement industry-standard technical and organizational measures to protect your personal data against unauthorized access, disclosure, alteration, or destruction. All data is transmitted over encrypted connections. Access to personal data is restricted to authorized personnel only. However, no method of transmission over the internet is completely secure, and we cannot guarantee absolute security.",
  },
  {
    heading: "Children's Privacy",
    body: "VitalMan is intended exclusively for users who are 18 years of age or older. We do not knowingly collect personal information from anyone under 18. If we become aware that we have collected data from a person under 18, we will delete that information promptly. If you believe we have inadvertently collected such information, please contact us immediately.",
  },
  {
    heading: "International Data Transfers",
    body: "Your information may be stored and processed in the United States or in other countries where our service providers operate. By using the App, you consent to the transfer of your information to countries outside your country of residence, which may have different data protection rules. We take appropriate steps to ensure that any such transfers comply with applicable data protection laws.",
  },
  {
    heading: "Changes to This Policy",
    body: "We may update this Privacy Policy from time to time. When we make material changes, we will notify you through the App or by email. Your continued use of the App after any changes become effective constitutes your acceptance of the updated policy.",
  },
  {
    heading: "Contact Us",
    body: "If you have any questions about this Privacy Policy or how we handle your data, please contact us at: support@vitalman.app",
  },
];

interface Props {
  type: "terms" | "privacy" | null;
  onClose: () => void;
}

export function LegalModal({ type, onClose }: Props) {
  const open = type !== null;
  const isTerms = type === "terms";
  const title = isTerms ? "Terms of Service" : "Privacy Policy";
  const intro = isTerms ? TOS_INTRO : PRIVACY_INTRO;
  const sections = isTerms ? TOS_SECTIONS : PRIVACY_SECTIONS;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          {type && (
            <div className="space-y-4 text-sm leading-relaxed">
              <p className="text-muted-foreground italic">{intro}</p>
              {sections.map((s, i) => (
                <div key={s.heading}>
                  <h4 className="font-semibold text-primary text-sm mt-3">{i + 1}. {s.heading}</h4>
                  <p className="text-muted-foreground mt-1 whitespace-pre-line">{s.body}</p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

import { Badge } from "@/components/ui/badge";
import { INQUIRY_STATUS } from "@/constants/enums";
import { capitalize } from "@/lib/format";

/**
 * Where an enquiry sits in the pipeline.
 *
 * Shared by the list and the detail page so a status can never read one
 * colour on one screen and another elsewhere.
 */
const STATUS_TONES = {
  [INQUIRY_STATUS.NEW]: { tone: "attention", progress: "incomplete" },
  [INQUIRY_STATUS.CONTACTED]: { tone: "warning", progress: "partial" },
  [INQUIRY_STATUS.QUOTED]: { tone: "info", progress: "partial" },
  [INQUIRY_STATUS.WON]: { tone: "success", progress: "complete" },
  [INQUIRY_STATUS.LOST]: { tone: "neutral", progress: "complete" },
};

export function InquiryStatusPill({ status }) {
  const look = STATUS_TONES[status] ?? { tone: "neutral" };

  return (
    <Badge tone={look.tone} progress={look.progress}>
      {capitalize(status)}
    </Badge>
  );
}

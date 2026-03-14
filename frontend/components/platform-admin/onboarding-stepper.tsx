import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export type OnboardingStepState = "pending" | "active" | "done";

export interface OnboardingStepItem {
  key: string;
  title: string;
  description: string;
  state: OnboardingStepState;
}

function badgeForState(state: OnboardingStepState): "default" | "secondary" | "outline" {
  if (state === "done") return "default";
  if (state === "active") return "secondary";
  return "outline";
}

export function OnboardingStepper({ steps }: { steps: OnboardingStepItem[] }) {
  return (
    <div className="space-y-3">
      {steps.map((step, index) => (
        <Card key={step.key}>
          <CardContent className="flex items-start justify-between gap-4 p-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">{index + 1}. {step.title}</p>
              <p className="text-sm text-slate-600">{step.description}</p>
            </div>
            <Badge variant={badgeForState(step.state)}>{step.state}</Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

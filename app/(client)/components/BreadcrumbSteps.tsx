"use client";

interface BreadcrumbStepsProps {
  steps: string[];
  currentStep: number;
}

export default function BreadcrumbSteps({
  steps,
  currentStep,
}: BreadcrumbStepsProps) {
  return (
    <nav
      aria-label="Progress steps"
      className="mt-4 flex w-full justify-center md:mt-8"
    >
      <ol className="flex flex-wrap items-center justify-center gap-2 md:gap-4">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;

          return (
            <li key={index} className="flex items-center">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition md:px-4 md:py-2 md:text-base
                  ${
                    isActive
                      ? "bg-primary-accent text-white shadow-sm"
                      : isCompleted
                      ? "bg-green-100 text-green-700 ring-1 ring-green-200"
                      : "bg-gray-200 text-gray-700"
                  }
                `}
                aria-current={isActive ? "step" : undefined}
              >
                <span className="mr-1 font-semibold">{stepNumber}.</span>
                {step}
              </span>

              {/* Divider */}
              {index < steps.length - 1 && (
                <span aria-hidden="true" className="mx-2 text-gray-400 md:mx-3">
                  ›
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

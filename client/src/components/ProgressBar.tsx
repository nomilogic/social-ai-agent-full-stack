import React from "react";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentStep,
  totalSteps,
  stepLabels,
}) => {
  return (
    <div className="w-full mb-6 lg:mb-8">
      <div className="flex justify-between items-center mb-4">
        {stepLabels.map((label, index) => (
          <div
            key={index}
            className={`flex flex-col items-center ${
              index <= currentStep ? "theme-text-primary" : "theme-text-light"
            }`}
          >
            <div
              className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center text-xs lg:text-sm font-medium mb-2 transition-all duration-300 ${
                index < currentStep
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg"
                  : index === currentStep
                    ? "theme-button-primary theme-text-primary border-2 theme-border shadow-md"
                    : "theme-button-secondary theme-text-light"
              }`}
            >
              {index < currentStep ? "✓" : index + 1}
            </div>
            <span className="text-xs font-medium text-center max-w-16 leading-tight">
              {label}
            </span>
          </div>
        ))}
      </div>
      <div className="w-full theme-bg-secondary rounded-full h-2 lg:h-3 shadow-inner">
        <div
          className="theme-gradient h-2 lg:h-3 rounded-full transition-all duration-700 ease-out shadow-sm"
          style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
        />
      </div>
    </div>
  );
};

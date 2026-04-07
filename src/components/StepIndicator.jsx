export default function StepIndicator({ steps, currentStep }) {
  return (
    <div className="step-list">
      {steps.map((step, index) => (
        <div key={step.id} className={`step-chip${index === currentStep ? ' active' : ''}`}>
          <span>{index + 1}</span>
          <span>{step.label}</span>
        </div>
      ))}
    </div>
  )
}

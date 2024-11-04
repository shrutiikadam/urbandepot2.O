import React from 'react';
import './ProgressBar.css';

const ProgressBar = ({ currentStep, totalSteps, onNext, onPrev }) => {
  // Calculate the progress percentage based on currentStep and totalSteps
  const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="progress-bar-container">
      <div className="road">
        {/* Progress bar that fills based on progressPercentage */}
        <div
          className="progress"
          style={{ width: `${progressPercentage}%` }}
        ></div>
        
        {/* Moving car icon */}
        <div
          className="car-icon"
          style={{ left: `calc(${progressPercentage}% - 10px)` }}
        >
          🚗
        </div>
      </div>
      
      {/* Navigation buttons */}
      <div className="button-container">
        <button className="prev-button" onClick={onPrev} disabled={currentStep === 1}>
          Previous
        </button>
        <button className="next-button" onClick={onNext} disabled={currentStep === totalSteps}>
          Next
        </button>
      </div>
    </div>
  );
};

export default ProgressBar;
import React from 'react';

// Icons for feedback
const InfoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-custom-error">
    <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z" fill="currentColor"/>
  </svg>
);

const CheckCircleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-custom-success">
        <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-.997-6l6.06-6.061L15.65 8.527 11.003 13.17l-2.12-2.121L7.47 12.461l3.533 3.539z" fill="currentColor" />
    </svg>
);

const ExplanationIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-custom-primary">
    <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 100-16 8 8 0 000 16zM11 7h2v2h-2V7zm0 4h2v6h-2v-6z" fill="currentColor"/>
  </svg>
);

interface FeedbackSectionProps {
  type: 'explanation' | 'correct' | 'incorrect';
  content: string;
}

const FeedbackSection: React.FC<FeedbackSectionProps> = ({ type, content }) => {
  // Determine styles and icon based on feedback type
  let boxStyles = '';
  let textColor = '';
  let title = '';
  let Icon = InfoIcon;

  switch (type) {
    case 'explanation':
      boxStyles = 'bg-blue-500/[.05] border-custom-primary border-l-4';
      textColor = 'text-custom-primary';
      title = 'Explanation:';
      Icon = ExplanationIcon;
      break;
    case 'correct':
      boxStyles = 'bg-green-500/[.05] border-custom-success border-l-4';
      textColor = 'text-custom-success';
      title = content.split('!')[0] + '!';
      content = content.split('!').slice(1).join('!').trim();
      Icon = CheckCircleIcon;
      break;
    case 'incorrect':
      boxStyles = 'bg-red-500/[.05] border-custom-error border-l-4';
      textColor = 'text-custom-error';
      title = content.split('!')[0] + '!';
      content = content.split('!').slice(1).join('!').trim();
      Icon = InfoIcon;
      break;
  }

  return (
    <div className={`feedback-box ${boxStyles} rounded-rounded-md-ref p-5 mt-6 shadow-shadow-1 animate-fade-in-up`}>
      <h3 className={`feedback-header flex items-center gap-2 mb-2 font-bold ${textColor} text-lg`}>
        <Icon />
        {title}
      </h3>
      <div className="feedback-content text-custom-gray-1 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
        {content}
      </div>
    </div>
  );
};

export default FeedbackSection;

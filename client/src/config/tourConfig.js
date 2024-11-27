import React from 'react';

export const tourSteps = [
  {
    target: '#signInButton',
    content: (
      <div>
        <h3 style={{ marginBottom: '10px' }}>1. Sign In</h3>
        <p>📝 Sign in with your Wikipedia account to begin.</p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
    hideBackButton: true,
  },
  {
    target: '#openCategoryDialogBtn',
    content: (
      <div>
        <h3 style={{ marginBottom: '10px' }}>2. Select Categories</h3>
        <p>🔍 Choose categories that interest you or align with your expertise.</p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '#searchOptionsButton',
    content: (
      <div>
        <h3 style={{ marginBottom: '10px' }}>3. Select Task</h3>
        <p>📚 Use the Search Options to choose whether to create new articles or improve existing content.</p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '#suggestCategoriesButton',
    content: (
      <div>
        <h3 style={{ marginBottom: '10px' }}>4. Get Suggestions</h3>
        <p>💡 Click on 'Suggest Me Categories' to get recommendations based on your interests.</p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '#searchButton',
    content: (
      <div>
        <h3 style={{ marginBottom: '10px' }}>5. Search Articles</h3>
        <p>🚀 When you're ready, click here to search for articles to contribute to.</p>
      </div>
    ),
    placement: 'bottom',
  },
];

export const tourConfig = {
  continuous: true,
  showSkipButton: true,
  scrollToFirstStep: true,
  spotlightClicks: true,
  disableOverlayClose: false,
  spotlightPadding: 5
};

export const tourCallbacks = {
  handleJoyrideCallback: (data, setRunTour) => {
    const { status, action } = data;
    if (
      status === 'finished' || 
      status === 'skipped' || 
      action === 'close'
    ) {
      setRunTour(false);
    }
  },

  startTour: (setRunTour) => {
    setRunTour(false);
    setTimeout(() => setRunTour(true), 50);
  }
};

export const tourStyles = {
  options: {
    zIndex: 10000,
    primaryColor: '#2196F3',
    backgroundColor: '#ffffff',
    textColor: '#333333',
    arrowColor: '#ffffff',
  },
  tooltipContainer: {
    textAlign: 'left',
    borderRadius: '8px',
  },
  tooltipTitle: {
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: '10px',
  },
  tooltipContent: {
    fontSize: '14px',
    lineHeight: '1.5',
  },
  buttonNext: {
    backgroundColor: '#2196F3',
    borderRadius: '4px',
    color: '#ffffff',
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 500,
  },
  buttonBack: {
    marginRight: '10px',
    padding: '8px 16px',
    fontSize: '14px',
    color: '#666666',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
  },
  buttonSkip: {
    color: '#999999',
    fontSize: '14px',
  },
  beacon: {
    display: 'none'
  },
  spotlight: {
    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
    borderRadius: '4px',
  },
};

export const tourLocale = {
  back: 'Previous',
  close: 'Close',
  last: 'Got it',
  next: 'Next',
  skip: 'Skip tour'
};
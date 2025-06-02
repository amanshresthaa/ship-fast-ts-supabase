/**
 * Storybook Preview Configuration
 * 
 * Global decorators, parameters, and responsive design setup
 */

import type { Preview } from '@storybook/react';
import '../app/globals.css';

// Responsive viewport configurations
const responsiveViewports = {
  mobile: {
    name: 'Mobile',
    styles: {
      width: '375px',
      height: '667px',
    },
    type: 'mobile',
  },
  mobileLarge: {
    name: 'Mobile Large',
    styles: {
      width: '414px',
      height: '896px',
    },
    type: 'mobile',
  },
  tablet: {
    name: 'Tablet',
    styles: {
      width: '768px',
      height: '1024px',
    },
    type: 'tablet',
  },
  tabletLarge: {
    name: 'Tablet Large',
    styles: {
      width: '1024px',
      height: '1366px',
    },
    type: 'tablet',
  },
  desktop: {
    name: 'Desktop',
    styles: {
      width: '1440px',
      height: '900px',
    },
    type: 'desktop',
  },
  desktopLarge: {
    name: 'Desktop Large',
    styles: {
      width: '1920px',
      height: '1080px',
    },
    type: 'desktop',
  },
};

// Theme configurations
const themes = [
  {
    name: 'Light',
    value: 'light',
    color: '#ffffff',
  },
  {
    name: 'Dark',
    value: 'dark',
    color: '#1a1a1a',
  },
];

// Global decorator for responsive design context
const withResponsiveContext = (Story, context) => {
  const { viewport } = context.globals;
  
  // Apply responsive classes based on viewport
  let deviceClass = 'desktop';
  if (viewport?.name?.toLowerCase().includes('mobile')) {
    deviceClass = 'mobile';
  } else if (viewport?.name?.toLowerCase().includes('tablet')) {
    deviceClass = 'tablet';
  }

  return (
    <div 
      className={`storybook-wrapper ${deviceClass}`}
      data-device={deviceClass}
      style={{ 
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg-primary, #ffffff)',
        color: 'var(--color-text-primary, #000000)'
      }}
    >
      <Story />
    </div>
  );
};

// Theme decorator
const withThemeProvider = (Story, context) => {
  const { theme } = context.globals;
  
  // Apply theme to document
  if (typeof window !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme || 'light');
  }
  
  return <Story />;
};

// Animation control decorator
const withAnimationControl = (Story, context) => {
  const { animations } = context.globals;
  
  const animationStyle = animations === 'disabled' ? {
    animation: 'none !important',
    transition: 'none !important',
  } : {};
  
  return (
    <div style={animationStyle}>
      <Story />
    </div>
  );
};

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
      expanded: true,
      sort: 'requiredFirst',
    },
    
    viewport: {
      viewports: responsiveViewports,
      defaultViewport: 'desktop',
    },
    
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#ffffff',
        },
        {
          name: 'dark',
          value: '#1a1a1a',
        },
        {
          name: 'base-200',
          value: '#f2f2f2',
        },
      ],
    },
    
    docs: {
      toc: true,
      source: {
        state: 'open',
      },
    },
    
    // Accessibility addon configuration
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
          {
            id: 'keyboard-navigation',
            enabled: true,
          },
          {
            id: 'focus-management',
            enabled: true,
          },
        ],
      },
      options: {
        checks: { 'color-contrast': { options: { noScroll: true } } },
        restoreScroll: true,
      },
    },
    
    // Layout configuration
    layout: 'fullscreen',
    
    // Options for responsive design testing
    options: {
      storySort: {
        method: 'alphabetical',
        order: [
          'Introduction',
          'Design System',
          ['Colors', 'Typography', 'Spacing', 'Breakpoints'],
          'Components',
          'Examples',
        ],
      },
    },
  },

  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        icon: 'paintbrush',
        items: themes,
        showName: true,
        dynamicTitle: true,
      },
    },
    
    animations: {
      name: 'Animations',
      description: 'Enable/disable animations',
      defaultValue: 'enabled',
      toolbar: {
        icon: 'lightning',
        items: [
          { value: 'enabled', title: 'Enabled' },
          { value: 'disabled', title: 'Disabled' },
        ],
        showName: true,
      },
    },
    
    deviceType: {
      name: 'Device Type',
      description: 'Simulated device type',
      defaultValue: 'desktop',
      toolbar: {
        icon: 'mobile',
        items: [
          { value: 'mobile', title: 'Mobile' },
          { value: 'tablet', title: 'Tablet' },
          { value: 'desktop', title: 'Desktop' },
        ],
        showName: true,
      },
    },
  },

  decorators: [
    withResponsiveContext,
    withThemeProvider,
    withAnimationControl,
  ],

  tags: ['autodocs'],
};

export default preview;

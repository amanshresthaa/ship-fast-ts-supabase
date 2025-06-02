/**
 * Storybook Configuration for Responsive Design System
 * 
 * Features: Device simulation, theme switching, accessibility testing
 * Component documentation with interactive controls
 */

import type { StorybookConfig } from '@storybook/nextjs';

const config: StorybookConfig = {
  stories: [
    '../components/**/*.stories.@(js|jsx|ts|tsx)',
    '../app/components/**/*.stories.@(js|jsx|ts|tsx)',
    '../stories/**/*.stories.@(js|jsx|ts|tsx)'
  ],
  
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-viewport',
    '@storybook/addon-backgrounds',
    '@storybook/addon-controls',
    '@storybook/addon-docs',
    '@storybook/addon-interactions',
    '@storybook/addon-storysource',
    'storybook-addon-designs',
    'storybook-addon-responsive-viewer'
  ],

  framework: {
    name: '@storybook/nextjs',
    options: {}
  },

  typescript: {
    check: false,
    checkOptions: {},
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
    },
  },

  staticDirs: ['../public'],

  features: {
    buildStoriesJson: true,
  },

  docs: {
    autodocs: 'tag',
    defaultName: 'Documentation',
  },

  core: {
    disableTelemetry: true,
  },

  managerHead: (head) => `
    ${head}
    <style>
      .sidebar-container {
        background: var(--color-bg-secondary);
      }
      
      .sidebar-item {
        border-radius: 6px;
        margin: 2px 0;
      }
      
      .sidebar-item:hover {
        background: var(--color-bg-hover);
      }
    </style>
  `,
};

export default config;

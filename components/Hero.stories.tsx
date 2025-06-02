/**
 * Hero Component Stories
 * 
 * Demonstrates responsive behavior across devices
 */

import type { Meta, StoryObj } from '@storybook/react';
import Hero from '../Hero';

const meta: Meta<typeof Hero> = {
  title: 'Components/Hero',
  component: Hero,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# Hero Component

A responsive hero section that adapts to different screen sizes with device-specific layouts, typography scaling, and optimized interactions.

## Features
- **Mobile-first design** with touch-friendly interactions
- **Responsive typography** that scales appropriately across devices  
- **Device-specific layouts** optimized for each screen size
- **Performance optimized** with lazy loading and image optimization
- **Accessibility compliant** with proper ARIA labels and keyboard navigation

## Responsive Behavior
- **Mobile**: Single column layout with larger touch targets
- **Tablet**: Balanced two-column layout with medium spacing
- **Desktop**: Wide layout with enhanced typography and spacing
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    // Component props would go here if Hero accepted any
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default story
export const Default: Story = {
  name: 'Default Hero',
  parameters: {
    docs: {
      description: {
        story: 'The default hero component with responsive design across all device types.',
      },
    },
  },
};

// Mobile-specific story
export const Mobile: Story = {
  name: 'Mobile View',
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
    docs: {
      description: {
        story: 'Hero component optimized for mobile devices with touch-friendly interactions and compact layout.',
      },
    },
  },
};

// Tablet-specific story
export const Tablet: Story = {
  name: 'Tablet View',
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: 'Hero component on tablet devices with balanced layout and medium spacing.',
      },
    },
  },
};

// Desktop story
export const Desktop: Story = {
  name: 'Desktop View',
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        story: 'Hero component on desktop with full layout and enhanced typography.',
      },
    },
  },
};

// Dark theme story
export const DarkTheme: Story = {
  name: 'Dark Theme',
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story: 'Hero component with dark theme applied.',
      },
    },
  },
  globals: {
    theme: 'dark',
  },
};

// All viewports comparison
export const AllViewports: Story = {
  name: 'All Viewports',
  parameters: {
    docs: {
      description: {
        story: 'Use the viewport toolbar to test the component across different screen sizes.',
      },
    },
  },
};

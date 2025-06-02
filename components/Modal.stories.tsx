/**
 * Modal Component Stories
 * 
 * Demonstrates responsive modal behavior and variants
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import Modal from '../Modal';

// Wrapper component for modal state management
const ModalWrapper = (props: any) => {
  const [isModalOpen, setIsModalOpen] = useState(true);
  
  return (
    <>
      <button 
        className="btn btn-primary"
        onClick={() => setIsModalOpen(true)}
      >
        Open Modal
      </button>
      <Modal 
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        {...props}
      />
    </>
  );
};

const meta: Meta<typeof Modal> = {
  title: 'Components/Modal',
  component: ModalWrapper,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Modal Component

A fully responsive modal component with device-specific sizing, touch-friendly interactions, and accessibility features.

## Features
- **Responsive sizing** that adapts to screen size
- **Touch-friendly** close buttons and interactions
- **Accessibility compliant** with proper ARIA labels and focus management
- **Multiple sizes** from small to full-screen
- **Theme support** for light and dark modes
- **Backdrop blur** effects for modern appearance

## Responsive Behavior
- **Mobile**: Full-width with small margins, larger touch targets
- **Tablet**: Centered with appropriate max-widths
- **Desktop**: Traditional centered modal with enhanced spacing
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: {
        type: 'select',
        options: ['sm', 'md', 'lg', 'xl', 'full'],
      },
      description: 'Modal size variant',
    },
    position: {
      control: {
        type: 'select',
        options: ['center', 'top', 'bottom'],
      },
      description: 'Modal position on screen',
    },
    title: {
      control: 'text',
      description: 'Modal title',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default modal
export const Default: Story = {
  args: {
    title: 'Default Modal',
    size: 'md',
    position: 'center',
  },
};

// Small modal
export const Small: Story = {
  args: {
    title: 'Small Modal',
    size: 'sm',
    position: 'center',
  },
  parameters: {
    docs: {
      description: {
        story: 'Compact modal for simple confirmations or short forms.',
      },
    },
  },
};

// Large modal
export const Large: Story = {
  args: {
    title: 'Large Modal',
    size: 'lg',
    position: 'center',
  },
  parameters: {
    docs: {
      description: {
        story: 'Large modal for complex forms or detailed content.',
      },
    },
  },
};

// Full-screen modal
export const FullScreen: Story = {
  args: {
    title: 'Full Screen Modal',
    size: 'full',
    position: 'center',
  },
  parameters: {
    docs: {
      description: {
        story: 'Full-screen modal for mobile-first experiences or complex interfaces.',
      },
    },
  },
};

// Mobile-optimized
export const Mobile: Story = {
  args: {
    title: 'Mobile Modal',
    size: 'md',
    position: 'center',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
    docs: {
      description: {
        story: 'Modal optimized for mobile devices with touch-friendly interactions.',
      },
    },
  },
};

// Top positioned
export const TopPositioned: Story = {
  args: {
    title: 'Top Modal',
    size: 'md',
    position: 'top',
  },
  parameters: {
    docs: {
      description: {
        story: 'Modal positioned at the top of the screen.',
      },
    },
  },
};

// With custom content
export const WithContent: Story = {
  args: {
    title: 'Modal with Content',
    size: 'lg',
    position: 'center',
    children: (
      <div className="space-y-4">
        <p>This modal contains custom content including forms, images, and interactive elements.</p>
        <div className="form-control">
          <label className="label">
            <span className="label-text">Example input</span>
          </label>
          <input type="text" placeholder="Type here" className="input input-bordered w-full" />
        </div>
        <div className="flex gap-2 pt-4">
          <button className="btn btn-primary">Save</button>
          <button className="btn btn-ghost">Cancel</button>
        </div>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Modal with custom content including forms and interactive elements.',
      },
    },
  },
};

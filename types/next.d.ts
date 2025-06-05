import type { NextPage, NextPageContext, NextComponentType } from 'next';
import { ReactNode, ComponentType } from 'react';

// Extend NodeJS.ProcessEnv with our custom environment variables
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_SUPABASE_URL: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
      NODE_ENV: 'development' | 'production' | 'test';
    }
  }
}

declare module 'next' {
  export type PageProps = {
    params: Promise<{ [key: string]: string | string[] }> | { [key: string]: string | string[] };
    searchParams?:
      | Promise<{ [key: string]: string | string[] | undefined }>
      | { [key: string]: string | string[] | undefined };
  }

  export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
    getLayout?: (page: React.ReactElement) => React.ReactNode;
  };

  // For app directory
  export interface LayoutProps {
    children: ReactNode;
    params?: Record<string, string>;
  }

  export interface PageProps {
    params?: Record<string, string>;
    searchParams?: Record<string, string | string[] | undefined>;
  }
}

declare module 'next/app' {
  export interface AppProps {
    Component: NextComponentType<NextPageContext, any, any> & {
      getLayout?: (page: React.ReactElement) => React.ReactNode;
    };
    pageProps: any;
    router: any;
  }
}

// Type definitions for our custom components
declare module '@/components/*' {
  const component: ComponentType<any>;
  export default component;
}

declare module '@/components/icons' {
  import { ComponentType, SVGProps } from 'react';
  
  type IconProps = SVGProps<SVGSVGElement> & {
    className?: string;
  };

  export const Icons: {
    [key: string]: (props: IconProps) => JSX.Element;
  };
  
  export const Spinner: ComponentType<IconProps>;
  export const ChevronLeft: ComponentType<IconProps>;
  export const Menu: ComponentType<IconProps>;
  export const X: ComponentType<IconProps>;
}

declare module '@/lib/utils' {
  export function cn(...inputs: (string | undefined)[]): string;
}

declare module '*.svg' {
  import * as React from 'react';
  
  export const ReactComponent: React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & { title?: string }
  >;
  
  const src: string;
  export default src;
}

declare module '*.png' {
  const value: string;
  export default value;
}

declare module '*.jpg' {
  const value: string;
  export default value;
}

declare module '*.jpeg' {
  const value: string;
  export default value;
}

declare module '*.gif' {
  const value: string;
  export default value;
}

declare module '*.webp' {
  const value: string;
  export default value;
}

declare module '*.avif' {
  const value: string;
  export default value;
}

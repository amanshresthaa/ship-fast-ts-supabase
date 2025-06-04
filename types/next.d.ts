import type { NextPage, NextPageContext, NextComponentType } from 'next';

declare module 'next' {
  export type PageProps = {
    params: Promise<{ [key: string]: string | string[] }>;
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
  }

  export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
    getLayout?: (page: React.ReactElement) => React.ReactNode;
  };
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

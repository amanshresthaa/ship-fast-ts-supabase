import { NextPage, NextPageContext } from 'next';

declare module 'next' {
  export interface PageProps {
    params: { [key: string]: string | string[] };
    searchParams?: { [key: string]: string | string[] | undefined };
  }

  export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
    getLayout?: (page: React.ReactElement) => React.ReactNode;
  };
}

declare module 'next/app' {
  export interface AppProps {
    Component: NextPageWithLayout;
    pageProps: any;
    router: any;
  }
}

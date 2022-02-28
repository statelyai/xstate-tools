import type { AppProps } from "next/app";
import "../index.css";
import Head from "next/head";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>XState Parser Demo</title>
      </Head>
      <Component {...pageProps} />
    </>
  );
}
export default MyApp;

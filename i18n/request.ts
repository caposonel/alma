import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

export default getRequestConfig(async (params) => {
  // Single-locale site: don't touch `params.requestLocale` unless there's a
  // choice to make. Even accessing it reads request headers on pages that
  // didn't call setRequestLocale, which silently made those pages dynamic
  // (uncacheable) on every request.
  const locale =
    routing.locales.length === 1
      ? routing.defaultLocale
      : await params.requestLocale.then((requested) =>
          hasLocale(routing.locales, requested)
            ? requested
            : routing.defaultLocale
        );

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});

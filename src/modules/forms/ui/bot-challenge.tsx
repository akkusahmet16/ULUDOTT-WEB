"use client";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
export type BotConfig = { required: boolean; siteKey: string; nonce?: string };
type Turnstile = {
  render: (node: HTMLElement, options: Record<string, unknown>) => string;
  remove: (id: string) => void;
};
export function BotChallenge({
  config,
  action,
  onToken,
  resetKey,
}: {
  config?: BotConfig;
  action: string;
  onToken: (token: string) => void;
  resetKey: number;
}) {
  const node = useRef<HTMLDivElement>(null),
    [ready, setReady] = useState(false),
    [error, setError] = useState(false);
  useEffect(() => {
    if (!config?.required || !config.siteKey || !ready || !node.current) return;
    const api = (window as Window & { turnstile?: Turnstile }).turnstile;
    if (!api) {
      onToken("");
      return;
    }
    const id = api.render(node.current, {
      sitekey: config.siteKey,
      action,
      callback: (token: string) => {
        onToken(token);
        setError(false);
      },
      "expired-callback": () => onToken(""),
      "error-callback": () => {
        onToken("");
        setError(true);
      },
    });
    return () => {
      api.remove(id);
      onToken("");
    };
  }, [config, action, onToken, ready, resetKey]);
  if (!config?.required) return null;
  return (
    <section aria-label="Bot doğrulaması">
      <div ref={node} />
      {!config.siteKey || error ? (
        <p role="alert">
          Doğrulama şu anda kullanılamıyor. Daha sonra tekrar deneyin.
        </p>
      ) : (
        <>
          <Script
            id="turnstile-api"
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            nonce={config.nonce}
            strategy="afterInteractive"
            onReady={() => setReady(true)}
            onError={() => setError(true)}
          />
          <p>Göndermeden önce güvenlik doğrulamasını tamamlayın.</p>
        </>
      )}
    </section>
  );
}

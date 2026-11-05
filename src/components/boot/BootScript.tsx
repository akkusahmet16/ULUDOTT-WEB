import { buildBootScript } from "../../config/boot-script.ts";

export interface BootScriptProps {
  readonly nonce?: string;
}

export function BootScript({ nonce }: BootScriptProps) {
  return (
    <script
      id="uludott-boot"
      nonce={nonce}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: buildBootScript() }}
    />
  );
}

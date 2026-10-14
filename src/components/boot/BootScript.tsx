import { BOOT_SCRIPT } from "../../config/boot-script.ts";

export function BootScript() {
  // Next 16 preventing-flash-before-hydration rehberi: head içinde senkron script.
  return <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />;
}

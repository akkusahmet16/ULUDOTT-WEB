import type { ReactNode } from "react";
import "../../styles/sozluk.css";
import { getSozlukRequestContext } from "../../modules/sozluk/application/sozluk-request-context.ts";
import { getSozlukSidebarData } from "../../modules/sozluk/application/sozluk-service.ts";
import { SozlukShell } from "../../modules/sozluk/ui/sozluk-shell.tsx";

/*
 * Kabuk (üst bar, kanal şeridi, sol gündem çerçevesi) layout'ta render edilir;
 * böylece sayfa geçişlerinde yeniden çizilmez, yalnız orta sütun değişir ve
 * loading.tsx anında görünür.
 */
export default async function SozlukLayout({ children }: { children: ReactNode }) {
  const [ctx, gundem, bugun] = await Promise.all([
    getSozlukRequestContext(),
    getSozlukSidebarData({ mode: "gundem" }),
    getSozlukSidebarData({ mode: "bugun" }),
  ]);

  return (
    <SozlukShell
      isSubdomain={ctx.isSubdomain}
      viewer={ctx.viewer}
      channels={gundem.channels}
      gundemTopics={gundem.topics}
      bugunTopics={bugun.topics}
    >
      {children}
    </SozlukShell>
  );
}

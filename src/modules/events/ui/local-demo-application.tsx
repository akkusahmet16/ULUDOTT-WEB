import Link from "next/link";
import { localDemoEnabled, LOCAL_DEMO_FORM_SLUG } from "../../../lib/config/local-demo";
import { getPublicForm } from "../../forms/application/public-form-service";

export async function LocalDemoApplication() {
  if (!localDemoEnabled()) return null;
  const form = await getPublicForm(LOCAL_DEMO_FORM_SLUG);
  if (!form) return null;
  const open = form.state === "open" && !!form.version;
  return (
    <section className="section local-demo-application" aria-label="Yerel UluJam başvuru demosu">
      <p className="eyebrow">Yalnız yerel test · 2030 örnek etkinliği</p>
      <h2>Başvuruyu dene.</h2>
      <p>Takım kurma, başvuru, yönetim onayı ve kart akışını bu örnek etkinlikte test edebilirsiniz.</p>
      {open ? (
        <Link className="local-demo-application__link" href={`/basvuru/${LOCAL_DEMO_FORM_SLUG}`}>
          DEMO başvurusunu aç <span aria-hidden="true">↗</span>
        </Link>
      ) : (
        <p className="local-demo-application__state" role="status">{form.state}</p>
      )}
    </section>
  );
}

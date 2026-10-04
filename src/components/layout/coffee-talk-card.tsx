import Image from "next/image";
export function CoffeeTalkCard() {
  return (
    <section className="coffee-talk-card" aria-label="Coffee Talk etkinliği">
      <div className="coffee-talk-poster">
        <Image
          src="/community/04-etkinlikler/etkinlik-coffe-talk/etkinlik-coffe-talk-afis.webp"
          alt="Uludott tanışma etkinliği — Coffee Talk afişi"
          width={1080}
          height={1350}
          unoptimized
        />
      </div>
      <div className="coffee-talk-info">
        <p className="eyebrow">Topluluk buluşması</p>
        <h2>Coffee Talk</h2>
        <p className="lede">Uludott tanışma etkinliği</p>
        <p>
          Yeni insanlarla tanış, oyunlar ve birlikte üretmek üzerine sohbet et.
        </p>
        <dl>
          <div>
            <dt>Tarih</dt>
            <dd>7 Ekim · Çarşamba</dd>
          </div>
          <div>
            <dt>Saat</dt>
            <dd>18.00–20.30</dd>
          </div>
          <div>
            <dt>Mekân</dt>
            <dd>Nest’o Coffee Roastery</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

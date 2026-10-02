import Link from "next/link";
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-inner">
        <div>
          <strong>ULUDOTT</strong>
          <p>Dijital Oyun Tasarım Topluluğu</p>
        </div>
        <div>
          <Link href="/hakkimizda">Hakkımızda</Link>
          {" · "}
          <Link href="/destek">Destek</Link>
          <p>Oyunlar, fikirler ve birlikte üretmek.</p>
        </div>
      </div>
    </footer>
  );
}

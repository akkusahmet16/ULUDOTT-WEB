import { useState } from "react";

const statusMap = {
  open: "Açık",
  closed: "Kapalı",
};

export function ViolatingFixture({
  active,
  name,
  date,
}: {
  active: boolean;
  name: string;
  date: string;
}) {
  const [message, setMessage] = useState("");
  return (
    <section aria-label="Sabit bölüm etiketi">
      <h2>Doğrudan Türkçe Başlık</h2>
      <p>{active ? "Aktif durum" : "Pasif durum"}</p>
      <p>{`Merhaba ${name} kullanıcısı`}</p>
      <p>{statusMap.open}</p>
      <p>{new Date(date).toLocaleDateString("tr-TR")}</p>
      <input placeholder="Adınızı yazın" />
      <button type="button" onClick={() => setMessage("İşlem tamamlanamadı")}>
        {message}
      </button>
    </section>
  );
}

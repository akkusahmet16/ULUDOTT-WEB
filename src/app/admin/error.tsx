"use client";
export default function Error({ retry }: { retry: () => void }) {
  return (
    <main>
      <h1>Yönetim ekranı açılamadı</h1>
      <p role="alert">İşlem şu anda tamamlanamadı. Lütfen yeniden deneyin.</p>
      <button onClick={() => retry()}>Ekranı yeniden yükle</button>
    </main>
  );
}

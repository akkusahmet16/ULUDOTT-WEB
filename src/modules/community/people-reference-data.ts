const referenceScenes = [
  {
    slug: "baskan-yigit",
    referenceName: "Yiğit",
    color: "#171923",
    photos: [
      "/community/03-hakkimizda/people/baskan-yigit/baskan-yigit-detay.webp",
    ],
    background:
      "/community/03-hakkimizda/people/baskan-yigit/baskan-yigit-detay.webp",
    foreground: null,
    videos: [
      "/community/03-hakkimizda/people/baskan-yigit/baskan-yigit-acilis.mp4",
    ],
  },
  {
    slug: "lucia",
    referenceName: "Lucia Caminos",
    color: "#282338",
    photos: [
      "/theme/reference/people/lucia-caminos-01.avif",
      "/theme/reference/people/lucia-caminos-02.avif",
      "/theme/reference/people/lucia-caminos-03.avif",
      "/theme/reference/people/lucia-caminos-04.avif",
      "/theme/reference/people/lucia-caminos-05.avif",
      "/theme/reference/people/lucia-caminos-06.avif",
    ],
    background: "/theme/reference/people/lucia-caminos-01.avif",
    foreground: null,
    videos: [
      "/theme/reference/people/lucia-intro.mp4",
      "/theme/reference/people/lucia-quote.mp4",
    ],
  },
  {
    slug: "cal",
    referenceName: "Cal Hampton",
    color: "#213949",
    photos: [
      "/theme/reference/people/cal-hampton-01.avif",
      "/theme/reference/people/cal-hampton-02.avif",
      "/theme/reference/people/cal-hampton-03.avif",
      "/theme/reference/people/cal-hampton-04.avif",
    ],
    background: "/theme/reference/people/cal-bg.avif",
    foreground: "/theme/reference/people/cal-fg.avif",
    videos: ["/theme/reference/people/cal.mp4"],
  },
  {
    slug: "boobie",
    referenceName: "Boobie Ike",
    color: "#24354b",
    photos: [
      "/theme/reference/people/boobie-ike-01.avif",
      "/theme/reference/people/boobie-ike-02.avif",
      "/theme/reference/people/boobie-ike-03.avif",
      "/theme/reference/people/boobie-ike-04.avif",
    ],
    background: "/theme/reference/people/boobie-bg.avif",
    foreground: "/theme/reference/people/boobie-fg.avif",
    videos: ["/theme/reference/people/boobie.mp4"],
  },
  {
    slug: "drequan",
    referenceName: "Dre’Quan Priest",
    color: "#382e40",
    photos: [
      "/theme/reference/people/drequan-priest-01.avif",
      "/theme/reference/people/drequan-priest-02.avif",
      "/theme/reference/people/drequan-priest-03.avif",
      "/theme/reference/people/drequan-priest-04.avif",
    ],
    background: "/theme/reference/people/drequan-bg.avif",
    foreground: "/theme/reference/people/drequan-fg.avif",
    videos: ["/theme/reference/people/drequan.mp4"],
  },
  {
    slug: "dimez",
    referenceName: "Real Dimez",
    color: "#49303d",
    photos: [
      "/theme/reference/people/real-dimez-01.avif",
      "/theme/reference/people/real-dimez-02.avif",
      "/theme/reference/people/real-dimez-03.avif",
      "/theme/reference/people/real-dimez-04.avif",
    ],
    background: "/theme/reference/people/dimez-bg.avif",
    foreground: "/theme/reference/people/dimez-fg.avif",
    videos: ["/theme/reference/people/dimez.mp4"],
  },
  {
    slug: "raul",
    referenceName: "Raul Bautista",
    color: "#313929",
    photos: [
      "/theme/reference/people/raul-bautista-01.avif",
      "/theme/reference/people/raul-bautista-02.avif",
      "/theme/reference/people/raul-bautista-03.avif",
      "/theme/reference/people/raul-bautista-04.avif",
    ],
    background: "/theme/reference/people/raul-bg.avif",
    foreground: "/theme/reference/people/raul-fg.avif",
    videos: ["/theme/reference/people/raul.mp4"],
  },
  {
    slug: "brian",
    referenceName: "Brian Heder",
    color: "#31304a",
    photos: [
      "/theme/reference/people/brian-heder-01.avif",
      "/theme/reference/people/brian-heder-02.avif",
      "/theme/reference/people/brian-heder-03.avif",
      "/theme/reference/people/brian-heder-04.avif",
    ],
    background: "/theme/reference/people/brian-bg.avif",
    foreground: "/theme/reference/people/brian-fg.avif",
    videos: ["/theme/reference/people/brian.mp4"],
  },
] as const;

const members = [
  {
    slug: "baskan-yigit",
    name: "Hamza Yiğit Adıgüzel",
    role: "Başkan",
    quote:
      "Uludott'ta en sevdiğim şey, fikirlerin sadece fikir olarak kalmaması.",
    details: ["Bilgisayar Mühendisliği 2.Sınıf"],
  },
  {
    slug: "baskan-yard-batu",
    name: "Batuhan Özdemir",
    role: "Başkan Yardımcısı",
    quote: "Aklımıza gelen şeyi ‘neden olmasın?’ deyip denemeyi seviyoruz.",
    details: ["Bilgisayar Mühendisliği 3.Sınıf", "Uludott Dergi Yazarı"],
    video: "baskan-yard-batu-acilis.mp4",
    photo: "baskan-yard-batu-detay.webp",
  },
  {
    slug: "sosyal-medya-ahmet",
    name: "Ahmet Akkuş",
    role: "Sosyal Medya Deparmanı Başkanı",
    quote:
      "Bir işin gerçekten iyi olması için detaylarla uğraşmaktan kaçınmam.",
    details: ["Bilgisayar ve Öğr. Tek. Eğitimi 2.Sınıf"],
  },
  {
    slug: "cayci-halis",
    name: "Halis Can Sağır",
    role: "Çaycı",
    quote: "Çav yok bok için",
    details: ["Bilgisayar ve Öğr. Tek. Eğitimi 2.Sınıf", "Çaylarrrr"],
    video: "cayci-halis-acilis.mp4",
    photo: "cayci-halis-detay.webp",
  },
  {
    slug: "efe-tutucu",
    name: "Efe Tutucu",
    role: "Yönetim kurulu",
    quote:
      "Burada sadece etkinlik yapmıyoruz, birlikte bir şeyler inşa ediyoruz.",
    details: ["Bilgisayar Mühendisliği 4.Sınıf"],
    video: "efe-tutucu-acilis.mp4",
  },
  {
    slug: "aybey",
    name: "Aybey",
    role: "Yönetim kurulu",
    quote: null,
    details: [],
  },
  {
    slug: "dwayne-jesus-emir",
    name: "Dwayne Jesus Emir",
    role: "Yönetim kurulu",
    quote: null,
    details: [],
  },
  {
    slug: "ex-smd-melek",
    name: "Melek",
    role: "Eski Sosyal Medya Departmanı",
    quote: null,
    details: [],
  },
] as const;
export const peopleReference = members.map((member, index) => {
  const fallback = referenceScenes[index];
  const base = `/community/03-hakkimizda/people/${member.slug}/`;
  const photo = "photo" in member ? base + member.photo : fallback.photos[0];
  const video = "video" in member ? base + member.video : fallback.videos[0];
  return {
    ...fallback,
    ...member,
    referenceName: member.name,
    photos: [photo],
    videos: [video],
    photoReference: index !== 0 && !("photo" in member),
    videoReference: index !== 0 && !("video" in member),
  };
});

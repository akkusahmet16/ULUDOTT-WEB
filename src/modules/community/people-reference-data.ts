export type Member = {
  slug: string;
  name: string;
  role: string;
  details: string[];
  quote?: string;
  photo: string;
  photoReference: boolean;
};
export type Chapter = {
  slug: string;
  title: string;
  role: string;
  color: string;
  video: string;
  videoReference: boolean;
  poster: string;
  members: Member[];
};
const community = "/community/03-hakkimizda/people";
const reference = "/theme/reference/people";
export const peopleChapters: Chapter[] = [
  {
    slug: "baskan-yigit",
    title: "Hamza Yiğit Adıgüzel",
    role: "Başkan",
    color: "#171923",
    video: `${community}/baskan-yigit/baskan-yigit-acilis.mp4`,
    videoReference: false,
    poster: `${community}/baskan-yigit/baskan-yigit-detay.webp`,
    members: [
      {
        slug: "baskan-yigit",
        name: "Hamza Yiğit Adıgüzel",
        role: "Başkan",
        quote:
          "Uludott'ta en sevdiğim şey, fikirlerin sadece fikir olarak kalmaması.",
        details: ["Bilgisayar Mühendisliği 2. Sınıf"],
        photo: `${community}/baskan-yigit/baskan-yigit-detay.webp`,
        photoReference: false,
      },
    ],
  },
  {
    slug: "baskan-yard-batu",
    title: "Batuhan Özdemir",
    role: "Başkan Yardımcısı",
    color: "#282338",
    video: `${community}/baskan-yard-batu/baskan-yard-batu-acilis.mp4`,
    videoReference: false,
    poster: `${community}/baskan-yard-batu/baskan-yard-batu-detay.webp`,
    members: [
      {
        slug: "baskan-yard-batu",
        name: "Batuhan Özdemir",
        role: "Başkan Yardımcısı",
        quote: "Aklımıza gelen şeyi ‘neden olmasın?’ deyip denemeyi seviyoruz.",
        details: ["Bilgisayar Mühendisliği 3. Sınıf", "Uludott Dergi Yazarı"],
        photo: `${community}/baskan-yard-batu/baskan-yard-batu-detay.webp`,
        photoReference: false,
      },
    ],
  },
  {
    slug: "sosyal-medya-ekip",
    title: "Sosyal Medya Ekibi",
    role: "Sosyal medya",
    color: "#213949",
    video: `${reference}/cal.mp4`,
    videoReference: true,
    poster: `${reference}/cal-hampton-01.avif`,
    members: [
      {
        slug: "sosyal-medya-ahmet",
        name: "Ahmet Akkuş",
        role: "Sosyal Medya Departmanı Başkanı",
        quote:
          "Bir işin gerçekten iyi olması için detaylarla uğraşmaktan kaçınmam.",
        details: ["Bilgisayar ve Öğretim Teknolojileri Eğitimi 2. Sınıf"],
        photo: `${reference}/cal-hampton-01.avif`,
        photoReference: true,
      },
      {
        slug: "ex-smd-melek",
        name: "Melek",
        role: "Sosyal Medya Ekibi",
        details: [],
        photo: `${reference}/brian-heder-01.avif`,
        photoReference: true,
      },
      {
        slug: "dwayne-jesus-emir",
        name: "Emir",
        role: "Sosyal Medya Ekibi",
        details: [],
        photo: `${reference}/raul-bautista-01.avif`,
        photoReference: true,
      },
    ],
  },
  {
    slug: "etkinlik-ekip",
    title: "Etkinlik Ekibi",
    role: "Etkinlikler",
    color: "#382e40",
    video: `${reference}/drequan.mp4`,
    videoReference: true,
    poster: `${reference}/drequan-priest-01.avif`,
    members: [
      {
        slug: "efe-tutucu",
        name: "Efe Tutucu",
        role: "Etkinlik Ekibi",
        quote:
          "Burada sadece etkinlik yapmıyoruz, birlikte bir şeyler inşa ediyoruz.",
        details: ["Bilgisayar Mühendisliği 4. Sınıf"],
        photo: `${reference}/drequan-priest-01.avif`,
        photoReference: true,
      },
      {
        slug: "aybey",
        name: "Aybey",
        role: "Etkinlik Ekibi",
        details: [],
        photo: `${reference}/real-dimez-01.avif`,
        photoReference: true,
      },
    ],
  },
  {
    slug: "cayci-halis",
    title: "Halis Can Sağır",
    role: "Çaycı",
    color: "#313929",
    video: `${community}/cayci-halis/cayci-halis-acilis.mp4`,
    videoReference: false,
    poster: `${community}/cayci-halis/cayci-halis-detay.webp`,
    members: [
      {
        slug: "cayci-halis",
        name: "Halis Can Sağır",
        role: "Çaycı",
        quote: "Çav yok bok için",
        details: [
          "Bilgisayar ve Öğretim Teknolojileri Eğitimi 2. Sınıf",
          "Çaylarrrr",
        ],
        photo: `${community}/cayci-halis/cayci-halis-detay.webp`,
        photoReference: false,
      },
    ],
  },
];

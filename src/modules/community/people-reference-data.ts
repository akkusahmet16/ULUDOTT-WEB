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
  videoVisible?: boolean;
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
    title: "Sosyal Medya",
    role: "Sosyal Medya Departmanı",
    color: "#213949",
    video: `${reference}/cal.mp4`,
    videoVisible: false,
    videoReference: true,
    poster: `${community}/sosyal-medya-ekip/smd-baskan-ahmet.webp`,
    members: [
      {
        slug: "sosyal-medya-ahmet",
        name: "Ahmet Akkuş",
        role: "Sosyal Medya Departmanı Başkanı",
        quote:
          "Bir işin gerçekten iyi olması için detaylarla uğraşmaktan kaçınmam.",
        details: ["Bilgisayar ve Öğretim Teknolojileri Eğitimi 2. Sınıf"],
        photo: `${community}/sosyal-medya-ekip/smd-baskan-ahmet.webp`,
        photoReference: false,
      },
      {
        slug: "dwayne-jesus-emir",
        name: "Emir",
        role: "Sosyal Medya Ekibi",
        details: [],
        photo: `${community}/sosyal-medya-ekip/smd-ekip-emir.webp`,
        photoReference: false,
      },
      {
        slug: "ex-smd-melek",
        name: "Melek",
        role: "Sosyal Medya Ekibi",
        details: [],
        photo: `${community}/sosyal-medya-ekip/smd-ekip-melek.webp`,
        photoReference: false,
      },
    ],
  },
  {
    slug: "etkinlik-ekip",
    title: "Halis Can Sağır",
    role: "Etkinlik Departmanı Başkanı",
    color: "#382e40",
    video: `${community}/etkinlik-ekip/ed-baskan/ed-baskan-halis-acilis.mp4`,
    videoReference: false,
    poster: `${community}/etkinlik-ekip/ed-baskan/ed-baskan-halis-detay.webp`,
    members: [
      {
        slug: "etkinlik-baskani-halis",
        name: "Halis Can Sağır",
        role: "Etkinlik Departmanı Başkanı",
        quote: "Eski Çaycı",
        details: [
          "Bilgisayar ve Öğretim Teknolojileri Eğitimi 2. Sınıf",
          "Çaylarrrr",
        ],
        photo: `${community}/etkinlik-ekip/ed-baskan/ed-baskan-halis-detay.webp`,
        photoReference: false,
      },
      {
        slug: "efe-tutucu",
        name: "Efe Tutucu",
        role: "Etkinlik Ekibi",
        quote:
          "Burada sadece etkinlik yapmıyoruz, birlikte bir şeyler inşa ediyoruz.",
        details: ["Bilgisayar Mühendisliği 4. Sınıf"],
        photo: `${community}/etkinlik-ekip/etkinlik-ekip-efe-tutucu.webp`,
        photoReference: false,
      },
      {
        slug: "aybey",
        name: "Aybey",
        role: "Etkinlik Ekibi",
        details: [],
        photo: `${community}/etkinlik-ekip/etkinlik-ekip-aybey-detay.webp`,
        photoReference: false,
      },
      {
        slug: "fatih-soyer",
        name: "Fatih Soyer",
        role: "Etkinlik Ekibi",
        details: [],
        photo: `${community}/etkinlik-ekip/etkinlik-ekip-fatih-soyer.webp`,
        photoReference: false,
      },
      {
        slug: "eren-bozaci",
        name: "Eren Bozacı",
        role: "Etkinlik Ekibi",
        details: [],
        photo: `${community}/etkinlik-ekip/etkinlik-ekip-eren-bozaci.webp`,
        photoReference: false,
      },
    ],
  },
  {
    slug: "cayci-2ce",
    title: "Tuğçe",
    role: "Çaycı",
    color: "#313929",
    video: "",
    videoReference: false,
    poster: "",
    members: [
      {
        slug: "cayci-2ce",
        name: "Tuğçe",
        role: "Çaycı",
        quote: "Çaylak çaycı.",
        details: ["BÖTE 2. sınıf"],
        photo: "",
        photoReference: false,
      },
    ],
  },
];

export interface CompanyImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export const company = {
  name: "PT Wish Care Fast",
  shortName: "WCF",
  business: "Jasa Pelayanan (Outsourcing)",
  founded: "2022",
  description:
    "PT Wish Care Fast menyediakan tenaga kerja outsourcing profesional untuk mendukung operasional perusahaan yang efisien dan andal, dengan mengutamakan kecepatan, keandalan, dan kepuasan pelanggan.",
  address: "JL. Raya Sekarpuro 85, Kec. Pakis, Kab. Malang",
  email: "ptwishcarefast@gmail.com",
  phones: [
    { label: "0813-3394-9063", href: "tel:+6281333949063" },
    { label: "0856-0848-2075", href: "tel:+6285608482075" },
    { label: "0857-5510-3445", href: "tel:+6285755103445" },
  ],
  whatsapp: "https://wa.me/6281333949063",
};

// Company Profile PT WISH CARE FAST.pdf, pages 1, 3, 7, and 8.
export const brandLogo: CompanyImage = {
  src: "/logo/wcf.webp",
  alt: "Logo PT Wish Care Fast",
  width: 199,
  height: 224,
};
export const visionMission: {
  vision: string;
  missions: [string, string, string, string];
} = {
  vision:
    "Menjadikan PT Wish Care Fast sebagai perusahaan yang mampu memberikan nilai tambah bagi mitra usaha, dengan menerapkan konsep pelayanan cepat serta memastikan kepuasan pelanggan terhadap layanan yang kami berikan.",
  missions: [
    "Menempatkan kepuasan pelanggan sebagai prioritas utama dalam setiap layanan yang kami berikan.",
    "Memberdayakan sumber daya manusia (karyawan) melalui program sertifikasi dan sistem pelatihan terpadu.",
    "Menciptakan lapangan pekerjaan yang berkelanjutan bagi masyarakat.",
    "Berkontribusi terhadap pelestarian lingkungan hidup dengan menerapkan praktik kerja yang ramah lingkungan.",
  ],
};
// Only logos visibly included on page 7; unused PDF image resources are excluded.
export const clients: CompanyImage[] = [
  { src: "/images/clients/inez.webp", alt: "Inez", width: 192, height: 192 },
  {
    src: "/images/clients/smk-nmc.webp",
    alt: "SMK NMC",
    width: 79,
    height: 107,
  },
  {
    src: "/images/clients/malang-eye-center.webp",
    alt: "Malang Eye Center",
    width: 158,
    height: 86,
  },
  {
    src: "/images/clients/universitas-brawijaya.webp",
    alt: "Universitas Brawijaya",
    width: 211,
    height: 200,
  },
  {
    src: "/images/clients/bnn.webp",
    alt: "Badan Narkotika Nasional",
    width: 266,
    height: 266,
  },
  {
    src: "/images/clients/pengadilan-negeri-malang.webp",
    alt: "Pengadilan Negeri Malang",
    width: 239,
    height: 239,
  },
  {
    src: "/images/clients/satpol-pp-kota-malang.webp",
    alt: "Satuan Polisi Pamong Praja Kota Malang",
    width: 500,
    height: 200,
  },
];
export const gallery: CompanyImage[] = [
  {
    src: "/images/gallery/pembersihan-kaca.webp",
    alt: "Petugas WCF membersihkan kaca ruang kerja",
    width: 360,
    height: 361,
  },
  {
    src: "/images/gallery/perawatan-lantai.webp",
    alt: "Petugas WCF melakukan perawatan lantai",
    width: 360,
    height: 361,
  },
  {
    src: "/images/gallery/koordinasi-petugas.webp",
    alt: "Koordinasi bersama petugas berseragam",
    width: 514,
    height: 513,
  },
  {
    src: "/images/gallery/pengarahan-tim.webp",
    alt: "Pengarahan tim petugas di area kerja",
    width: 513,
    height: 514,
  },
  {
    src: "/images/gallery/kebersihan-area.webp",
    alt: "Petugas membersihkan bagian atas kaca di area pelayanan",
    width: 312,
    height: 313,
  },
];

export const navigation = [
  { href: "#beranda", label: "Beranda" },
  { href: "#tentang", label: "Tentang Kami" },
  ...(visionMission ? [{ href: "#visi-misi", label: "Visi & Misi" }] : []),
  { href: "#layanan", label: "Layanan" },
  { href: "#keunggulan", label: "Keunggulan" },
  { href: "#legalitas", label: "Legalitas" },
  ...(clients.length ? [{ href: "#klien", label: "Klien" }] : []),
  ...(gallery.length ? [{ href: "#dokumentasi", label: "Dokumentasi" }] : []),
  { href: "#kontak", label: "Kontak" },
];

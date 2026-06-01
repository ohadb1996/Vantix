export type PartnerBrand = {
  name: string
  category: string
  flagship?: boolean
  accent?: string
  logo?: string // URL or path to logo image
}

export const partnerBrands: PartnerBrand[] = [
  { name: 'Oshi Oshi', category: 'סושי', flagship: true, accent: 'from-[#24c6dc] to-[#2431dc]' },
  { name: 'Golda', category: 'גלידריה', accent: 'from-[#ffd86f] to-[#fc6262]' },
  { name: 'Burgeranch', category: 'המבורגר', accent: 'from-[#f83600] to-[#f9d423]' },
  { name: 'Café Greg', category: 'קפה', accent: 'from-[#b06ab3] to-[#4568dc]' },
  { name: 'Vitrina', category: 'שף רחוב', flagship: true, accent: 'from-[#ff9966] to-[#ff5e62]' },
  { name: 'Taizu Express', category: 'אסייתי', accent: 'from-[#7f00ff] to-[#e100ff]' },
  { name: 'Cafe Landwer', category: 'קפה', accent: 'from-[#56ab2f] to-[#a8e063]' },
  { name: 'Hakosem', category: 'מזרחי', accent: 'from-[#f7971e] to-[#ffd200]' },
  { name: 'Pasta Basta', category: 'איטלקי', accent: 'from-[#ff512f] to-[#dd2476]' },
  { name: 'Sabich Tchernichovsky', category: 'שיק', accent: 'from-[#6a11cb] to-[#2575fc]' },
  { name: 'Hudson Brasserie', category: 'בשרים', flagship: true, accent: 'from-[#ff5f6d] to-[#ffc371]' },
  { name: 'Claro', category: 'שף', accent: 'from-[#00c6ff] to-[#0072ff]' },
  { name: 'Malabi Dizingoff', category: 'קינוחים', accent: 'from-[#f953c6] to-[#b91d73]' },
  { name: 'Cafe Xoho', category: 'בייקרי', accent: 'from-[#4facfe] to-[#00f2fe]' },
  { name: 'Rachel Basdera', category: 'קונדיטוריה', accent: 'from-[#fbd786] to-[#f7797d]' },
  { name: 'Tony Vespa', category: 'פיצה', accent: 'from-[#1e3c72] to-[#2a5298]' },
  { name: 'Falafel Gabay', category: 'מקומי', accent: 'from-[#56ccf2] to-[#2f80ed]' },
  { name: 'Nithan Thai', category: 'תאי', flagship: true, accent: 'from-[#da22ff] to-[#9733ee]' },
  { name: 'Hatraklin', category: 'יין ובשר', accent: 'from-[#ff4b1f] to-[#1fddff]' },
  { name: 'Delicatessen TLV', category: 'דלי', accent: 'from-[#fc5c7d] to-[#6a82fb]' },
  { name: 'Otello Gelato', category: 'קינוחים', accent: 'from-[#00b09b] to-[#96c93d]' },
  { name: 'Benedict', category: 'בראנץ׳', flagship: true, accent: 'from-[#f05f57] to-[#360940]' },
  { name: 'Miznon', category: 'שף רחוב', accent: 'from-[#f12711] to-[#f5af19]' },
  { name: 'Suspected', category: 'קוקטיילים', accent: 'from-[#41295a] to-[#2f0743]' },
  { name: 'Cafe Noir', category: 'ביסטרו', accent: 'from-[#6a3093] to-[#a044ff]' },
  { name: 'Pastel', category: 'Fine Dining', accent: 'from-[#00c9ff] to-[#92fe9d]' },
  { name: "Eli's Kitchen", category: 'מטבח ביתי', accent: 'from-[#f9d423] to-[#ff4e50]' },
  { name: 'Tiger Lilly', category: 'אסייתי', accent: 'from-[#f4c4f3] to-[#fc67fa]' },
  { name: 'Green Roll', category: 'בריא וטבעוני', accent: 'from-[#11998e] to-[#38ef7d]' },
  { name: 'Papa Jones', category: 'פיצה', accent: 'from-[#ffecd2] to-[#fcb69f]' },
]


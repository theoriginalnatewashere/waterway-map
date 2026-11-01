export type LandingLanguage = "th" | "en";

export const content = {
  th: {
    nav: ["คืออะไร", "ทำไม", "วิธีใช้งาน", "ติดตั้ง"],
    kicker: "แผนที่ตู้น้ำดื่ม RO ที่ชุมชนช่วยกันสร้าง",
    title: "หาตู้น้ำดื่ม แบ่งปันข้อมูลกัน",
    body: "ค้นหาตู้น้ำดื่มระบบรีเวิร์สออสโมซิส (RO) ใกล้ตัว ดูค่า TDS และ pH ที่ผู้ใช้งานรายงาน และช่วยกันอัปเดตข้อมูลให้คนในพื้นที่",
    open: "เปิดแผนที่",
    installLink: "วิธีติดตั้ง",
    note: "ใช้งานฟรี ข้อมูลจากชุมชน ไม่ต้องผ่านร้านค้าแอป",
    what: "ค้นหาจุดเติมน้ำได้ง่ายขึ้น",
    whatBody: "H2O Map คือแผนที่ตู้น้ำดื่มระบบ RO ที่ผู้ใช้ช่วยกันเพิ่มและอัปเดตข้อมูล ค้นหาตู้น้ำใกล้ตัว ดูค่าที่รายงาน สถานะการใช้งาน รูปภาพ และวันที่รายงานล่าสุด",
    why: "มีประโยชน์กับใครบ้าง",
    cards: [
      ["คนที่เติมน้ำดื่มเป็นประจำ", "หาตู้ใกล้ตัวและตรวจสอบข้อมูลก่อนเดินทาง"],
      ["คนในชุมชน", "ช่วยกันรวบรวมตำแหน่งและรายงานสถานะ"],
      ["ผู้ที่ต้องการแบ่งปันข้อมูล", "รายงานค่า TDS, pH และข้อสังเกต"],
    ],
    how: "ค้นหา ตรวจสอบ และร่วมรายงาน",
    steps: [
      ["ค้นหาตู้น้ำบนแผนที่", "เปิดแผนที่เพื่อค้นหาจุดเติมน้ำในพื้นที่ที่คุณสนใจ"],
      ["ตรวจสอบข้อมูลที่รายงาน", "ดูค่า TDS, pH สถานะ และวันที่รายงานก่อนตัดสินใจ"],
      ["เพิ่มรายงานของคุณ", "เข้าสู่ระบบเพื่อแบ่งปันค่าที่วัดได้ รูปภาพ และข้อสังเกต"],
    ],
    install: "เพิ่ม H2O Map ไว้บนหน้าจอหลัก",
    installBody: "H2O Map เป็นเว็บแอป (PWA) เปิดใช้งานได้สะดวกโดยไม่ต้องดาวน์โหลดจากร้านค้าแอป",
    iphone: ["เปิดเว็บใน Safari", "แตะ แชร์ (Share) และ เพิ่มไปยังหน้าจอโฮม (Add to Home Screen)", "เปิด Open as Web App หากมี แล้วแตะ เพิ่ม"],
    android: ["เปิดเว็บใน Chrome", "แตะเมนูสามจุด", "เลือก ติดตั้งแอป (Install app) หรือ เพิ่มไปยังหน้าจอหลัก แล้วกดยืนยัน"],
    safety: "ค่า TDS และ pH ใช้คัดกรองเบื้องต้นเท่านั้น ไม่สามารถยืนยันว่าน้ำปลอดภัยต่อการดื่ม หรือตรวจหาแบคทีเรีย ไวรัส โลหะหนัก และสารปนเปื้อนอื่น ๆ ได้ ชื่อตู้น้ำใช้เพื่อระบุตำแหน่ง ไม่จำเป็นต้องเกี่ยวข้องกับธุรกิจหรือสถานที่นั้น",
    screenshot: "ภาพหน้าจอจริงจากแอป · ยังไม่มีข้อมูลตู้น้ำ",
    illustration: "ตัวอย่างหน้าจอ · ไม่ใช่ค่าที่รายงานจริง",
    mapAlt: "หน้าจอแผนที่ H2O Map โดยไม่มีตำแหน่งตู้น้ำที่รายงาน",
    listAlt: "หน้ารายการตู้น้ำ H2O Map ที่ยังไม่มีข้อมูล",
    report: "รายงานคุณภาพน้ำ",
    noTds: "ยังไม่มีค่า TDS ที่รายงาน",
    notes: "ข้อสังเกต",
    photo: "รูปภาพ",
  },
  en: {
    nav: ["What", "Why", "How", "Install"],
    kicker: "A community-powered water map",
    title: "Find your next water refill spot.",
    body: "Find nearby reverse osmosis (RO) water dispensers, review community-reported TDS and pH readings, and share your own observations.",
    open: "Open H2O Map",
    installLink: "Install on your phone",
    note: "Free to use. Community-driven. No app store required.",
    what: "A map built around better refill decisions.",
    whatBody: "Explore community-added RO dispensers, view reported TDS and pH measurements, photos, working status, and the date of the latest report.",
    why: "Useful for everyone who refills.",
    cards: [
      ["Everyday refill users", "Find nearby machines and review reports"],
      ["Local communities", "Share locations and machine status"],
      ["Community contributors", "Add TDS/pH readings and observations"],
    ],
    how: "Three simple steps.",
    steps: [
      ["Find a dispenser", "Explore the map to find refill spots in your area."],
      ["Check the reports", "Review TDS, pH, working status, and report dates before you go."],
      ["Share what you find", "Sign in to add your measurements, photos, and observations."],
    ],
    install: "Keep H2O Map on your phone.",
    installBody: "H2O Map is a progressive web app (PWA). Add it to your home screen without downloading from an app store.",
    iphone: ["Open the website in Safari", "Tap Share, then Add to Home Screen", "Enable Open as Web App (if shown), then tap Add"],
    android: ["Open the website in Chrome", "Tap the three-dot menu", "Choose Install app or Add to Home screen, then confirm"],
    safety: "Community TDS and pH readings are for screening only; they cannot confirm drinking-water safety or detect bacteria, viruses, heavy metals or other contaminants. Dispenser names are for identification and may not be associated with the business or location.",
    screenshot: "Actual app screenshots · No dispenser records yet",
    illustration: "Illustrative screen · No real readings",
    mapAlt: "H2O Map's actual map screen with no reported dispenser locations",
    listAlt: "H2O Map's actual empty dispenser list",
    report: "Report water quality",
    noTds: "No TDS reading reported yet",
    notes: "Observations",
    photo: "Photos",
  },
} as const;

export function landingHead(language: LandingLanguage) {
  const c = content[language];
  const title = language === "th" ? "H2O Map — แผนที่ตู้น้ำดื่ม RO จากชุมชน" : "H2O Map — Community RO water dispenser map";
  const path = language === "th" ? "/" : "/en";
  return {
    meta: [
      { title },
      { name: "description", content: c.body },
      { property: "og:title", content: title },
      { property: "og:description", content: c.body },
      { property: "og:type", content: "website" },
      { property: "og:url", content: path },
      { property: "og:locale", content: language === "th" ? "th_TH" : "en_US" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: c.body },
    ],
    links: [
      { rel: "canonical", href: path },
      { rel: "alternate", hrefLang: "th", href: "/" },
      { rel: "alternate", hrefLang: "en", href: "/en" },
    ],
  };
}
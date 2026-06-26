export type AppItem = {
  id: string;
  initial: string;
  title: string;
  description: string;
  /** URL extern; momentan toate duc către example.com */
  externalHref: string;
};

const BASE_URL = "https://example.com";

/** Toate aplicațiile cunoscute (fără duplicate). */
export const ALL_APPS: AppItem[] = [
  { id: "co", initial: "CO", title: "CMS ONedu", description: "Gestionează blog-urile, produsele și evenimentele la nivelul organizației. Publică și editează conținut centralizat.", externalHref: BASE_URL },
  { id: "b", initial: "B", title: "Bănuț", description: "Economii și buget personal. Urmărește veniturile și cheltuielile, planifică și economisește pentru obiective.", externalHref: BASE_URL },
  { id: "g", initial: "G", title: "Grantify", description: "Granturi și finanțare pentru proiecte. Află despre programe, cereri și gestionare fonduri pentru organizații.", externalHref: BASE_URL },
  { id: "h", initial: "H", title: "HRinfo", description: "Resurse umane și administrare personal. Concedii, pontaj, documente și noutăți pentru angajați.", externalHref: BASE_URL },
  { id: "p", initial: "P", title: "Procedurescu", description: "Află noutățile și informațiile despre proceduri interne. Ghiduri și documentație la un click distanță.", externalHref: BASE_URL },
  { id: "fo", initial: "FO", title: "Flux ONedu", description: "Gestionează documentele și fluxurile de aprobare. Încarcă, semnează și urmărește dosarele în timp real.", externalHref: BASE_URL },
  { id: "bo", initial: "BO", title: "Brand ONedu", description: "Gestionează brand-ul și materialele de comunicare. Logo-uri, șabloane și resurse pentru consistență vizuală.", externalHref: BASE_URL },
  { id: "htr", initial: "HTR", title: "How to: România", description: "Vezi rolul instituțiilor publice și cum funcționează. Resurse educaționale despre cetățenie și administrație.", externalHref: BASE_URL },
  { id: "po", initial: "PO", title: "Platforma ONedu", description: "Acces la platformă și toate instrumentele ONedu. Portal unitar pentru membri și parteneri.", externalHref: BASE_URL },
  { id: "pi", initial: "PI", title: "Platforma iVoluntar", description: "Voluntariat și proiecte sociale. Înscrie-te la acțiuni, urmărește orele și impactul tău.", externalHref: BASE_URL },
  { id: "gv", initial: "GV", title: "Gala Voluntariatului", description: "Evenimente și premii pentru voluntari. Calendar, înscrieri și noutăți despre gala anuală.", externalHref: BASE_URL },
  { id: "tis", initial: "TIS", title: "TEDxAvram Iancu Street", description: "Idei care merită răspândite. Talk-uri, evenimente și comunitate TEDx în România.", externalHref: BASE_URL },
  { id: "ia", initial: "IA", title: "iVoluntar App", description: "Aplicația de voluntariat în buzunar. Verifică programul și orele de pe telefon, oriunde ești.", externalHref: BASE_URL },
  { id: "e", initial: "E", title: "EVA", description: "Educație și resurse pentru elevi și profesori. Lecții, materiale și instrumente pentru învățare.", externalHref: BASE_URL },
  { id: "s", initial: "S", title: "StudFund", description: "Fonduri pentru studenți și burse. Informații despre programe de finanțare și cereri de granturi.", externalHref: BASE_URL },
  { id: "ad", initial: "A", title: "adolescentin.ro", description: "Resurse pentru adolescenți și educatori. Sănătate, relații și dezvoltare personală.", externalHref: BASE_URL },
  { id: "am", initial: "A", title: "AmExamen", description: "Pregătire pentru examene și evaluări. Teste, rezumate și sfaturi pentru rezultate mai bune.", externalHref: BASE_URL },
  { id: "m", initial: "M", title: "Mara", description: "Instrumente educaționale și resurse pentru predare. Planuri de lecții și activități interactive.", externalHref: BASE_URL },
];

/** ID-urile aplicațiilor afișate în secțiunea „Aplicații Favorite”. Acestea nu apar în „Toate Aplicațiile”. */
export const FAVORITE_APP_IDS = ["co", "b", "g", "h", "p", "fo", "bo", "htr"];

export const FAVORITE_APPS = ALL_APPS.filter((app) => FAVORITE_APP_IDS.includes(app.id));

export const NON_FAVORITE_APPS = ALL_APPS.filter((app) => !FAVORITE_APP_IDS.includes(app.id));

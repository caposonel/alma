/**
 * Static fallback lyrics for the /lyrics/[slug] route.
 *
 * Used when the admin store doesn't yet have track data with matching slugs.
 * These are NOT copies of the real Alma Gov songs — they are original
 * placeholder verses in her thematic voice (love, longing, searching, the
 * in-between moments) written so the page renders with real-looking content
 * during development. Replace once tracks/lyrics are managed via the admin
 * panel.
 */

export interface StaticLyric {
  slug: string;
  titleHe: string;
  releaseTitle: string;
  releaseDate: string;
  spotifyTrackId?: string;
  lyricsHe: string;
}

export const STATIC_LYRICS: StaticLyric[] = [
  {
    slug: "shir-varod",
    titleHe: "שיר ורוד",
    releaseTitle: "עולם שלי",
    releaseDate: "2024-07-17",
    spotifyTrackId: "06rEa14xVbsmU6xrUDM5jR",
    lyricsHe: `שיר ורוד על השפתיים
מילים שנכתבו בלילה
כשהעולם ישן ושקט
ואני לבד עם הפסנתר

יש לי חלון שמסתכל החוצה
ושם פעם הסתכלת בי
עכשיו יש רק רחוב ריק
ושיר ורוד שנשאר

אני לוקחת את הצבעים
ומציירת לך מכתב
שאני אולי אשלח
ואולי אשמור אצלי בכיס`,
  },
  {
    slug: "ma-laasot-im-hazeev",
    titleHe: "מה לעשות עם הזאב",
    releaseTitle: "איך האהבה הזאת חומקת בין האצבעות",
    releaseDate: "2023-05-12",
    lyricsHe: `יש לי זאב בתוך הבית
הוא ישן ליד הדלת
ואני לא יודעת מה לעשות איתו
כשהוא קם בלילה ושואל

הוא רוצה לדעת אם אני אוהבת
הוא רוצה לדעת אם נשארתי
אני נותנת לו מים מהכוס שלי
ומקווה שירדם עד הבוקר

מה לעשות עם הזאב
שגדל ביחד איתי
הוא יודע את כל השירים
ואת כל הפחדים`,
  },
  {
    slug: "bsibub",
    titleHe: "בסיבוב",
    releaseTitle: "מאוחר מידי",
    releaseDate: "2021-11-12",
    lyricsHe: `בסיבוב הזה של תל אביב
כל הפנסים נראים אותו דבר
ואני מחפשת בית בלי כתובת
ושם בלי תמונה

כולם אומרים שתתרגלי
כולם אומרים שיהיה בסדר
אבל אני עוד שומעת את האמא
קוראת לי בקול דק מהמרחק

בסיבוב הזה
לא יודעת אם אני באה או הולכת
רק יודעת שאני זזה
ושהירח אותו ירח כמו בבית`,
  },
];

export function getStaticLyricBySlug(slug: string): StaticLyric | null {
  return STATIC_LYRICS.find((l) => l.slug === slug) ?? null;
}

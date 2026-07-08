/** Link wa.me para WhatsApp brasileiro (55 + DDD + número). */
export function whatsappWaMeUrl(phone: string | null | undefined): string | null {
  if (!phone?.trim()) return null;
  let digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (!digits.startsWith("55") && digits.length <= 11) digits = `55${digits}`;
  return `https://wa.me/${digits}`;
}

export function formatWhatsAppDisplay(phone: string | null | undefined): string {
  if (!phone?.trim()) return "—";
  return phone.trim();
}

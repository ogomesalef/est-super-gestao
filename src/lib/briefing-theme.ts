export type BriefingTheme = {
  accent: string;
  accentBorder: string;
  accentBorderStrong: string;
  accentBg: string;
  accentBgSoft: string;
  accentBgMuted: string;
  badgeBorder: string;
  badgeBg: string;
  badgeText: string;
  quoteBorder: string;
  quoteBg: string;
  sectionTitleBorder: string;
  headerGradient: string;
  headerAccent: string;
  headerMuted: string;
  openBadge: string;
  openBorder: string;
  openHeaderBg: string;
  openIcon: string;
  openStatusBadge: string;
  btnPrimary: string;
  btnPrimaryHover: string;
  avatarFallback: string;
  linkHover: string;
  numberedBg: string;
  numberedText: string;
  chevronAccent: string;
  iconAccent: string;
  screenImageBorder: string;
  screenImageBg: string;
  refLinkHover: string;
  refLinkIcon: string;
  refLinkTitleHover: string;
  ctaHighlight: string;
  entregaBadge: string;
  entregaBadgeNum: string;
  importantBox: string;
  fechamentoBox: string;
  pillBorder: string;
  pillBg: string;
  pillText: string;
  dot: string;
};

const ECJ_THEME: BriefingTheme = {
  accent: "text-ecj",
  accentBorder: "border-amber-200",
  accentBorderStrong: "border-amber-200",
  accentBg: "bg-amber-50",
  accentBgSoft: "bg-amber-50/50",
  accentBgMuted: "bg-amber-50/40",
  badgeBorder: "border-amber-200",
  badgeBg: "bg-amber-50",
  badgeText: "text-amber-950",
  quoteBorder: "border-ecj",
  quoteBg: "bg-amber-50/90",
  sectionTitleBorder: "border-amber-200/80",
  headerGradient: "bg-gradient-to-r from-[#1a1208] to-[#2d1f0a]",
  headerAccent: "text-[#E6B23E]",
  headerMuted: "text-[#a7a49b]",
  openBadge: "bg-amber-500",
  openBorder: "border-amber-200",
  openHeaderBg: "bg-amber-50 hover:bg-amber-100/80",
  openIcon: "text-amber-700",
  openStatusBadge: "bg-amber-600",
  btnPrimary: "bg-[#D08C00]",
  btnPrimaryHover: "hover:bg-[#b87800]",
  avatarFallback: "from-amber-100 to-amber-200 text-amber-900",
  linkHover: "hover:text-ecj",
  numberedBg: "bg-amber-100",
  numberedText: "text-amber-900",
  chevronAccent: "text-[#E6B23E]/80",
  iconAccent: "text-ecj",
  screenImageBorder: "border-amber-200",
  screenImageBg: "bg-amber-50/40",
  refLinkHover: "hover:border-amber-200 hover:bg-amber-50/40",
  refLinkIcon: "text-ecj",
  refLinkTitleHover: "group-hover:text-ecj",
  ctaHighlight: "text-ecj",
  entregaBadge: "border-amber-200 bg-amber-50 text-amber-950",
  entregaBadgeNum: "bg-[#D08C00]",
  importantBox: "border-amber-200 bg-amber-50/50",
  fechamentoBox: "border-amber-200 bg-amber-50 text-amber-950",
  pillBorder: "border-amber-200",
  pillBg: "bg-amber-50",
  pillText: "text-amber-900",
  dot: "bg-ecj",
};

const OAB_THEME: BriefingTheme = {
  accent: "text-oab",
  accentBorder: "border-oab/25",
  accentBorderStrong: "border-oab/40",
  accentBg: "bg-oab-light",
  accentBgSoft: "bg-oab-light/50",
  accentBgMuted: "bg-oab-light/40",
  badgeBorder: "border-oab/30",
  badgeBg: "bg-oab-light",
  badgeText: "text-oab",
  quoteBorder: "border-oab",
  quoteBg: "bg-oab-light/90",
  sectionTitleBorder: "border-oab/30",
  headerGradient: "bg-gradient-to-r from-[#3a0808] to-[#6B0A09]",
  headerAccent: "text-[#f5d0cf]",
  headerMuted: "text-[#c9a0a0]",
  openBadge: "bg-oab",
  openBorder: "border-oab/30",
  openHeaderBg: "bg-oab-light hover:bg-oab-light/80",
  openIcon: "text-oab",
  openStatusBadge: "bg-oab",
  btnPrimary: "bg-oab",
  btnPrimaryHover: "hover:bg-oab/90",
  avatarFallback: "from-oab-light to-oab-muted text-oab",
  linkHover: "hover:text-oab",
  numberedBg: "bg-oab-light",
  numberedText: "text-oab",
  chevronAccent: "text-[#f5d0cf]/80",
  iconAccent: "text-oab",
  screenImageBorder: "border-oab/30",
  screenImageBg: "bg-oab-light/40",
  refLinkHover: "hover:border-oab/30 hover:bg-oab-light/40",
  refLinkIcon: "text-oab",
  refLinkTitleHover: "group-hover:text-oab",
  ctaHighlight: "text-oab",
  entregaBadge: "border-oab/30 bg-oab-light text-oab",
  entregaBadgeNum: "bg-oab",
  importantBox: "border-oab/30 bg-oab-light/50",
  fechamentoBox: "border-oab/30 bg-oab-light text-oab",
  pillBorder: "border-oab/30",
  pillBg: "bg-oab-light",
  pillText: "text-oab",
  dot: "bg-oab",
};

export function getBriefingTheme(program: string | null | undefined): BriefingTheme {
  return program === "OAB" ? OAB_THEME : ECJ_THEME;
}

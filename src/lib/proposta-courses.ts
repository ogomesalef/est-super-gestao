export type PropostaCourse = {
  id: string;
  program: "OAB" | "ECJ";
  name: string;
  url?: string;
  value: number;
  description?: string;
  careerUrl?: string;
  isDefault?: boolean;
  updatedAt?: string;
};

export const PROPOSTA_COURSES_SETTING_KEY = "proposta:courses:v1";

export const BUILTIN_DEFAULT_COURSES: PropostaCourse[] = [
  {
    id: "builtin-oab-ate-aprovacao",
    program: "OAB",
    name: "Assinatura OAB Até a Aprovação",
    url: "https://oab.estrategia.com/curso/assinatura-oab/",
    value: 2398.8,
    isDefault: true,
  },
  {
    id: "builtin-ecj-magistratura",
    program: "ECJ",
    name: "Assinatura Magistratura",
    url: "https://cj.estrategia.com/curso/assinatura-magistratura-anual/",
    value: 3898.8,
    careerUrl: "https://cj.estrategia.com/concurso/cursos-para-magistratura",
    description:
      "Abrange todas as provas do ENAM, os 26 Tribunais de Justiça, TRFs e Magistratura do Trabalho, enquanto estiver ativa na parceria.",
    isDefault: true,
  },
];

export function defaultCourseForProgram(program: string): PropostaCourse {
  const key = program === "ECJ" ? "ECJ" : "OAB";
  return BUILTIN_DEFAULT_COURSES.find((c) => c.program === key)!;
}

export function parsePropostaCourses(raw: string | null | undefined): PropostaCourse[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (c): c is PropostaCourse =>
        !!c &&
        typeof c === "object" &&
        typeof (c as PropostaCourse).id === "string" &&
        typeof (c as PropostaCourse).name === "string" &&
        typeof (c as PropostaCourse).value === "number"
    );
  } catch {
    return [];
  }
}

export function mergePropostaCourses(saved: PropostaCourse[]): PropostaCourse[] {
  const byId = new Map<string, PropostaCourse>();
  for (const c of BUILTIN_DEFAULT_COURSES) byId.set(c.id, { ...c });
  for (const c of saved) byId.set(c.id, { ...c });
  const merged = [...byId.values()];

  for (const program of ["OAB", "ECJ"] as const) {
    const savedDefault = saved.find((c) => c.program === program && c.isDefault);
    if (!savedDefault) continue;
    for (const course of merged) {
      if (course.program === program) {
        course.isDefault = course.id === savedDefault.id;
      }
    }
  }

  return merged.sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return a.name.localeCompare(b.name, "pt-BR");
  });
}

export function coursesForProgram(courses: PropostaCourse[], program: string): PropostaCourse[] {
  const key = program === "ECJ" ? "ECJ" : "OAB";
  return courses.filter((c) => c.program === key);
}

export function resolveDefaultCourse(courses: PropostaCourse[], program: string): PropostaCourse {
  const key = program === "ECJ" ? "ECJ" : "OAB";
  return (
    courses.find((c) => c.program === key && c.isDefault) ||
    courses.find((c) => c.program === key) ||
    defaultCourseForProgram(key)
  );
}

export function normalizeCourseInput(input: {
  program: string;
  name: string;
  url?: string;
  value: number;
  description?: string;
  careerUrl?: string;
  id?: string;
}): PropostaCourse {
  const program = input.program === "ECJ" ? "ECJ" : "OAB";
  const name = input.name.trim();
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return {
    id: input.id || `course-${program.toLowerCase()}-${slug || Date.now()}`,
    program,
    name,
    url: input.url?.trim() || undefined,
    value: input.value,
    description: input.description?.trim() || undefined,
    careerUrl: input.careerUrl?.trim() || undefined,
    updatedAt: new Date().toISOString(),
  };
}

export type PropostaCourseEmailVars = {
  courseName?: string;
  courseUrl?: string;
  courseDescription?: string;
  careerUrl?: string;
  productValue?: number;
  simulationCourseName?: string;
};

/** Monta vars do e-mail: curso recomendado opcional; simulação com valor manual ou padrão da vertical. */
export function resolvePropostaCourseEmailVars(opts: {
  program: string;
  courses: PropostaCourse[];
  courseName: string;
  courseUrl: string;
  courseDescription: string;
  careerUrl: string;
  productValue: string;
  includeRecommended: boolean;
}): PropostaCourseEmailVars {
  const defaultCourse = resolveDefaultCourse(opts.courses, opts.program);
  const manualValue = opts.productValue.trim() ? Number(opts.productValue) : NaN;
  const hasSimulationValue = Number.isFinite(manualValue) && manualValue > 0;
  const simulationValue = hasSimulationValue ? manualValue : defaultCourse.value;
  const simulationCourseName =
    opts.includeRecommended && opts.courseName.trim()
      ? opts.courseName.trim()
      : defaultCourse.name;

  const courseVars =
    opts.includeRecommended && opts.courseName.trim()
      ? {
          courseName: opts.courseName.trim(),
          courseUrl: opts.courseUrl.trim() || undefined,
          courseDescription: opts.courseDescription.trim() || undefined,
          careerUrl: opts.careerUrl.trim() || undefined,
        }
      : {};

  return {
    ...courseVars,
    productValue: simulationValue,
    simulationCourseName,
  };
}

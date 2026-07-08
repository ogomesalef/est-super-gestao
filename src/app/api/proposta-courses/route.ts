import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  mergePropostaCourses,
  normalizeCourseInput,
  parsePropostaCourses,
  PROPOSTA_COURSES_SETTING_KEY,
  type PropostaCourse,
} from "@/lib/proposta-courses";

async function loadCourses(): Promise<PropostaCourse[]> {
  const row = await prisma.appSetting.findUnique({ where: { key: PROPOSTA_COURSES_SETTING_KEY } });
  return mergePropostaCourses(parsePropostaCourses(row?.value));
}

async function saveCourses(courses: PropostaCourse[]) {
  const custom = courses
    .filter((c) => !c.id.startsWith("builtin-"))
    .map(({ id, program, name, url, value, description, careerUrl, isDefault, updatedAt }) => ({
      id,
      program,
      name,
      url,
      value,
      description,
      careerUrl,
      isDefault,
      updatedAt,
    }));
  const builtinsWithDefault = courses
    .filter((c) => c.id.startsWith("builtin-") && c.isDefault)
    .map(({ id, program, isDefault }) => ({ id, program, name: "", value: 0, isDefault }));
  await prisma.appSetting.upsert({
    where: { key: PROPOSTA_COURSES_SETTING_KEY },
    create: {
      key: PROPOSTA_COURSES_SETTING_KEY,
      value: JSON.stringify([...custom, ...builtinsWithDefault]),
    },
    update: { value: JSON.stringify([...custom, ...builtinsWithDefault]) },
  });
}

export async function GET() {
  const courses = await loadCourses();
  return NextResponse.json({ courses });
}

export async function POST(req: Request) {
  const body = await req.json();
  const action = String(body.action || "upsert");

  const courses = await loadCourses();

  if (action === "delete") {
    const id = String(body.id || "");
    if (!id || id.startsWith("builtin-")) {
      return NextResponse.json({ error: "Curso não pode ser removido" }, { status: 400 });
    }
    const next = courses.filter((c) => c.id !== id);
    await saveCourses(next);
    return NextResponse.json({ courses: next });
  }

  if (action === "set-default") {
    const id = String(body.id || "");
    const program = body.program === "ECJ" ? "ECJ" : "OAB";
    const target = courses.find((c) => c.id === id && c.program === program);
    if (!target) return NextResponse.json({ error: "Curso não encontrado" }, { status: 404 });
    const next = courses.map((c) =>
      c.program === program ? { ...c, isDefault: c.id === id } : c
    );
    await saveCourses(next);
    return NextResponse.json({ courses: next });
  }

  const value = Number(body.value);
  if (!body.name?.trim() || !Number.isFinite(value) || value <= 0) {
    return NextResponse.json({ error: "Nome e valor do curso são obrigatórios" }, { status: 400 });
  }

  const normalized = normalizeCourseInput({
    id: body.id ? String(body.id) : undefined,
    program: body.program,
    name: String(body.name),
    url: body.url ? String(body.url) : undefined,
    value,
    description: body.description ? String(body.description) : undefined,
    careerUrl: body.careerUrl ? String(body.careerUrl) : undefined,
  });

  const without = courses.filter((c) => c.id !== normalized.id);
  const next = mergePropostaCourses([
    ...without.filter((c) => !c.id.startsWith("builtin-")),
    normalized,
  ]);
  await saveCourses(next);
  return NextResponse.json({ courses: next, course: normalized });
}

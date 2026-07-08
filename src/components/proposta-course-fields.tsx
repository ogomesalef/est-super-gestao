"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Input, Select, Textarea } from "@/components/ui";
import {
  coursesForProgram,
  resolveDefaultCourse,
  type PropostaCourse,
} from "@/lib/proposta-courses";
import { BookmarkPlus, Loader2, Star } from "lucide-react";

export type PropostaCourseFieldState = {
  selectedCourseId: string;
  courseName: string;
  courseUrl: string;
  courseDescription: string;
  careerUrl: string;
  productValue: string;
  includeRecommended: boolean;
};

export function emptyPropostaCourseFields(): PropostaCourseFieldState {
  return {
    selectedCourseId: "",
    courseName: "",
    courseUrl: "",
    courseDescription: "",
    careerUrl: "",
    productValue: "",
    includeRecommended: false,
  };
}

export function PropostaCourseFields({
  program,
  value,
  onChange,
}: {
  program: string;
  value: PropostaCourseFieldState;
  onChange: (next: PropostaCourseFieldState) => void;
}) {
  const [courses, setCourses] = useState<PropostaCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const programCourses = useMemo(() => coursesForProgram(courses, program), [courses, program]);
  const defaultCourse = useMemo(() => resolveDefaultCourse(courses, program), [courses, program]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/proposta-courses")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setCourses(data.courses || []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function patch(partial: Partial<PropostaCourseFieldState>) {
    onChange({ ...value, ...partial });
  }

  function applyCourse(course: PropostaCourse, includeRecommended = true) {
    onChange({
      selectedCourseId: course.id,
      courseName: course.name,
      courseUrl: course.url || "",
      courseDescription: course.description || "",
      careerUrl: course.careerUrl || "",
      productValue: String(course.value),
      includeRecommended,
    });
  }

  function applyDefaultForSimulation() {
    if (!defaultCourse) return;
    onChange({
      ...value,
      productValue: String(defaultCourse.value),
      selectedCourseId: value.selectedCourseId || defaultCourse.id,
    });
  }

  async function saveCourse() {
    const name = value.courseName.trim();
    const price = Number(value.productValue);
    if (!name || !Number.isFinite(price) || price <= 0) {
      setFeedback("Preencha nome e valor antes de salvar.");
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/proposta-courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upsert",
          id:
            value.selectedCourseId && !value.selectedCourseId.startsWith("builtin-")
              ? value.selectedCourseId
              : undefined,
          program,
          name,
          url: value.courseUrl,
          value: price,
          description: value.courseDescription,
          careerUrl: value.careerUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar curso");
      setCourses(data.courses || []);
      if (data.course?.id) patch({ selectedCourseId: data.course.id });
      setFeedback("Curso salvo no catálogo.");
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : "Erro ao salvar curso");
    } finally {
      setSaving(false);
    }
  }

  async function setAsDefault() {
    if (!value.selectedCourseId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/proposta-courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set-default",
          id: value.selectedCourseId,
          program,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro");
      setCourses(data.courses || []);
      setFeedback("Curso padrão atualizado.");
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : "Erro");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-hairline bg-surface/30 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Curso recomendado
        </p>
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted-foreground">Catálogo salvo</span>
        <Select
          value={value.selectedCourseId}
          onChange={(e) => {
            const id = e.target.value;
            if (!id) {
              patch({ selectedCourseId: "" });
              return;
            }
            const course = programCourses.find((c) => c.id === id);
            if (course) applyCourse(course, value.includeRecommended);
          }}
        >
          <option value="">Selecionar curso salvo…</option>
          {programCourses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.isDefault ? " (padrão)" : ""} — R$ {c.value.toFixed(2).replace(".", ",")}
            </option>
          ))}
        </Select>
      </label>

      <label className="flex items-center gap-2 text-xs text-ink">
        <input
          type="checkbox"
          checked={value.includeRecommended}
          onChange={(e) => patch({ includeRecommended: e.target.checked })}
        />
        Incluir curso recomendado no e-mail
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted-foreground">
          Valor do curso (R$) — simulação de comissão
        </span>
        <Input
          type="number"
          min={0}
          step="0.01"
          value={value.productValue}
          onChange={(e) => patch({ productValue: e.target.value })}
          placeholder={defaultCourse ? String(defaultCourse.value) : "0,00"}
        />
      </label>

      {!value.productValue.trim() && defaultCourse && (
        <Button type="button" variant="ghost" size="sm" onClick={applyDefaultForSimulation}>
          Usar padrão ({defaultCourse.name}) — R${" "}
          {defaultCourse.value.toFixed(2).replace(".", ",")}
        </Button>
      )}

      {value.includeRecommended && (
        <>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Nome do curso</span>
            <Input
              value={value.courseName}
              onChange={(e) => patch({ courseName: e.target.value, selectedCourseId: "" })}
              placeholder="Ex.: Assinatura Magistratura"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Link do produto</span>
            <Input
              value={value.courseUrl}
              onChange={(e) => patch({ courseUrl: e.target.value })}
              placeholder="https://..."
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">
              Descrição breve (opcional)
            </span>
            <Textarea
              value={value.courseDescription}
              onChange={(e) => patch({ courseDescription: e.target.value })}
              className="min-h-[72px] text-sm"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">
              Link de carreira/concurso (opcional)
            </span>
            <Input
              value={value.careerUrl}
              onChange={(e) => patch({ careerUrl: e.target.value })}
              placeholder="https://..."
            />
          </label>
        </>
      )}

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        A simulação de comissão aparece no e-mail com o valor acima. Sem valor manual, usamos o padrão da
        vertical ({defaultCourse.name}).
      </p>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" disabled={saving} onClick={saveCourse}>
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <BookmarkPlus className="h-3.5 w-3.5" />
          )}
          Salvar no catálogo
        </Button>
        {value.selectedCourseId && (
          <Button type="button" variant="ghost" size="sm" disabled={saving} onClick={setAsDefault}>
            <Star className="h-3.5 w-3.5" />
            Tornar padrão
          </Button>
        )}
      </div>

      {feedback && <p className="text-xs text-muted-foreground">{feedback}</p>}
    </div>
  );
}

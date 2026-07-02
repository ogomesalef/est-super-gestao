export type AmbassadorQuickNote = {
  id: string;
  ambassadorId: string;
  text: string;
  pinned: boolean;
  completed: boolean;
  createdAt: string;
  completedAt: string | null;
};

export function serializeQuickNote(note: {
  id: string;
  ambassadorId: string;
  text: string;
  pinned: boolean;
  completed: boolean;
  createdAt: Date;
  completedAt: Date | null;
}): AmbassadorQuickNote {
  return {
    id: note.id,
    ambassadorId: note.ambassadorId,
    text: note.text,
    pinned: note.pinned,
    completed: note.completed,
    createdAt: note.createdAt.toISOString(),
    completedAt: note.completedAt ? note.completedAt.toISOString() : null,
  };
}

export function openQuickNotes(notes: AmbassadorQuickNote[]): AmbassadorQuickNote[] {
  return notes.filter((n) => !n.completed);
}

export function pinnedCardNotes(notes: AmbassadorQuickNote[]): AmbassadorQuickNote[] {
  return notes.filter((n) => n.pinned && !n.completed);
}

export const ambassadorOpenQuickNotesQuery = {
  where: { completed: false },
  orderBy: [{ pinned: "desc" as const }, { createdAt: "desc" as const }],
};

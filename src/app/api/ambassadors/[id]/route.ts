import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeQuickNote } from "@/lib/ambassador-quick-notes";

function serializeDate(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const ambassador = await prisma.ambassador.findUnique({
    where: { id },
    include: {
      partnership: true,
      contact: true,
      quickNotes: {
        orderBy: [{ completed: "asc" }, { pinned: "desc" }, { createdAt: "desc" }],
      },
      monthlyControls: { orderBy: { monthRef: "desc" } },
      monthlyFinances: { orderBy: { monthRef: "desc" } },
      deliveries: { orderBy: { postedAt: "desc" }, take: 50 },
      emailLogs: { orderBy: { createdAt: "desc" }, take: 30 },
    },
  });

  if (!ambassador) {
    return NextResponse.json({ error: "Embaixador não encontrado" }, { status: 404 });
  }

  const p = ambassador.partnership;

  return NextResponse.json({
    id: ambassador.id,
    program: ambassador.program,
    fullName: ambassador.fullName,
    email: ambassador.email,
    whatsapp: ambassador.whatsapp,
    instagram: ambassador.instagram,
    tiktok: ambassador.tiktok,
    youtube: ambassador.youtube,
    status: ambassador.status,
    alerts: ambassador.alerts,
    quickNotes: ambassador.quickNotes.map(serializeQuickNote),
    gmailThreadId: ambassador.gmailThreadId,
    createdAt: ambassador.createdAt.toISOString(),
    updatedAt: ambassador.updatedAt.toISOString(),
    partnership: p
      ? {
          modality: p.modality,
          agreedValue: p.agreedValue,
          valueLocked: p.valueLocked,
          courseName: p.courseName,
          courseReleased: p.courseReleased,
          courseReleaseDate: serializeDate(p.courseReleaseDate),
          couponCode: p.couponCode,
          metaFeed: p.metaFeed,
          metaStories: p.metaStories,
          metaTiktok: p.metaTiktok,
          metaYoutube: p.metaYoutube,
          startDate: serializeDate(p.startDate),
          endDate: serializeDate(p.endDate),
          proposalSentAt: serializeDate(p.proposalSentAt),
          formalizationSentAt: serializeDate(p.formalizationSentAt),
          legalCpf: p.legalCpf,
          legalAddress: p.legalAddress,
          bankDetails: p.bankDetails,
        }
      : null,
    contact: ambassador.contact
      ? {
          id: ambassador.contact.id,
          status: ambassador.contact.status,
          origin: ambassador.contact.origin,
          notes: ambassador.contact.notes,
        }
      : null,
    monthlyControls: ambassador.monthlyControls.map((c) => ({
      id: c.id,
      monthRef: c.monthRef,
      pctDelivered: c.pctDelivered,
      metaFeed: c.metaFeed,
      deliveredFeed: c.deliveredFeed,
      statusFeed: c.statusFeed,
      metaStories: c.metaStories,
      deliveredStories: c.deliveredStories,
      statusStories: c.statusStories,
      metaTiktok: c.metaTiktok,
      deliveredTiktok: c.deliveredTiktok,
      statusTiktok: c.statusTiktok,
      metaYoutube: c.metaYoutube,
      deliveredYoutube: c.deliveredYoutube,
      statusYoutube: c.statusYoutube,
      proofsLink: c.proofsLink,
      notes: c.notes,
    })),
    monthlyFinances: ambassador.monthlyFinances.map((f) => ({
      id: f.id,
      monthRef: f.monthRef,
      paymentStatus: f.paymentStatus,
      pctDelivered: f.pctDelivered,
      agreedValue: f.agreedValue,
      amountDue: f.amountDue,
      termLink: f.termLink,
      termSigned: f.termSigned,
      log: f.log,
    })),
    deliveries: ambassador.deliveries.map((d) => ({
      id: d.id,
      deliveryType: d.deliveryType,
      postedAt: serializeDate(d.postedAt),
      postLink: d.postLink,
      campaignName: d.campaignName,
      driveStatus: d.driveStatus,
    })),
    emailLogs: ambassador.emailLogs.map((e) => ({
      id: e.id,
      emailType: e.emailType,
      subject: e.subject,
      recipient: e.recipient,
      status: e.status,
      sentAt: serializeDate(e.sentAt),
      createdAt: e.createdAt.toISOString(),
    })),
  });
}

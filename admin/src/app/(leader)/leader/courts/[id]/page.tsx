import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr';
import { requireLeader } from '@/lib/leader/context';
import { loadSports } from '@/lib/leader/overview';
import { loadCourts } from '@/lib/leader/courts';
import { PageTop } from '@/components/board/ui';
import { CourtForm } from '../CourtForm';

export default async function EditCourt({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireLeader();
  if (!ctx.features.has('courts')) redirect('/leader/features');
  const { id } = await params;
  const [courts, sports] = await Promise.all([loadCourts(ctx.businessId), loadSports()]);
  const c = courts.find((x) => x.id === id);
  if (!c) notFound();
  return (
    <>
      <Link href="/leader/courts" className="link text-[13px] inline-flex items-center gap-1"><ArrowLeft size={14} /> Courts</Link>
      <PageTop title={c.name} sub="Changes show in the app straight away. Bookings already made keep their price." />
      <CourtForm id={c.id} v={c} sports={sports.map((s) => ({ slug: s.slug, name: s.name }))} />
    </>
  );
}

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr';
import { requireLeader } from '@/lib/leader/context';
import { loadSports } from '@/lib/leader/overview';
import { PageTop } from '@/components/board/ui';
import { CourtForm } from '../CourtForm';

export default async function NewCourt() {
  const ctx = await requireLeader();
  if (!ctx.features.has('courts')) redirect('/leader/features');
  const sports = await loadSports();
  return (
    <>
      <Link href="/leader/courts" className="link text-[13px] inline-flex items-center gap-1"><ArrowLeft size={14} /> Courts</Link>
      <PageTop title="Add a court" sub="Members can book it in the app as soon as you save." />
      <CourtForm id={null} v={null} sports={sports.map((s) => ({ slug: s.slug, name: s.name }))} />
    </>
  );
}

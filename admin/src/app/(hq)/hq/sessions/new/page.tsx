import Link from 'next/link';
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr';
import { requireRole } from '@/lib/auth';
import { EMPTY_FORM } from '@/lib/events';
import { Box, PageTop } from '@/components/board/ui';
import { createSession } from '../actions';
import { loadCommunityList, loadSessionCities, loadSportList } from '../data';
import { SessionForm } from '../SessionForm';

export default async function NewSession() {
  await requireRole('admin');
  const [sports, communities, cities] = await Promise.all([loadSportList(), loadCommunityList(), loadSessionCities()]);

  return (
    <>
      <Link href="/hq/sessions" className="link text-[13px] inline-flex items-center gap-1"><ArrowLeft size={14} /> Sessions</Link>
      <PageTop title="Post a session" sub="It shows in the app as soon as you post it." />
      <Box className="max-w-3xl">
        <SessionForm
          action={createSession}
          initial={EMPTY_FORM}
          sports={sports}
          communities={communities}
          cities={cities.map((c) => c.name)}
          showCommunity
          mode="new"
        />
      </Box>
    </>
  );
}

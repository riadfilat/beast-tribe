import { requireRole } from '@/lib/auth';
import { PageTop, Tabs } from '@/components/board/ui';
import { loadCounts } from './data';
import { ReportsTab } from './ReportsTab';
import { PhotosTab } from './PhotosTab';
import { PostsTab } from './PostsTab';
import { CommentsTab } from './CommentsTab';

export const revalidate = 0;

const TABS = ['reports', 'photos', 'posts', 'comments'] as const;
type Tab = (typeof TABS)[number];

/** Safety: member reports, the photo check, feed posts and comments, in one place. Moderators use it too. */
export default async function Safety({ searchParams }: { searchParams: Promise<{ tab?: string; page?: string; show?: string }> }) {
  await requireRole('moderator');
  const [q, counts] = await Promise.all([searchParams, loadCounts()]);
  const tab: Tab = TABS.includes(q.tab as Tab) ? (q.tab as Tab) : !counts.reports && counts.photos ? 'photos' : 'reports';
  const page = Math.max(1, parseInt(q.page || '1', 10) || 1);
  const waiting = counts.reports + counts.photos;

  return (
    <>
      <PageTop
        title="Safety"
        sub={waiting ? `${counts.reports} report${counts.reports === 1 ? '' : 's'} and ${counts.photos} photo${counts.photos === 1 ? '' : 's'} waiting` : 'Nothing waiting. All clear.'}
      />
      <Tabs
        current={tab}
        items={[
          { key: 'reports', label: 'Reports', href: '/hq/safety?tab=reports', count: counts.reports },
          { key: 'photos', label: 'Photos', href: '/hq/safety?tab=photos', count: counts.photos },
          { key: 'posts', label: 'Posts', href: '/hq/safety?tab=posts' },
          { key: 'comments', label: 'Comments', href: '/hq/safety?tab=comments' },
        ]}
      />
      {tab === 'reports' ? <ReportsTab /> : null}
      {tab === 'photos' ? <PhotosTab /> : null}
      {tab === 'posts' ? <PostsTab page={page} hidden={q.show === 'hidden'} /> : null}
      {tab === 'comments' ? <CommentsTab /> : null}
    </>
  );
}

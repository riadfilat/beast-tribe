import { requireRole } from '@/lib/auth';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, MapPin, Trash } from '@phosphor-icons/react/dist/ssr';
import { Box, PageTop, Pill } from '@/components/board/ui';
import { ConfirmButton } from '@/components/ConfirmSubmit';
import { deleteCommunity, updateCommunity } from '../admin-actions';
import { CommunityFields } from '../CommunityFields';
import { loadCommunityPage } from './load';
import { FeaturesBox, TeamBox } from './TeamFeatures';
import { JoinBox } from './JoinBox';
import { GroupsBox } from './GroupsBox';
import { PerksBox } from './PerksBox';
import { MembersBox } from './MembersBox';

export const revalidate = 0;

const KIND: Record<string, string> = { club: 'Club', gym: 'Gym', company: 'Company', school: 'School', compound: 'Compound', city: 'City', brand: 'Beast Tribe' };

export default async function HqCommunity({ params }: { params: Promise<{ id: string }> }) {
  await requireRole('admin');
  const { id } = await params;
  const data = await loadCommunityPage(id);
  if (!data) notFound();
  const { c } = data;

  return (
    <>
      <Link href="/hq/communities" className="link text-[13px] inline-flex items-center gap-1"><ArrowLeft size={14} /> Leaders & communities</Link>
      <PageTop
        title={c.name}
        sub={[KIND[c.kind] ?? c.kind, c.city, c.visibility === 'open' ? 'open to everyone' : 'private'].filter(Boolean).join(' · ')}
        action={
          <span className="flex flex-wrap gap-1.5">
            {c.is_active === false ? <Pill tone="mute">Hidden</Pill> : <Pill tone="good">Live</Pill>}
            {c.verified_at ? <Pill tone="info">Verified</Pill> : null}
          </span>
        }
      />

      <div className="grid lg:grid-cols-2 gap-4 items-start">
        <div className="grid gap-4">
          <TeamBox id={id} people={data.people} />
          <JoinBox c={c} memberCount={data.memberCount} leaderName={data.leaderName} />
          <GroupsBox communityId={id} groups={data.groups} existing={data.looseGroups} />
        </div>
        <div className="grid gap-4">
          <FeaturesBox id={id} on={data.featuresOn} />
          <Box title="Details" icon="profile">
            <CommunityFields action={updateCommunity.bind(null, id)} community={c} />
          </Box>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 items-start">
        <MembersBox communityId={id} communityName={c.name} members={data.members} total={data.memberCount} />
        <div className="grid gap-4">
          <PerksBox communityId={id} included={data.included} candidates={data.candidates} />
          <Box title="Places" icon="places" sub="Spots that belong to this community." action={<Link href="/hq/places" className="btn ghost small">Places & courts</Link>}>
            {data.locations.length ? (
              <div className="flex flex-wrap gap-1.5">
                {data.locations.map((l) => (
                  <span key={l.id} className="chip"><MapPin size={14} style={{ color: 'var(--aqua)' }} /> {l.name}{l.city ? <span className="hint">· {l.city}</span> : null}</span>
                ))}
              </div>
            ) : (
              <p className="hint">No places of its own yet.</p>
            )}
          </Box>
        </div>
      </div>

      <Box title="Delete this community" sub="It goes for good. Members are taken out of it, and its own groups and places are deleted with it.">
        <form action={deleteCommunity.bind(null, id)}>
          <ConfirmButton confirmMessage={`Delete “${c.name}”? This can’t be undone.`} className="btn danger small">
            <Trash size={14} weight="bold" /> Delete community
          </ConfirmButton>
        </form>
      </Box>
    </>
  );
}

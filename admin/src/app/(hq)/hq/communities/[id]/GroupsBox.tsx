import { PackPatch } from '@/components/brand/PackPatch';
import { Box } from '@/components/board/ui';
import { ConfirmButton } from '@/components/ConfirmSubmit';
import { removeCommunityDefaultPack } from '../admin-actions';
import { AddGroup } from './AddGroup';

// Groups every new member of the community joins automatically.

export interface DefaultGroup {
  id: string;
  name: string;
  description: string | null;
  emblem_kind: string | null;
  emblem_value: string | null;
  emblem_color: string | null;
  animal?: string | null;
}

export function GroupsBox({ communityId, groups, existing }: { communityId: string; groups: DefaultGroup[]; existing: { id: string; name: string }[] }) {
  return (
    <Box title="Starter groups" icon="teams" sub="New members join these groups automatically.">
      {groups.length ? (
        <div className="grid">
          {groups.map((g) => (
            <div key={g.id} className="flex items-center gap-3 py-2.5 rule-top first:border-t-0">
              <PackPatch pack={g as any} size={34} />
              <span className="flex-1 min-w-0">
                <b className="block truncate text-[14px]" style={{ fontFamily: 'var(--bt-head)' }}>{g.name}</b>
                {g.description ? <span className="hint block truncate">{g.description}</span> : null}
              </span>
              <form action={removeCommunityDefaultPack.bind(null, communityId, g.id)}>
                <ConfirmButton confirmMessage={`Stop adding new members to “${g.name}”? People already in it stay.`} className="btn ghost small">Remove</ConfirmButton>
              </form>
            </div>
          ))}
        </div>
      ) : (
        <p className="hint">No starter groups yet. New members won’t be put in a group.</p>
      )}
      <AddGroup communityId={communityId} existing={existing} />
    </Box>
  );
}

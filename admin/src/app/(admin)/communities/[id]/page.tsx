import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/auth';
import CommunityForm from '../CommunityForm';
import AddDefaultPackForm from '../AddDefaultPackForm';
import {
  updateCommunity,
  deleteCommunity,
  removeCommunityDefaultPack,
  removeUserFromCommunity,
} from '../actions';
import { ConfirmButton } from '@/components/ConfirmSubmit';

export const revalidate = 0;

export default async function EditCommunityPage({ params }: { params: { id: string } }) {
  await requireAdmin();
  const db = createAdminClient();

  const { data: community } = await db
    .from('communities')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (!community) notFound();

  const [membersRes, defaultPacksRes, locationsRes, availablePacksRes] = await Promise.all([
    db
      .from('profiles')
      .select('id, display_name, full_name, total_xp, created_at')
      .eq('community_id', community.id)
      .order('total_xp', { ascending: false })
      .limit(200),
    db
      .from('packs')
      .select('id, name, animal, description, is_community_default')
      .eq('community_id', community.id)
      .eq('is_community_default', true)
      .order('name', { ascending: true }),
    db
      .from('popular_locations')
      .select('id, name, city')
      .eq('community_id', community.id),
    db
      .from('packs')
      .select('id, name, animal')
      .is('community_id', null)
      .order('name', { ascending: true })
      .limit(100),
  ]);

  const members = membersRes.data || [];
  const defaultPacks = defaultPacksRes.data || [];
  const locations = locationsRes.data || [];
  const availablePacks = (availablePacksRes.data || []) as {
    id: string;
    name: string;
    animal: string | null;
  }[];

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <Link
          href="/communities"
          className="text-xs text-gray-500 hover:text-brand-aqua transition"
        >
          ← Back to communities
        </Link>
        <div className="flex items-center gap-3 mt-2">
          {community.logo_url ? (
            <div
              className="w-12 h-12 rounded-lg bg-white border border-gray-200 bg-cover bg-center flex-none"
              style={{ backgroundImage: `url(${community.logo_url})` }}
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-brand-orange/10 text-brand-orange flex items-center justify-center text-xl flex-none border border-gray-200">
              🏘
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{community.name}</h1>
            <p className="text-sm text-gray-500">
              {[community.city, community.country].filter(Boolean).join(' · ')} · /{community.slug}
            </p>
          </div>
        </div>
      </div>

      <CommunityForm
        action={async (formData: FormData) => {
          'use server';
          await updateCommunity(community.id, formData);
        }}
        community={community}
      />

      {/* Members */}
      <section className="mt-10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Members</h2>
            <p className="text-xs text-gray-500">
              {members.length.toLocaleString()} user{members.length === 1 ? '' : 's'} in this community
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {members.length === 0 ? (
            <p className="px-5 py-8 text-sm text-gray-400 text-center">No members yet.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {members.map((m: any) => (
                <div key={m.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/users/${m.id}`}
                      className="text-sm font-medium text-gray-800 hover:text-brand-aqua transition"
                    >
                      {m.full_name || m.display_name || 'Unnamed'}
                    </Link>
                    <p className="text-xs text-gray-400">
                      @{m.display_name || '—'} ·{' '}
                      <span className="font-medium text-gray-500">
                        {(m.total_xp || 0).toLocaleString()} XP
                      </span>{' '}
                      · joined {new Date(m.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <form
                    action={async () => {
                      'use server';
                      await removeUserFromCommunity(m.id, community.id);
                    }}
                  >
                    <ConfirmButton
                      confirmMessage={`Remove ${m.full_name || m.display_name || 'this user'} from ${community.name}?`}
                      className="text-xs px-2.5 py-1 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:border-red-200 hover:text-red-600 transition"
                    >
                      Remove
                    </ConfirmButton>
                  </form>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Default Packs */}
      <section className="mt-10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Default Packs</h2>
            <p className="text-xs text-gray-500">
              New community members are auto-joined to these packs.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
          {defaultPacks.length === 0 ? (
            <p className="text-sm text-gray-400 px-1 py-2">
              No default packs yet. Add one below.
            </p>
          ) : (
            <div className="divide-y divide-gray-50">
              {defaultPacks.map((p: any) => (
                <div key={p.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800">
                      {p.name}
                      {p.animal && (
                        <span className="ml-2 text-[11px] px-1.5 py-0.5 bg-brand-teal/10 text-brand-teal rounded">
                          {p.animal}
                        </span>
                      )}
                    </p>
                    {p.description && (
                      <p className="text-xs text-gray-500 line-clamp-1">{p.description}</p>
                    )}
                  </div>
                  <form
                    action={async () => {
                      'use server';
                      await removeCommunityDefaultPack(community.id, p.id);
                    }}
                  >
                    <ConfirmButton
                      confirmMessage={`Remove "${p.name}" as a default pack? Existing members keep their membership; new joiners won't be auto-added.`}
                      className="text-xs px-2.5 py-1 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:border-red-200 hover:text-red-600 transition"
                    >
                      Remove
                    </ConfirmButton>
                  </form>
                </div>
              ))}
            </div>
          )}

          <AddDefaultPackForm communityId={community.id} availablePacks={availablePacks} />
        </div>
      </section>

      {/* Community Locations */}
      <section className="mt-10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Community Locations</h2>
            <p className="text-xs text-gray-500">
              Popular spots scoped to this community.
            </p>
          </div>
          <Link
            href={`/locations?community=${community.id}`}
            className="text-xs px-3 py-1.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Manage in Locations →
          </Link>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          {locations.length === 0 ? (
            <p className="text-sm text-gray-400">No community-scoped locations yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {locations.map((loc: any) => (
                <Link
                  key={loc.id}
                  href={`/locations/${loc.id}`}
                  className="text-xs px-3 py-1.5 bg-brand-aqua/10 text-brand-aqua rounded-full hover:bg-brand-aqua/20 transition"
                >
                  📍 {loc.name}
                  {loc.city && <span className="text-gray-400 ml-1">· {loc.city}</span>}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Danger Zone */}
      <div className="mt-12 pt-6 border-t border-red-100">
        <h3 className="text-sm font-semibold text-red-600 mb-2">Danger Zone</h3>
        <p className="text-xs text-gray-500 mb-3">
          Deleting permanently removes this community. Members will be unassigned;
          community-scoped packs and locations are cascaded by the database.
        </p>
        <form
          action={async () => {
            'use server';
            await deleteCommunity(community.id);
          }}
        >
          <ConfirmButton
            confirmMessage={`Delete "${community.name}"? This cannot be undone.`}
            className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition"
          >
            Delete Community
          </ConfirmButton>
        </form>
      </div>
    </div>
  );
}

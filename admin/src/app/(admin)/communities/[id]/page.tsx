import Link from 'next/link';
import { PackPatch } from '@/components/brand/PackPatch';
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
  regenerateJoinCode, verifyClub,
  addCommunityPartner,
  removeCommunityPartner,
} from '../actions';
import SubmitButton from '@/components/SubmitButton';
import { ConfirmButton } from '@/components/ConfirmSubmit';
import { Icon } from '@/components/ui/Icon';

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

  const [{ data: pkg }, { data: candidates }] = await Promise.all([
    db.from('community_partners').select('partner_id, role, perk, perk_ar, partner:partners(business_name, partner_type)').eq('community_id', community.id),
    db.from('partners').select('id, business_name, partner_type').in('partner_type', ['nutritionist', 'coach', 'gym', 'nutrition']).eq('is_active', true).order('business_name'),
  ]);
  const ROLE_LABEL: Record<string, string> = { nutritionist: 'Nutritionist', coach: 'Coach', gym: 'Gym', kitchen: 'Healthy kitchen' };

  const [membersRes, defaultPacksRes, locationsRes, availablePacksRes] = await Promise.all([
    db
      .from('community_members')
      .select('joined_at, role, profile:profiles(id, display_name, full_name, created_at)')
      .eq('community_id', community.id)
      .order('joined_at', { ascending: false })
      .limit(500),
    db
      .from('packs')
      .select('id, name, animal, emblem_kind, emblem_value, emblem_color, description, is_community_default')
      .eq('community_id', community.id)
      .eq('is_community_default', true)
      .order('name', { ascending: true }),
    db
      .from('popular_locations')
      .select('id, name, city')
      .eq('community_id', community.id),
    db
      .from('packs')
      .select('id, name')
      .is('community_id', null)
      .order('name', { ascending: true })
      .limit(100),
  ]);

  const members = (membersRes.data || []).map((r: any) => ({ ...r.profile, joined_at: r.joined_at, role: r.role })).filter((m: any) => m.id);
  const defaultPacks = defaultPacksRes.data || [];
  const locations = locationsRes.data || [];
  const availablePacks = (availablePacksRes.data || []) as {
    id: string;
    name: string;
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
              <Icon name="communities" size="lg" />
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

      {community.leader_id ? (
        <div className="mb-6 rounded-xl border border-[#E88F24]/40 bg-[#FDF6EC] px-5 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm text-gray-700">
            <p className="font-semibold text-gray-900">Member-run club{community.sport ? ` · ${community.sport}` : ''}</p>
            <p className="mt-0.5">
              {community.listing === 'public' ? 'The leader wants it listed for everyone.' : 'Invite only (join with the code).'}{' '}
              {community.verified_at ? `Verified ${new Date(community.verified_at).toLocaleDateString()}.` : 'Not verified yet.'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Free for the leader. Verifying shows a Verified badge and, if they chose it, lists the club in Discover.</p>
          </div>
          <form
            action={async () => {
              'use server';
              await verifyClub(community.id, !community.verified_at);
            }}
          >
            <button className={community.verified_at ? 'text-xs px-3 py-1.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50' : 'text-sm px-4 py-2 rounded-lg bg-brand-orange text-brand-teal font-semibold hover:brightness-95'}>
              {community.verified_at ? 'Remove verification' : 'Verify club'}
            </button>
          </form>
        </div>
      ) : null}

      {community.visibility === 'private' ? (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border-2 border-dashed border-brand-teal/30 bg-white px-5 py-4">
          <div>
            <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
              <Icon name="key" size="sm" />
              Invite code — share it with the {community.kind === 'compound' ? 'residents' : 'members'}
            </p>
            <p className="text-3xl font-bold tracking-[0.3em] text-brand-teal mt-1">{community.join_code}</p>
            <p className="text-[11px] text-gray-400 mt-1">
              {[
                community.seat_limit ? `${members.length}/${community.seat_limit} seats used` : `${members.length} members`,
                community.contract_ends_at ? `contract ends ${new Date(community.contract_ends_at).toLocaleDateString()}` : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
          <form
            action={async () => {
              'use server';
              await regenerateJoinCode(community.id);
            }}
          >
            <button className="text-xs px-3 py-1.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition">New code</button>
          </form>
        </div>
      ) : (
        <div className="mb-6 rounded-xl border border-gray-100 bg-white px-5 py-4 text-sm text-gray-600 flex items-center gap-2">
          <Icon name="globe" size="sm" className="text-brand-aqua" />
          Open community: anyone can join from the app{community.is_default ? '. Every new member joins it automatically.' : '.'}
        </div>
      )}

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
                      @{m.display_name || '—'} · joined {new Date(m.created_at).toLocaleDateString()}
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

      {/* Package */}
      <section className="mt-10">
        <div className="mb-3">
          <h2 className="text-lg font-bold text-gray-900">Package</h2>
          <p className="text-xs text-gray-500">Experts and venues included for this community&apos;s members. Members see them on the community page; they connect to a nutritionist or coach themselves and choose what to share.</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-4">
          {(pkg || []).length ? (
            <div className="divide-y divide-gray-50">
              {(pkg || []).map((x: any) => (
                <div key={x.partner_id} className="flex items-center gap-3 py-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 w-28 text-center">{ROLE_LABEL[x.role] || x.role}</span>
                  <span className="flex-1 text-sm text-gray-900">{x.partner?.business_name}</span>
                  <span className="text-xs text-gray-400 truncate max-w-[240px]">{x.perk}</span>
                  <form action={removeCommunityPartner.bind(null, community.id, x.partner_id)}>
                    <ConfirmButton confirmMessage="Remove from this package?" className="text-xs text-red-500 hover:underline">
                      Remove
                    </ConfirmButton>
                  </form>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Nothing included yet.</p>
          )}
          <form action={addCommunityPartner.bind(null, community.id)} className="grid md:grid-cols-5 gap-3 items-end border-t border-gray-50 pt-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Partner</label>
              <select name="partner_id" required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                {(candidates || []).map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.business_name} ({c.partner_type})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Included as</label>
              <select name="role" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                <option value="nutritionist">Nutritionist</option>
                <option value="coach">Coach</option>
                <option value="gym">Gym</option>
                <option value="kitchen">Healthy kitchen</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Perk (optional)</label>
              <input name="perk" placeholder="Free monthly check-in" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              <input name="perk_ar" dir="rtl" placeholder="بالعربية" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mt-2" />
            </div>
            <SubmitButton pendingLabel="Adding…" className="px-4 py-2 bg-brand-orange text-brand-teal rounded-lg text-sm font-semibold">
              Add to package
            </SubmitButton>
          </form>
          <p className="text-[11px] text-gray-400">No partner in the list? Add them under Partners first (type Nutritionist, Coach, Gym or Healthy restaurant).</p>
        </div>
      </section>

      {/* Default groups */}
      <section className="mt-10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Default Groups</h2>
            <p className="text-xs text-gray-500">
              New community members are auto-joined to these groups.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
          {defaultPacks.length === 0 ? (
            <p className="text-sm text-gray-400 px-1 py-2">
              No default groups yet. Add one below.
            </p>
          ) : (
            <div className="divide-y divide-gray-50">
              {defaultPacks.map((p: any) => (
                <div key={p.id} className="py-3 flex items-center justify-between gap-3">
                  <PackPatch pack={p} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800">{p.name}</p>
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
                      confirmMessage={`Remove "${p.name}" as a default group? Existing members keep their membership; new joiners won't be auto-added.`}
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
                  className="text-xs px-3 py-1.5 bg-brand-aqua/10 text-brand-aqua rounded-full hover:bg-brand-aqua/20 transition inline-flex items-center gap-1"
                >
                  <Icon name="locations" size="xs" />
                  {loc.name}
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
          community-scoped groups and locations are cascaded by the database.
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

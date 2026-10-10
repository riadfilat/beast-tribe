import { Check, X } from '@phosphor-icons/react/dist/ssr';
import { Box, Empty, Pill } from '@/components/board/ui';
import SubmitButton from '@/components/SubmitButton';
import { loadPhotos, nameOf } from './data';
import { approveImage, rejectImage } from './photo-actions';
import { when } from './parts';

const WHERE: Record<string, string> = { feed_posts: 'Post', profiles: 'Profile photo', events: 'Session', locations: 'Place', packs: 'Group', communities: 'Community' };
const where = (t: string) => WHERE[t] ?? t.replace(/_/g, ' ');

/** Photos the automatic check wants a person to look at. Approve or reject each within 48 hours. */
export async function PhotosTab() {
  const { pending, recent } = await loadPhotos();
  const now = Date.now();
  const hoursLeft = (created: string) => 48 - (now - new Date(created).getTime()) / 3600000;
  const overdue = pending.filter((i) => hoursLeft(i.created_at) < 0).length;

  return (
    <>
      <Box
        title="Photos to check"
        icon="safety"
        sub={<>Check each photo within 48 hours. Admins get phone reminders until the list is empty.{overdue ? <b style={{ color: 'var(--bad)' }}> {overdue} past 48 hours.</b> : null}</>}
      >
        {pending.length ? (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {pending.map((item) => {
              const h = hoursLeft(item.created_at);
              const scan = item.auto_scan_result;
              return (
                <div key={item.id} className="well overflow-hidden grid content-start">
                  <div className="h-56 grid place-items-center" style={{ background: 'var(--wash)' }}>
                    {item.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image_url} alt="Waiting for review" className="w-full h-full object-cover" />
                    ) : (
                      <span className="hint">No preview</span>
                    )}
                  </div>
                  <div className="p-3 grid gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="min-w-0">
                        <b className="block truncate text-[13px]" style={{ fontFamily: 'var(--bt-head)' }}>{nameOf(item.uploader)}</b>
                        <span className="hint">{where(item.source_table)} · {when(item.created_at)}</span>
                      </span>
                      <Pill tone={h < 0 ? 'bad' : h < 12 ? 'warn' : 'mute'}>{h < 0 ? `Overdue ${Math.ceil(-h)} h` : `${Math.floor(h)} h left`}</Pill>
                    </div>
                    <p className="text-[12px]" style={{ color: 'var(--ink-soft)' }}>
                      {scan?.verdict ? (
                        <>
                          <b style={{ color: 'var(--warn)' }}>Automatic check: needs a person</b>
                          {scan.categories?.length ? ` · ${scan.categories.join(', ')}` : ''}
                          {scan.reason ? <span className="hint block">{scan.reason}</span> : null}
                        </>
                      ) : scan?.error ? (
                        'The automatic check failed; please look yourself.'
                      ) : (
                        'No automatic check (it turns on when ANTHROPIC_API_KEY is set in Vercel).'
                      )}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <form action={approveImage.bind(null, item.id)}>
                        <SubmitButton className="btn small w-full" pendingLabel="Saving…"><Check size={14} weight="bold" />Approve</SubmitButton>
                      </form>
                      <form action={rejectImage.bind(null, item.id)}>
                        <SubmitButton className="btn danger small w-full" pendingLabel="Removing…"><X size={14} weight="bold" />Reject</SubmitButton>
                      </form>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Empty title="Nothing to review" body="All photos are checked. New ones the automatic check is unsure about wait here." />
        )}
      </Box>

      {recent.length ? (
        <Box title="Recently checked" icon="insights" sub="The last 20 photos, by a person or by the automatic check. Rejected photos are taken down everywhere.">
          <div className="overflow-x-auto">
            <table className="bt-table">
              <thead><tr><th>Result</th><th>Uploaded by</th><th>Where</th><th>Checked by</th><th>When</th></tr></thead>
              <tbody>
                {recent.map((item) => {
                  const ok = String(item.status).includes('approved');
                  return (
                    <tr key={item.id}>
                      <td><Pill tone={ok ? 'good' : 'bad'}>{ok ? 'Approved' : 'Rejected'}</Pill>{!ok && item.rejection_reason ? <span className="hint block">{item.rejection_reason}</span> : null}</td>
                      <td className="strong">{nameOf(item.uploader, '—')}</td>
                      <td>{where(item.source_table)}</td>
                      <td>{item.reviewer?.full_name ?? (String(item.status).startsWith('auto_') ? 'Automatic' : '—')}</td>
                      <td>{item.reviewed_at ? when(item.reviewed_at) : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Box>
      ) : null}
    </>
  );
}

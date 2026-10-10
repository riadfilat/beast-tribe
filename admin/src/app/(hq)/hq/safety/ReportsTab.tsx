import Link from 'next/link';
import { Box, Empty, Pill } from '@/components/board/ui';
import SubmitButton from '@/components/SubmitButton';
import { ConfirmButton } from '@/components/ConfirmSubmit';
import { loadReports, type Report } from './data';
import { dismissReport, hideAndResolve, resolveReport } from './report-actions';
import { Item, Said, Thumb, when } from './parts';

const REASON: Record<string, { label: string; tone: 'bad' | 'warn' | 'mute' }> = {
  nudity: { label: 'Nudity', tone: 'bad' },
  harassment: { label: 'Harassment', tone: 'bad' },
  inappropriate: { label: 'Inappropriate', tone: 'warn' },
  spam: { label: 'Spam', tone: 'warn' },
  other: { label: 'Other', tone: 'mute' },
};
const WHAT: Record<Report['target']['kind'], string> = { post: 'Post', comment: 'Comment', person: 'Person', other: 'Something else' };

/** Open member reports: look, then hide it, mark it resolved, or dismiss it. */
export async function ReportsTab() {
  const reports = await loadReports();
  return (
    <Box title="Reports from members" icon="safety" sub="Resolve when you have dealt with it. Dismiss when nothing is wrong. Either way the report leaves this list.">
      {reports.length ? (
        <div className="grid gap-2">
          {reports.map((r) => <ReportRow key={r.id} r={r} />)}
        </div>
      ) : (
        <Empty title="Nothing to review" body="When a member reports a post, a comment or a person, it shows up here." />
      )}
    </Box>
  );
}

function ReportRow({ r }: { r: Report }) {
  const reason = REASON[r.reason] ?? { label: r.reason, tone: 'mute' as const };
  const t = r.target;
  const canHide = (t.kind === 'post' || t.kind === 'comment') && !t.gone && !t.hidden;
  return (
    <Item
      tone={reason.tone === 'bad' ? 'bad' : 'warn'}
      name={t.author ?? (t.gone ? 'Already deleted' : 'Unknown')}
      meta={<>{WHAT[t.kind]} · reported by {r.reporter} · {when(r.created_at)}</>}
      badges={<><Pill tone={reason.tone}>{reason.label}</Pill>{t.hidden ? <Pill tone="mute">Hidden</Pill> : null}</>}
      actions={
        <>
          {canHide ? (
            <form action={hideAndResolve.bind(null, r.id)}>
              <ConfirmButton className="btn small" confirmMessage={`Hide this ${t.kind} and close the report?`}>Hide {t.kind}</ConfirmButton>
            </form>
          ) : null}
          <form action={resolveReport.bind(null, r.id)}>
            <SubmitButton className="btn ghost small" pendingLabel="Saving…">Resolve</SubmitButton>
          </form>
          <form action={dismissReport.bind(null, r.id)}>
            <SubmitButton className="btn ghost small" pendingLabel="Saving…">Dismiss</SubmitButton>
          </form>
          {t.authorId ? <Link href={`/hq/people/${t.authorId}`} className="btn ghost small">See {t.kind === 'person' ? 'person' : 'author'}</Link> : null}
        </>
      }
    >
      {t.kind === 'post' || t.kind === 'comment' ? <Said text={t.gone ? null : t.text} /> : null}
      {t.image && !t.gone ? <Thumb src={t.image} alt="Reported photo" /> : null}
      {t.kind === 'other' ? <p className="hint">{r.table} #{r.targetId.slice(0, 8)}</p> : null}
      {r.details ? <p className="text-[12px]" style={{ color: 'var(--ink-faint)' }}>Their note: “{r.details}”</p> : null}
    </Item>
  );
}

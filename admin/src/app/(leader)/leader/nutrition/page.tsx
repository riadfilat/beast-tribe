import { redirect } from 'next/navigation';
import { requireTeam } from '@/lib/leader/context';
import { Box, Notice, PageTop } from '@/components/board/ui';

// Nutrition is switched on but its booking flow is still being designed (see DECISIONS.md).
// Until then this page says honestly what it will do.

export default async function Nutrition() {
  const ctx = await requireTeam();
  if (!ctx.features.has('nutrition')) redirect('/leader/features');
  return (
    <>
      <PageTop title="Nutrition" sub="For communities with an in-house nutritionist." />
      <Notice>Coming next. You switched Nutrition on, so you’ll be among the first to get it, and Beast Tribe will contact you to set it up.</Notice>
      <Box title="What it will do" icon="nutrition">
        <ul className="grid gap-2 text-[13px] list-disc ps-5" style={{ color: 'var(--ink-soft)' }}>
          <li>Your nutritionist sets their weekly consult times here.</li>
          <li>Members book a consult in the app, like a 1:1 coaching session.</li>
          <li>You see who booked and how many consults a week your community uses.</li>
        </ul>
        <p className="hint">Meanwhile, your nutritionist can post group talks or workshops as normal sessions.</p>
      </Box>
    </>
  );
}

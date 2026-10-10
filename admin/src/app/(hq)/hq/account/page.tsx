import { requireAdmin } from '@/lib/auth';
import { Box, PageTop } from '@/components/board/ui';
import { TwoStep } from '@/components/board/TwoStep';

const ROLE: Record<string, string> = { super_admin: 'Super admin', admin: 'Admin', moderator: 'Moderator' };

export default async function Account() {
  const me = await requireAdmin();
  return (
    <>
      <PageTop title="Account" sub="Your sign-in and how it’s protected." />
      <div className="grid lg:grid-cols-2 gap-4 items-start">
        <Box title="You" icon="profile">
          <div className="grid gap-1.5 text-[14px]">
            <b style={{ fontFamily: 'var(--bt-head)' }}>{me.full_name}</b>
            <span className="hint select-all">{me.email}</span>
            <span className="pill info justify-self-start">{ROLE[me.role] || me.role}</span>
          </div>
          <p className="hint">To change your password, sign out and use “Forgot?” on the sign-in page.</p>
        </Box>
        <Box title="Two-step sign-in" icon="safety">
          <TwoStep />
        </Box>
      </div>
    </>
  );
}

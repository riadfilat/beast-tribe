import Link from 'next/link';
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr';
import { requireRole } from '@/lib/auth';
import { Box, PageTop } from '@/components/board/ui';
import { createCommunity } from '../admin-actions';
import { CommunityFields } from '../CommunityFields';

export default async function NewCommunity() {
  await requireRole('admin');
  return (
    <>
      <Link href="/hq/communities" className="link text-[13px] inline-flex items-center gap-1"><ArrowLeft size={14} /> Leaders & communities</Link>
      <PageTop title="New community" sub="Set it up now and add its leader later from the community’s page." />
      <Box className="max-w-3xl">
        <CommunityFields action={createCommunity} />
      </Box>
    </>
  );
}

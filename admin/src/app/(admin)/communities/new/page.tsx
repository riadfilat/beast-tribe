import { requireAdmin } from '@/lib/auth';
import CommunityForm from '../CommunityForm';
import { createCommunity } from '../actions';
import Link from 'next/link';

export default async function NewCommunityPage() {
  await requireAdmin();

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link href="/communities" className="text-xs text-gray-500 hover:text-brand-aqua transition">
          ← Back to communities
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">New Community</h1>
        <p className="text-sm text-gray-500">
          Create a tribe — members are auto-joined to default packs scoped here.
        </p>
      </div>

      <CommunityForm action={createCommunity} />
    </div>
  );
}

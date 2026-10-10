import Link from 'next/link';
import { Box, Empty, Pill } from '@/components/board/ui';
import SubmitButton from '@/components/SubmitButton';
import { ConfirmButton } from '@/components/ConfirmSubmit';
import { loadPosts, nameOf, PER_PAGE } from './data';
import { deletePost, hidePost, restorePost } from './feed-actions';
import { Item, Said, Thumb, when } from './parts';

const PHOTO: Record<string, { label: string; tone: 'good' | 'warn' | 'bad' }> = {
  approved: { label: 'Photo approved', tone: 'good' },
  rejected: { label: 'Photo rejected', tone: 'bad' },
};

/** Feed posts, newest first. Live ones by default; switch to see hidden ones and bring them back. */
export async function PostsTab({ page, hidden }: { page: number; hidden: boolean }) {
  const { posts, total } = await loadPosts(page, hidden);
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const href = (p: number, h = hidden) => `/hq/safety?${new URLSearchParams({ tab: 'posts', ...(h ? { show: 'hidden' } : {}), ...(p > 1 ? { page: String(p) } : {}) })}`;

  return (
    <Box
      title={hidden ? 'Hidden posts' : 'Posts in the feed'}
      icon="communities"
      sub={hidden ? 'Members can’t see these. Restore one to put it back in the feed.' : 'Hide a post to take it out of the feed (you can restore it later). Delete removes it for good.'}
      action={
        <span className="flex gap-1.5">
          <Link href={href(1, false)} className={`chip ${hidden ? '' : 'on'}`}>Live</Link>
          <Link href={href(1, true)} className={`chip ${hidden ? 'on' : ''}`}>Hidden</Link>
        </span>
      }
    >
      <p className="hint num">{total.toLocaleString()} {hidden ? 'hidden' : 'live'} post{total === 1 ? '' : 's'}</p>
      {posts.length ? (
        <div className="grid gap-2">
          {posts.map((post) => {
            const photo = post.image_url ? PHOTO[post.image_status] ?? { label: 'Photo being checked', tone: 'warn' as const } : null;
            const beasts = post.beast_count?.[0]?.count || 0;
            return (
              <Item
                key={post.id}
                tone={post.is_hidden ? 'mute' : 'info'}
                dim={post.is_hidden}
                name={nameOf(post.profile)}
                meta={[when(post.created_at), post.sport ? `${post.sport.emoji ?? ''} ${post.sport.name}`.trim() : null, `${beasts} Beast${beasts === 1 ? '' : 's'}`, post.post_type].filter(Boolean).join(' · ')}
                badges={<>{post.is_hidden ? <Pill tone="mute">Hidden</Pill> : null}{photo ? <Pill tone={photo.tone}>{photo.label}</Pill> : null}</>}
                actions={
                  <>
                    {post.is_hidden ? (
                      <form action={restorePost.bind(null, post.id)}>
                        <SubmitButton className="btn small" pendingLabel="Restoring…">Restore</SubmitButton>
                      </form>
                    ) : (
                      <form action={hidePost.bind(null, post.id)}>
                        <ConfirmButton className="btn ghost small" confirmMessage="Hide this post from the feed?">Hide</ConfirmButton>
                      </form>
                    )}
                    <form action={deletePost.bind(null, post.id)}>
                      <ConfirmButton className="btn danger small" confirmMessage="Delete this post for good? Its comments, Beasts and photo go too. This can’t be undone.">Delete</ConfirmButton>
                    </form>
                    {post.user_id ? <Link href={`/hq/people/${post.user_id}`} className="btn ghost small">See author</Link> : null}
                  </>
                }
              >
                <Said text={post.content} />
                {post.image_url ? <Thumb src={post.image_url} alt="Post photo" /> : null}
              </Item>
            );
          })}
        </div>
      ) : (
        <Empty title={hidden ? 'No hidden posts' : 'No posts yet'} body={hidden ? 'Posts you or the photo check hide show up here, ready to restore.' : 'Posts members share in the app show up here.'} />
      )}
      {pages > 1 ? (
        <div className="flex items-center justify-center gap-3">
          {page > 1 ? <Link href={href(page - 1)} className="btn ghost small">Newer</Link> : null}
          <span className="hint num">Page {page} of {pages}</span>
          {page < pages ? <Link href={href(page + 1)} className="btn ghost small">Older</Link> : null}
        </div>
      ) : null}
    </Box>
  );
}

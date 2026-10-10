import Link from 'next/link';
import { Box, Empty, Pill } from '@/components/board/ui';
import SubmitButton from '@/components/SubmitButton';
import { loadComments, nameOf } from './data';
import { hideComment, restoreComment } from './feed-actions';
import { Item, Said, when } from './parts';

/** The 50 newest comments. Reported ones are marked; hide or restore any of them. */
export async function CommentsTab() {
  const { comments, reported } = await loadComments();
  return (
    <Box title="Comments" icon="people" sub={`The 50 newest comments${reported.size ? ` · ${reported.size} reported by members` : ''}. Hidden comments disappear from the app until you restore them.`}>
      {comments.length ? (
        <div className="grid gap-2">
          {comments.map((c) => {
            const hidden = c.status === 'hidden' || c.status === 'deleted';
            const flagged = reported.has(c.id);
            const post = String(c.post?.content || '');
            return (
              <Item
                key={c.id}
                tone={hidden ? 'mute' : flagged ? 'warn' : 'info'}
                dim={hidden}
                name={nameOf(c.profile)}
                meta={<>{when(c.created_at)}{post ? <> · on “{post.length > 60 ? `${post.slice(0, 60)}…` : post}”</> : null}</>}
                badges={<>{flagged ? <Pill tone="warn">Reported</Pill> : null}{hidden ? <Pill tone="mute">Hidden</Pill> : null}</>}
                actions={
                  <>
                    <form action={(hidden ? restoreComment : hideComment).bind(null, c.id)}>
                      <SubmitButton className={hidden ? 'btn small' : 'btn ghost small'} pendingLabel="Saving…">{hidden ? 'Restore' : 'Hide'}</SubmitButton>
                    </form>
                    {c.user_id ? <Link href={`/hq/people/${c.user_id}`} className="btn ghost small">See author</Link> : null}
                  </>
                }
              >
                <Said text={c.content} />
              </Item>
            );
          })}
        </div>
      ) : (
        <Empty title="Nothing to review" body="Comments members leave on posts show up here." />
      )}
    </Box>
  );
}

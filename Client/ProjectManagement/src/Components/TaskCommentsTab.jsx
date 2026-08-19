import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api from '../Services/axios_api'
import { useTaskStore } from '../Store/useTaskStore'
import CommentItem from './CommentItem'
import useProjectStore from '../Store/useProjectStore'
import { useAddComment } from './hooks/useTask'

export default function TaskCommentsTab({ comments, taskId }) {
    const projectId = useProjectStore((state) => state.projectId)

    const [newCommentText, setNewCommentText] = useState('')
    const { mutate: postComment, isPending: postingComment } = useAddComment()
    useEffect(() => {
        setNewCommentText('')
    }, [taskId])

    const addComment = () => {
        if (!projectId || !taskId) return
        if (!newCommentText.trim()) {
            toast.error('Comment text is required', { position: 'top-center' })
            return
        }

        postComment({
            projectId,
            taskId,
            text: newCommentText.trim()
        },
            {
                onSuccess: () => {
                    setNewCommentText('')

                    toast.success('Comment added', { position: 'top-center' })
                },
                onError: (err) => {
                    const message = err?.response?.data?.Message || err?.response?.data?.message || err?.message || 'Failed to add comment'
                    toast.error(message, { position: 'top-center' })
                }
            })
    }

    return (
        <div className="space-y-4">
            <div>
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-secondary">Add Comment</h4>
                <div className="flex gap-2">
                    <input
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        placeholder="Write a comment"
                        className="flex-1 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-brand/40"
                    />
                    <button
                        type="button"
                        onClick={addComment}
                        disabled={postingComment}
                        className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand/90 disabled:cursor-not-allowed disabled:bg-brand/50"
                    >
                        {postingComment ? '...' : 'Post'}
                    </button>
                </div>
            </div>

            <div>
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-secondary">Comments</h4>
                {comments.length ? (
                    <ul className="space-y-3">
                        {comments.map((comment) => (
                            <CommentItem comment={comment} taskId={taskId} key={comment.id} />
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-secondary">No comments yet.</p>
                )}
            </div>
        </div>
    )
}
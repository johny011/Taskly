import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../Services/axios_api';
import useAuthStore from '../Store/useAuthStore';
import useProjectStore from '../Store/useProjectStore';
import UserImage from './UserImage';

function CommentItem({ comment, taskId }) {
    const queryClient = useQueryClient();
    const projectId = useProjectStore((state) => state.projectId);
    const user = comment?.user;
    const authenticatedUserId = useAuthStore((state) =>
         state.user?.sub ??  null
    );
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(comment?.text || '');

    const isAuthor = String(user?.id ?? '') === String(authenticatedUserId ?? '');
    const isAdmin = useProjectStore((state) => state.project.role == "Manager" || state.project.role == "Owner");
    useEffect(() => {
        setEditText(comment?.text || '');
        setIsEditing(false);
    }, [comment?.id, comment?.text]);

    const { mutate: updateComment, isPending: isUpdating } = useMutation({
        mutationFn: () => {
            if (!projectId || !taskId || !comment?.id) {
                throw new Error('Comment context is missing.');
            }

            return api.put(`/Projects/${projectId}/Tasks/${taskId}/Comments/${comment.id}`, {
                text: editText.trim(),
            });
        },
        onSuccess: () => {
            toast.success('Comment updated', { position: 'top-center' });
            console.log('Invalidating taskDetails query for projectId:', projectId, 'taskId:', taskId);
            queryClient.invalidateQueries({ queryKey: ['taskDetails', Number(projectId), taskId] });
            setIsEditing(false);
        },
        onError: (error) => {
            const message =
                error?.response?.data?.message ||
                error?.response?.data?.Message ||
                error?.message ||
                'Failed to update comment';

            toast.error(message, { position: 'top-center' });
        },
    });

    const handleCancelEdit = () => {
        setEditText(comment?.text || '');
        setIsEditing(false);
    };

    const { mutate: deleteComment, isPending: isDeleting } = useMutation({
         mutationFn: () => {
            if (!projectId || !taskId || !comment?.id) {
                throw new Error('Comment context is missing.');
            }

            return api.delete(`/Projects/${projectId}/Tasks/${taskId}/Comments/${comment.id}`);
        },
        onSuccess: () => {
            toast.success('Comment deleted', { position: 'top-center' });
            queryClient.invalidateQueries({ queryKey: ['taskDetails', Number(projectId), taskId] });
            setIsEditing(false);
        },
        onError: (error) => {
            const message =
                error?.response?.data?.message ||
                error?.response?.data?.Message ||
                error?.message ||
                'Failed to delete comment';

            toast.error(message, { position: 'top-center' });
        },
    })

    return (
        <li className="rounded-lg border border-white/10 bg-black/20 p-3">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-3 text-xs font-semibold text-brand">
                        <UserImage user={user} />
                        <span className="flex flex-col gap-1">
                            {user?.fullName || user?.email || 'Unknown user'}
                            <small className="text-gray-100">{new Date(comment.createdAt).toLocaleString()}</small>
                        </span>
                    </p>

                    {isEditing ? (
                        <textarea
                            value={editText}
                            onChange={(event) => setEditText(event.target.value)}
                            rows={3}
                            className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none transition focus:border-brand/40 focus:ring-2 focus:ring-brand/20"
                            placeholder="Update your comment"
                        />
                    ) : (
                        <p className="mt-2 text-sm text-white/90">{comment?.text || '-'}</p>
                    )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    {isEditing ? (
                        <>
                            <button
                                type="button"
                                onClick={() => updateComment()}
                                disabled={isUpdating || !editText.trim()}
                                className="rounded-lg bg-brand px-2.5 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-brand/90 disabled:cursor-not-allowed disabled:bg-brand/50"
                                aria-label="Save comment"
                            >
                                {isUpdating ? 'Saving...' : 'Save'}
                            </button>
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-medium text-white transition-colors hover:border-white/20 hover:bg-white/10"
                                aria-label="Cancel comment edit"
                            >
                                Cancel
                            </button>
                        </>
                    ) : (
                        <>
                            {isAuthor && (
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(true)}
                                    className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-medium text-white transition-colors hover:border-white/20 hover:bg-white/10"
                                    aria-label="Edit comment"
                                >
                                    Edit
                                </button>
                            )}
                            {(isAuthor || isAdmin) && (
                                <button
                                onClick={deleteComment}
                                    type="button"
                                    className="rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs font-semibold text-red-200 transition-colors hover:bg-red-500/20"
                                    aria-label="Delete comment"
                                    disabled={isDeleting}
                                >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>)}
                        </>
                    )}
                </div>
            </div>
        </li>
    );
}

export default CommentItem;

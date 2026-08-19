const ACTION_STYLES = {
    // Project Actions
    PROJECT_UPDATED: {
        label: 'Project',
        badgeClass: 'border-amber-400/30 bg-amber-500/10 text-amber-200',
        iconClass: 'border-amber-400/30 bg-amber-500/10 text-amber-300',
        icon: (
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
        ),
    },

    // Member Actions
    MEMBER_ADDED: {
        label: 'Member',
        badgeClass: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
        iconClass: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300',
        icon: (
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
        ),
    },
    MEMBER_REMOVED: {
        label: 'Member',
        badgeClass: 'border-rose-400/30 bg-rose-500/10 text-rose-200',
        iconClass: 'border-rose-400/30 bg-rose-500/10 text-rose-300',
        icon: (
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
            </svg>
        ),
    },
    MEMBER_ROLE_CHANGED: {
        label: 'Role',
        badgeClass: 'border-purple-400/30 bg-purple-500/10 text-purple-200',
        iconClass: 'border-purple-400/30 bg-purple-500/10 text-purple-300',
        icon: (
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
        ),
    },

    // Task Base Actions
    TASK_CREATED: {
        label: 'Created',
        badgeClass: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
        iconClass: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300',
        icon: (
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
        ),
    },
    TASK_DELETED: {
        label: 'Deleted',
        badgeClass: 'border-rose-400/30 bg-rose-500/10 text-rose-200',
        iconClass: 'border-rose-400/30 bg-rose-500/10 text-rose-300',
        icon: (
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
        ),
    },
    TASK_DETAILS_UPDATED: {
        label: 'Updated',
        badgeClass: 'border-amber-400/30 bg-amber-500/10 text-amber-200',
        iconClass: 'border-amber-400/30 bg-amber-500/10 text-amber-300',
        icon: (
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
        ),
    },
    TASK_MOVED: {
        label: 'Moved',
        badgeClass: 'border-cyan-400/30 bg-cyan-500/10 text-cyan-200',
        iconClass: 'border-cyan-400/30 bg-cyan-500/10 text-cyan-300',
        icon: (
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
        ),
    },

    // Task Assignees
    TASK_ASSIGNEE_ADDED: {
        label: 'Assigned',
        badgeClass: 'border-brand/40 bg-brand/15 text-brand',
        iconClass: 'border-brand/40 bg-brand/15 text-brand',
        icon: (
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
        ),
    },
    TASK_ASSIGNEE_REMOVED: {
        label: 'Unassigned',
        badgeClass: 'border-rose-400/30 bg-rose-500/10 text-rose-200',
        iconClass: 'border-rose-400/30 bg-rose-500/10 text-rose-300',
        icon: (
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
            </svg>
        ),
    },

    // Task Files
    TASK_FILE_ADDED: {
        label: 'Attachment',
        badgeClass: 'border-violet-400/30 bg-violet-500/10 text-violet-200',
        iconClass: 'border-violet-400/30 bg-violet-500/10 text-violet-300',
        icon: (
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
        ),
    },
    TASK_FILE_DELETED: {
        label: 'Attachment',
        badgeClass: 'border-rose-400/30 bg-rose-500/10 text-rose-200',
        iconClass: 'border-rose-400/30 bg-rose-500/10 text-rose-300',
        icon: (
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
        ),
    },

    // Task Comments
    TASK_COMMENT_ADDED: {
        label: 'Comment',
        badgeClass: 'border-blue-400/30 bg-blue-500/10 text-blue-200',
        iconClass: 'border-blue-400/30 bg-blue-500/10 text-blue-300',
        icon: (
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-4 4v-4z" />
            </svg>
        ),
    },
    TASK_COMMENT_UPDATED: {
        label: 'Comment',
        badgeClass: 'border-amber-400/30 bg-amber-500/10 text-amber-200',
        iconClass: 'border-amber-400/30 bg-amber-500/10 text-amber-300',
        icon: (
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-4 4v-4z" />
            </svg>
        ),
    },
    TASK_COMMENT_DELETED: {
        label: 'Comment',
        badgeClass: 'border-rose-400/30 bg-rose-500/10 text-rose-200',
        iconClass: 'border-rose-400/30 bg-rose-500/10 text-rose-300',
        icon: (
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-4 4v-4z" />
            </svg>
        ),
    },
};

const FALLBACK_STYLE = ACTION_STYLES.PROJECT_UPDATED;

const getInitials = (name) => {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return parts[0][0]?.toUpperCase() || '??';
};

const formatRelativeTime = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const diffMs = date.getTime() - Date.now();
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

    if (Math.abs(diffMs) < hour) return rtf.format(Math.round(diffMs / minute), 'minute');
    if (Math.abs(diffMs) < day) return rtf.format(Math.round(diffMs / hour), 'hour');
    return rtf.format(Math.round(diffMs / day), 'day');
};

function ActivityItem({ activity, isLast = false }) {
    const action = ACTION_STYLES[activity.actionType] || FALLBACK_STYLE;
    const actorName = activity.actorName || 'Unknown user';

    const apiHost = import.meta.env.VITE_API_HOST || '';
    const avatarSrc = activity.actorAvatar
        ? activity.actorAvatar.startsWith('http')
            ? activity.actorAvatar
            : `${apiHost}/${activity.actorAvatar}`
        : '';

    const relativeTime = formatRelativeTime(activity.createdAt);
    function getActionLabel(){
        switch(activity.actionType){
            case "MEMBER_ADDED":
                return `add a member ${activity.properties?.MemberName}`;
            case "MEMBER_REMOVED":
                return `remove a member ${activity.properties?.MemberName}`;
            case "TASK_ASSIGNEE_ADDED":
                return `assign  task "${activity.properties?.TaskTitle}" to ${activity.properties?.MemberName}`; ;
            case "TASK_ASSIGNEE_REMOVED":
                return `unassigne task "${activity.properties?.TaskTitle}" from ${activity.properties?.MemberName}`; ;
            case "MEMBER_ROLE_CHANGED":
                return `change role of ${activity.properties?.MemberName} to ${activity.properties?.NewRole}`; ;
            case "PROJECT_UPDATED":
                return `update project "${activity.properties?.Title}"`;
            case "TASK_COMMENT_ADDED":
                return `add a comment "${activity.properties?.CommentText}" to task "${activity.properties?.TaskTitle}" `;
            case "TASK_COMMENT_DELETED":
                return `delete a comment "${activity.properties?.CommentText}" from task "${activity.properties?.TaskTitle}" `;
            case "TASK_CREATED":
                return `create a task "${activity.properties?.TaskTitle}"`;
            case "TASK_DELETED":
                return `delete a task "${activity.properties?.TaskTitle}"`;
            case "TASK_FILE_ADDED":
                return `add a file "${activity.properties?.FileName}" to task "${activity.properties?.TaskTitle}"`;
            case "TASK_FILE_DELETED":
                return `delete a file "${activity.properties?.FileName}" from task "${activity.properties?.TaskTitle}"`;
            case "TASK_MOVED":
                return `move the task "${activity.properties?.TaskTitle}" to "${activity.properties?.NewStatus}"`;
            case "TASK_DETAILS_UPDATED":
                return `updated a task "${activity.properties?.TaskTitle}" `;
            default:
                return "perform an action";
        }
    }
    return (
        <li className="relative pl-14">
            {!isLast ? <span className="absolute left-6 top-12 bottom-0 w-px bg-white/10" aria-hidden /> : null}

            <div className={`absolute left-2 top-1.5 flex h-8 w-8 items-center justify-center rounded-lg border ${action.iconClass}`}>
                {action.icon}
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-4 transition-colors hover:border-brand/30 hover:bg-white/5">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                        {avatarSrc ? (
                            <img
                                src={avatarSrc}
                                alt={actorName}
                                className="h-10 w-10 shrink-0 rounded-xl object-cover"
                            />
                        ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-sm font-bold text-white shadow-lg shadow-brand/20">
                                {getInitials(actorName)}
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="text-sm leading-relaxed text-white">
                                <span className="font-semibold text-brand">{actorName}</span>{' '}
                                <span className="text-white/90">{getActionLabel()}</span>{' '}
                            </p>
                            <p className="mt-1 text-xs text-secondary">{relativeTime}</p>
                        </div>
                    </div>

                    <span className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${action.badgeClass}`}>
                        {action.label}
                    </span>
                </div>
            </div>
        </li>
    );
}

export default ActivityItem;
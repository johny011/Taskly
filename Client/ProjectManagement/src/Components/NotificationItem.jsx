import React from 'react'
import { useReadNotification } from './hooks/useNotifications'
import { useTaskDetailsModal } from '../Store/useTaskDetailsModal'
import useNotificationStore from '../Store/useNotificationStore'
// خريطة تحويل أنواع الإشعارات الرقمية إلى نصوص (في حال كان الـ API يرجع Enum كـ Int)
const NOTIFICATION_TYPES = {
    0: 'PROJECT_UPDATED',
    1: 'PROJECT_INVITATION',
    2: 'PROJECT_REMOVAL',
    3: 'MEMBER_ROLE_UPDATED',
    4: 'TASK_CREATED',
    5: 'TASK_DELETED',
    6: 'TASK_UPDATED',
    7: 'TASK_MOVED',
    8: 'TASK_ASSIGNED',
    9: 'TASK_UNASSIGNED',
    10: 'TASK_COMMENT_ADDED',
    11: 'TASK_COMMENT_UPDATED',
    12: 'TASK_COMMENT_DELETED'
}

export default function NotificationItem({ notification, onRead }) {
    // دمج الحالات سواء كانت string أو number
    const typeStr = typeof notification.notificationType === 'number'
        ? NOTIFICATION_TYPES[notification.notificationType]
        : notification.notificationType

    const formatDate = (value) => {
        if (!value) return ''
        const date = new Date(value)
        if (Number.isNaN(date.getTime())) return ''
        return new Intl.DateTimeFormat('en-EG', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date)
    }

    const renderNotificationContent = () => {
        switch (typeStr) {

            case 'TASK_CREATED': {
                const props = notification.activity?.properties;
                const taskTitle = props?.TaskTitle || props?.taskTitle;

                return {
                    icon: (
                        // أيقونة إضافة (+) باللون الأخضر
                        <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    ),
                    title: 'New Task Created',
                    body: notification.message || (
                        taskTitle
                            ? `Task "${taskTitle}" was created in project ` + (notification.activity?.projectTitle || '')
                            : 'A new task was created in project ' + (notification.activity?.projectTitle || '')
                    )
                };
            }

            case 'TASK_DELETED': {
                const props = notification.activity?.properties;
                const taskTitle = props?.TaskTitle || props?.taskTitle;

                return {
                    icon: (
                        // أيقونة الحذف (Trash) باللون الأحمر الوردي
                        <svg className="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    ),
                    title: 'Task Deleted',
                    body: notification.message || (
                        taskTitle
                            ? `Task "${taskTitle}" was deleted from project ` + (notification.activity?.projectTitle || '')
                            : 'A task was deleted from project ' + (notification.activity?.projectTitle || '')
                    )
                };
            }

            case 'TASK_UPDATED': {
                const props = notification.activity?.properties;
                const taskTitle = props?.TaskTitle || props?.taskTitle;

                return {
                    icon: (
                        // أيقونة التعديل باللون البرتقالي/الذهبي
                        <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    ),
                    title: 'Task Updated',
                    body: notification.message || (
                        taskTitle
                            ? `Task "${taskTitle}" was updated in project ` + (notification.activity?.projectTitle || '')
                            : 'A task was updated in project ' + (notification.activity?.projectTitle || '')
                    )
                };
            }

            case 'TASK_ASSIGNED':
                return {
                    icon: (
                        <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    ),
                    title: 'New task assigned to you',
                    body: notification.message || 'A new task has been assigned to you in project ' + (notification.activity?.projectTitle || '')
                }
            case 'TASK_UNASSIGNED':
                return {
                    icon: (
                        <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M15 13H9" />
                        </svg>
                    ),
                    title: 'Unassigned from task',
                    body: notification.message || 'You have been unassigned from a task in project ' + (notification.activity?.projectTitle || '')
                }

            case 'MEMBER_ROLE_UPDATED': {
                const props = notification.activity?.properties;

                const newRole = props?.NewRole || props?.newRole || props?.Role || props?.role;

                // 3. التحقق مما إذا كانت ترقية لـ Manager
                const isPromoted = newRole?.toLowerCase() === 'manager';

                return {
                    icon: isPromoted ? (
                        // أيقونة الترقية باللون الأخضر
                        <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    ) : (
                        // أيقونة التعديل/التخفيض باللون البرتقالي
                        <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
                        </svg>
                    ),
                    title: isPromoted ? 'Role Promoted' : 'Role Updated',
                    body: notification.message || (
                        isPromoted
                            ? 'You have been promoted to Manager in project ' + (notification.activity?.projectTitle || '')
                            : `Your role has been changed to ${newRole || 'a new role'} in project ` + (notification.activity?.projectTitle || '')
                    )
                };
            }



            case 'PROJECT_INVITATION':
                return {
                    icon: (
                        <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                    ),
                    title: 'Project invitation',
                    body: `You have been added as a member to project ${notification.activity?.projectTitle} by ${notification.activity?.actor.fullName}`
                }
            case 'PROJECT_REMOVAL':
                return {
                    icon: (
                        <svg className="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM16 12h6" />
                        </svg>
                    ),
                    title: 'Removed from project',
                    body: notification.message || 'You have been removed from project ' + (notification.activity?.projectTitle || '')
                }

            case 'PROJECT_UPDATED': {
                return {
                    icon: (
                        <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    ),
                    title: 'Project Updated',
                    body: `Project ${notification.activity?.properties.Title} details have been updated `
                };
            }

            case 'TASK_MOVED': {
                const props = notification.activity?.properties;
                const newStatus = props?.NewStatus || props?.newStatus;

                return {
                    icon: (
                        <svg className="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                    ),
                    title: 'Task Moved',
                    body: notification.message || (
                        newStatus
                            ? `A task was moved to "${newStatus}" in project ` + (notification.activity?.projectTitle || '')
                            : 'A task was moved in project ' + (notification.activity?.projectTitle || '')
                    )
                };
            }
            case 'TASK_COMMENT_ADDED': {
                const props = notification.activity?.properties;
                const taskTitle = props?.TaskTitle || props?.taskTitle;

                return {
                    icon: (
                        <svg className="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    ),
                    title: 'New Comment',
                    body: notification.message || (
                        taskTitle
                            ? `A new comment was added to "${taskTitle}" in project ` + (notification.activity?.projectTitle || '')
                            : 'A new comment was added to a task in project ' + (notification.activity?.projectTitle || '')
                    )
                };
            }

            case 'TASK_COMMENT_UPDATED': {
                const props = notification.activity?.properties;
                const taskTitle = props?.TaskTitle || props?.taskTitle;

                return {
                    icon: (
                        <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    ),
                    title: 'Comment Updated',
                    body: notification.message || (
                        taskTitle
                            ? `A comment was updated on "${taskTitle}" in project ` + (notification.activity?.projectTitle || '')
                            : 'A comment was updated on a task in project ' + (notification.activity?.projectTitle || '')
                    )
                };
            }
            case 'TASK_COMMENT_DELETED': {
                const props = notification.activity?.properties;
                const taskTitle = props?.TaskTitle || props?.taskTitle;

                return {
                    icon: (
                        <svg className="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    ),
                    title: 'Comment Deleted',
                    body: notification.message || (
                        taskTitle
                            ? `A comment was deleted from "${taskTitle}" in project ` + (notification.activity?.projectTitle || '')
                            : 'A comment was deleted from a task in project ' + (notification.activity?.projectTitle || '')
                    )
                };
            }

            case 'TASK_FILE_ADDED': {
                const props = notification.activity?.properties;
                const taskTitle = props?.TaskTitle || props?.taskTitle;

                return {
                    icon: (
                        // أيقونة المرفقات (Paperclip) باللون البنفسجي
                        <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                    ),
                    title: 'File Attached',
                    body: notification.message || (
                        taskTitle
                            ? `A new file was attached to "${taskTitle}" in project ` + (notification.activity?.projectTitle || '')
                            : 'A new file was attached to a task in project ' + (notification.activity?.projectTitle || '')
                    )
                };
            }

            case 'TASK_FILE_DELETED': {
                const props = notification.activity?.properties;
                const taskTitle = props?.TaskTitle || props?.taskTitle;

                return {
                    icon: (
                        <svg className="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    ),
                    title: 'File Removed',
                    body: notification.message || (
                        taskTitle
                            ? `A file was removed from "${taskTitle}" in project ` + (notification.activity?.projectTitle || '')
                            : 'A file was removed from a task in project ' + (notification.activity?.projectTitle || '')
                    )
                };
            }
        }
    }

    const content = renderNotificationContent()
    const { mutate: markAsRead } = useReadNotification();
    function clickEvent() {
        markAsRead(notification.userNotificationId, {
            onSuccess: () => {
                onRead(notification.userNotificationId);
                if (typeStr === 'PROJECT_INVITATION' ||
                    typeStr === 'PROJECT_UPDATED' ||
                    typeStr === 'TASK_MOVED' ||
                    typeStr === "MEMBER_ROLE_UPDATED"
                ) {
                    navigation.navigate(`/projects/${notification.activity?.projectId}`);
                }
                else if (typeStr === 'TASK_ASSIGNED' ||
                    typeStr === 'TASK_CREATED' ||
                    typeStr === "TASK_UPDATED" ||
                    typeStr === "TASK_COMMENT_ADDED" ||
                    typeStr === "TASK_COMMENT_UPDATED" ||
                    typeStr === "TASK_COMMENT_DELETED" ||
                    typeStr === "TASK_FILE_ADDED" ||
                    typeStr === "TASK_FILE_DELETED"
                ) {
                    navigation.navigate(`/projects/${notification.activity?.projectId}?taskId=${notification.activity.entityId}`);
                }

            }
        });
    }

    return (
        <li
            onClick={clickEvent}
            className={`px-5 py-4 transition-colors cursor-pointer hover:bg-white/5 ${notification.isRead ? 'bg-transparent opacity-75' : 'bg-brand/5'
                }`}
        >
            <div className="flex gap-3 items-start">
                <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notification.isRead ? 'bg-white/20' : 'bg-brand'}`} />

                <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 shrink-0">
                    {content.icon}
                </div>

                <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-brand mb-0.5">{content.title}</p>
                    <p className="text-sm text-white line-clamp-2 leading-snug">
                        {content.body}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-slate-400">
                        <span className="truncate">{typeStr}</span>
                        <span className="shrink-0">{formatDate(notification.createdAt)}</span>
                    </div>
                </div>
            </div>
        </li>
    )
}
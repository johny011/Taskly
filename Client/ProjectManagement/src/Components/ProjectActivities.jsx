import { useQueryClient } from '@tanstack/react-query';
import useProjectStore from '../Store/useProjectStore';
import ActivityItem from './ActivityItem';
import { useProjectActivities } from './hooks/useProjectActivities';
import { useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import toast from 'react-hot-toast';

const icons ={
    back: ({ className }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
    )
}
const LoadingList = () => (

    <ul className="space-y-4">
        {[1, 2, 3, 4].map((item, index, arr) => (
            <li key={item} className="relative animate-pulse pl-14">
                {index < arr.length - 1 ? (
                    <span className="absolute left-6 top-12 bottom-0 w-px bg-white/10" aria-hidden />
                ) : null}

                <span className="absolute left-2 top-1.5 h-8 w-8 rounded-lg border border-white/10 bg-white/5" />

                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                            <div className="h-10 w-10 shrink-0 rounded-xl bg-white/10" />
                            <div className="min-w-0 flex-1 space-y-2 pt-0.5">
                                <div className="h-3.5 w-56 max-w-full rounded bg-white/10" />
                                <div className="h-3 w-28 rounded bg-white/5" />
                            </div>
                        </div>
                        <div className="h-5 w-16 rounded-full bg-white/10" />
                    </div>
                </div>
            </li>
        ))}
    </ul>
);

export default function ProjectActivities() {
    const { id } = useParams();
    const { data: activities = [], isLoading, error,isError } = useProjectActivities(id);
    useEffect(() => {
        if(error?.status == 403)
        {
            toast.error(`You don't have access for this page`);
            setTimeout(()=>{
                navigation.navigate('/');
            },2000);
            
        }
    },[error]);
    const queryClient = useQueryClient();
    useEffect(() => {
        const connection = new HubConnectionBuilder()
            .withUrl(import.meta.env.VITE_HUB_URL + '/activity')
            .configureLogging(LogLevel.Information)
            .withAutomaticReconnect()
            .build();

        async function startConnection() {
            try {
                
                await connection.start();
                await connection.invoke('JoinActivityGroup', `${id}`);

                connection.on('ProjectMembersUpdated', () => {
                    queryClient.invalidateQueries(['project-activities', id]);
                });

                connection.on('TaskMembersUpdated', () => {
                    queryClient.invalidateQueries(['project-activities', id]);
                });

                connection.on('ProjectDetailsUpdated', () => {
                    queryClient.invalidateQueries(['project-activities', id]);
                });

                connection.on('TaskUpdated', () => {
                    queryClient.invalidateQueries(['project-activities', id]);
                });

                connection.on('TaskDeleted', () => {
                    queryClient.invalidateQueries(['project-activities', id]);
                });

                connection.on('TaskAdded', () => {
                    queryClient.invalidateQueries(['project-activities', id]);
                });


            } catch (err) {
                console.error('SignalR Connection or Invoke failed: ', err);
            }
        }

        startConnection();

        return () => {
            async function stopConnection() {
                if (connection.state === "Connected") {
                    try {
                        await connection.invoke('LeaveActivityGroup', `${id}`);
                    } catch (err) {
                        console.error('Failed to leave group:', err);
                    }
                }
                await connection.stop();
                console.log('SignalR Disconnected.');
            }
            stopConnection();
        };

    }, [id]);

    if (isLoading) return <LoadingList />;

    if (isError) {
        return (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-center text-sm text-rose-300">
                Failed to load project activities. Please try refreshing.
            </div>
        );
    }

    if (!activities.length) {
        return (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02] px-6 py-12 text-center">
                <div className="mb-4 rounded-2xl bg-white/5 p-4">
                    <svg className="h-10 w-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2m-5-8h5m0 0v5m0-5L10 16" />
                    </svg>
                </div>
                <p className="text-lg font-semibold text-white">No activity yet</p>
                <p className="mt-2 max-w-xs text-sm text-secondary">
                    Activity updates will appear here when members create tasks, comment, or upload files.
                </p>
            </div>
        );
    }

    return (
        <>
        <div className="flex flex-row justify-between my-4">
            <div className="flex flex-wrap items-center gap-4">
                            <h1 className="text-3xl font-bold text-white tracking-tight">
                                Activities
                            </h1>

                        </div>
            <button
                type="button"
                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-secondary backdrop-blur-md transition-colors hover:border-brand/30 hover:text-white"
                            title="Project settings"
                            aria-label="Project settings"
                            onClick={()=>navigation.navigate(`/projects/${id}`)}
                            >
                                <icons.back className="w-4 h-4 shrink-0" />
                            Back to Project
            </button>
        </div>
        <ul className="space-y-4">
            {activities.map((activity, index) => (
                <ActivityItem
                    key={activity.id || `${activity.entityId || 'activity'}-${index}`}
                    activity={activity}
                    isLast={index === activities.length - 1}
                />
            ))}
        </ul>
        </>
    );
}
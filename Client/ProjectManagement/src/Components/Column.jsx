import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskItem from './TaskItem';
import { useDroppable } from '@dnd-kit/core';

export default function Column({ status, tasks }) {
    const { setNodeRef } = useDroppable({
        id: status
    })

    return (
        <section className='rounded-3xl border border-white/5 bg-white/2 p-4' ref={setNodeRef}>
            <div className='flex items-center justify-between gap-2'>
                <h2 className='text-md font-medium tracking-wide'>{status.toUpperCase()}</h2>
                <span className='rounded-full border border-white/10 bg-white/6 px-2 py-0.5 text-xs text-secondary'>
                    {tasks.length}
                </span>
            </div>
            <ul className='my-2 flex flex-col gap-2'>
                <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
                    {tasks.map(task => (
                        <TaskItem key={task.id} task={task} />
                    ))}
                </SortableContext>
            </ul>
        </section>

    )
}
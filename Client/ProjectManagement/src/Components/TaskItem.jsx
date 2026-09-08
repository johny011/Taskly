// Components/TaskItem.jsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import TaskDetailsModal from './TaskDetailsModal';
import { useTaskDetailsModal } from '../Store/useTaskDetailsModal';
import useProjectStore from '../Store/useProjectStore';

export default function TaskItem({ task }) {
    // const [open, setOpen] = useState(false);
    const canManage = useProjectStore((state)=>state.project.role == "Manager" || state.project.role == "Owner");
    const { id: projectId } = useParams();
    const openTaskDetailsModal = ()=>{
        useTaskDetailsModal.getState().openModal(task.id, Number(projectId),task.text,task.status);
    }
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id,disabled:!canManage });

    const style = {
        transform: CSS.Translate.toString(transform), // أهم تغيير
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    return (
        <>
            <li
                ref={setNodeRef}
                style={style}
                {...attributes}
                {...listeners}
                className="p-3 mb-2 bg-white/5 rounded-lg border border-white/10 cursor-pointer"
                onClick={ canManage || task.status =="InProgress" ?openTaskDetailsModal:null}
            >
                {task.text}
            </li>

            {/* {open ? (
                <TaskDetailsModal
                    projectId={projectId}
                    taskId={task.id}
                    taskText={task.text}
                    onClose={() => setOpen(false)}
                />
            ) : null} */}
        </>
    );
}
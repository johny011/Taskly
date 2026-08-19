// Components/Tasks.jsx
import {
    DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
    pointerWithin, rectIntersection, getFirstCollision
} from '@dnd-kit/core';
import { useCallback, useEffect, useState } from 'react';
import Column from './Column';
import { TASK_COLUMN_IDS, useTaskStore } from '../Store/useTaskStore';
import api from '../Services/axios_api';
import { useParams } from 'react-router-dom';

const Tasks = () => {
    const { tasks, reorderTasksOnDragOver, buildReorderCommand, setTasks, fetchTasks } = useTaskStore();
    const [activeTask, setActiveTask] = useState(null);
    const [snapshot, setSnapshot] = useState(null);

    const sensors = useSensors(useSensor(PointerSensor, {
        activationConstraint: { distance: 8 }
    }));
    const { id } = useParams();
    // استراتيجية مخصصة للكانبان: ابحث عن العناصر أولاً ثم الأعمدة
    const collisionDetectionStrategy = useCallback((args) => {
        const pointerCollisions = pointerWithin(args);
        if (pointerCollisions.length > 0) return pointerCollisions;

        const detections = rectIntersection(args);
        if (detections.length > 0) return detections;

        return getFirstCollision(pointerCollisions, 'id');
    }, []);

    const handleDragStart = (event) => {
        setSnapshot(tasks); // حفظ نسخة للرجوع إليها في حال الفشل
        setActiveTask(tasks.find(t => t.id === event.active.id));
    };

    const handleDragOver = (event) => {
        const { active, over } = event;
        if (!over) return;
        reorderTasksOnDragOver(active.id, over.id);
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        setActiveTask(null);

        if (!over) {
            setTasks(snapshot);
            return;
        }

        const payload = buildReorderCommand(active.id);
        try {
            console.log('Reorder payload:', payload);
            const respose = await api.patch(`/Projects/${id}/Tasks/${active.id}/reorder`, payload);
            // fetchTasks(id); // إعادة جلب المهام لتحديث الواجهة
        } catch (err) {
            setTasks(snapshot); // تراجع عن الحركة في حال الخطأ
            console.error(err);
        }
    };


    return (
        <DndContext
            sensors={sensors}
            collisionDetection={collisionDetectionStrategy}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="grid grid-cols-3 gap-4">
                {TASK_COLUMN_IDS.map(status => (
                    <Column
                        key={status}
                        status={status}
                        tasks={tasks.filter(t => t.status === status)}
                    />
                ))}
            </div>
            <DragOverlay>
                {activeTask ? <div className="p-4 bg-brand rounded-xl shadow-2xl">{activeTask.text}</div> : null}
            </DragOverlay>
        </DndContext>
    );
};

export default Tasks;   
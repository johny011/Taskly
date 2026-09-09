import React from 'react'
import Navbar from './Navbar'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useTaskDetailsModal } from '../Store/useTaskDetailsModal'
import TaskDetailsModal from './TaskDetailsModal';

function Home() {
  const location = useLocation();

  // دالة بسيطة لمعرفة إذا كنا في الصفحة الرئيسية للمشاريع أم داخل مشروع معين
  const isProjectDetail = location.pathname.includes('/projects/');
  const isTaskDetailsOpened = useTaskDetailsModal((state)=>state.isOpen); // تحقق مما إذا كان مودال تفاصيل المهمة مفتوحًا
  const closeTaskDetailsModal = useTaskDetailsModal((state)=>state.closeModal); // دالة لإغلاق المودال
  const projectId = useTaskDetailsModal((state)=>state.projectId); // الحصول على معرف المشروع من المودال
  const taskId = useTaskDetailsModal((state)=>state.taskId); // الحصول على معرف المهمة من المودال
  const taskText = useTaskDetailsModal((state)=>state.taskText); // الحصول على نص المهمة من المودال
  return (
    <>
      <div className='min-h-screen bg-slate-950 relative font-sans text-white'>
        {/* لمسات الإضاءة الخلفية (AMOLED Blobs) لتستمر عبر كل الصفحات */}
        <div className="pointer-events-none absolute top-0 left-1/4  h-96 bg-brand/5 rounded-full blur-[120px]"></div>
        <div className="pointer-events-none absolute bottom-0 right-1/4 w-96 h-96 bg-brand/5 rounded-full blur-[120px]"></div>

        <Navbar />

        <div className='z-10 mx-auto max-w-7xl px-6'>
          {/* Breadcrumb محسن */}
          <nav className='flex py-4' aria-label="Breadcrumb">
            <ol className='inline-flex items-center space-x-2 text-sm font-medium'>
              <li>
                <Link to="/" className='text-secondary hover:text-white transition-colors'>
                  Dashboard
                </Link>
              </li>

              {/* يظهر الجزء الثاني فقط إذا كنا داخل تفاصيل مشروع */}
              {isProjectDetail && (
                <li className='flex items-center gap-2'>
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-slate-600">
                    <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                  </svg>
                  <span className='text-brand font-semibold'>Project Details</span>
                </li>
              )}
            </ol>
          </nav>

          {/* هنا تظهر محتويات Projects أو Project */}
          <main className="mt-2">
            <Outlet />
          </main>
        </div>
        {isTaskDetailsOpened ? (
          <TaskDetailsModal
            projectId={projectId}
            taskId={taskId}
            taskText={taskText}
            onClose={closeTaskDetailsModal}
          />) : null}
      </div>


    </>
  )
}

export default Home

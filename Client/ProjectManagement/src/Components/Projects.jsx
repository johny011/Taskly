import { useState } from 'react';
import ProjectCard from './ProjectCard';
import CreateProjectModal from './CreateProjectModal';
import { useProjects } from './hooks/useProjects';
import { useSearchParams } from 'react-router-dom';

function Projects() {

    const [searchParams] = useSearchParams();
    const searchTerm = searchParams.get("search") || "";
    const { data: projects, isLoading: loading, error } = useProjects(searchTerm);
    const [modalState, setModalState] = useState(false);

    const renderSkeletons = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
                <div
                    key={i}
                    className="bg-white/5 p-6 rounded-2xl border border-white/10 animate-pulse"
                >
                    <div className="h-6 bg-white/10 rounded-lg w-3/4 mb-4" />
                    <div className="h-4 bg-white/5 rounded-lg w-full mb-2" />
                    <div className="h-4 bg-white/5 rounded-lg w-5/6 mb-6" />
                    <div className="flex items-center justify-between mt-4">
                        <div className="flex -space-x-2">
                            <div className="h-8 w-8 rounded-full bg-white/10 border border-slate-950" />
                            <div className="h-8 w-8 rounded-full bg-white/10 border border-slate-950" />
                        </div>
                        <div className="h-4 w-16 bg-white/10 rounded-lg" />
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className=" mx-auto  py-8 min-h-screen">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        {/* Custom SVG Grid Icon */}
                        <svg className="text-brand w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
                        </svg>
                        My Projects
                    </h1>
                    <p className="text-secondary text-sm mt-2 font-medium">
                        Manage and monitor your ongoing development projects.
                    </p>
                </div>

                <button
                    className="flex items-center justify-center gap-2 py-3 px-6 bg-brand text-white font-bold rounded-xl hover:bg-brand/90 transition-all active:scale-95 shadow-lg shadow-brand/20"
                    onClick={() => setModalState(true)}
                >
                    {/* Custom SVG Plus Icon */}
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path>
                    </svg>
                    Create new project
                </button>
            </div>

            {/* Content Area */}
            <div className="relative">
                {loading ? (
                    renderSkeletons()
                ) : projects?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map(item => (
                            <ProjectCard
                                key={item.id}
                                id={item.id}
                                title={item.title}
                                description={item.description}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-white/5 rounded-[2rem] bg-white/[0.02]">
                        <div className="bg-white/5 p-5 rounded-2xl mb-5 shadow-inner">
                             <svg className="w-12 h-12 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2 tracking-tight">No projects yet</h3>
                        <p className="text-secondary text-sm mb-8 max-w-[240px] text-center">Your project list is empty. Start by creating your first workspace.</p>
                        <button 
                            onClick={() => setModalState(true)}
                            className="text-brand hover:text-brand/80 font-bold transition-colors flex items-center gap-2 group"
                        >
                            Create Project
                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </button>
                    </div>
                )}
            </div>

            {modalState && (
                <CreateProjectModal
                    setModalState={setModalState}
                />
            )}
        </div>
    );
}

export default Projects;
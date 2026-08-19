import React from 'react'
import { Link } from 'react-router-dom'

function ProjectCard({ id, title, description, members = [] }) {
    return (
        <div className="group relative bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 hover:border-brand/50 hover:bg-white/[0.08] transition-all duration-300 shadow-lg hover:shadow-brand/5 cursor-pointer flex flex-col justify-between h-full">
            
            <div>
                {/* عنوان المشروع */}
                <h3 className="font-bold text-lg text-white group-hover:text-brand transition-colors duration-300 tracking-tight">
                    {title}
                </h3>
                
                {/* الوصف مع تحديد عدد الأسطر */}
                <p className="text-secondary text-sm mt-2 line-clamp-2 leading-relaxed">
                    {description || "No description provided for this project."}
                </p>
            </div>

            <div className="mt-8">
                {/* الخط الفاصل الخفيف */}
                <div className="w-full h-[1px] bg-white/10 mb-5"></div>

                <div className="flex items-center justify-between">
                    {/* قسم أعضاء المشروع - يظهر فقط إذا كان هناك أعضاء */}
                    <div className="flex -space-x-2">
                        {members.length > 0 ? (
                            members.slice(0, 3).map((member, index) => (
                                <div 
                                    key={index}
                                    className="h-8 w-8 rounded-full border-2 border-slate-950 bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden"
                                >
                                    {member.image ? <img src={member.image} alt="member" /> : "U"}
                                </div>
                            ))
                        ) : (
                            // حالة افتراضية أنيقة إذا لم يوجد أعضاء حالياً
                            <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                                <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                        )}
                        {members.length > 3 && (
                            <div className="h-8 w-8 rounded-full border-2 border-slate-950 bg-brand/20 flex items-center justify-center text-[10px] font-bold text-brand">
                                +{members.length - 3}
                            </div>
                        )}
                    </div>

                    {/* زر الفتح */}
                    <Link 
                        to={`projects/${id}`} 
                        className="flex items-center gap-2 text-xs font-bold text-brand group/btn"
                    >
                        <span className="group-hover/btn:mr-1 transition-all">View Project</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-3.75 3.75M21 12H3" />
                        </svg>
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default ProjectCard
// import React from 'react'
// import { Link } from 'react-router-dom'

// function ProjectCard({id,title,description}) {
//     return (
//         <>
//             <div className="bg-dark2 p-6 rounded-xl shadow-sm border  hover:border-purple-600 transition-colors border-gray-400 hover:shadow-md cursor-pointer group">

//                 <h3 className="font-semibold text-lg text-purple-200">{title}</h3>
//                 <p className="text-purple-300 text-sm mt-1 mb-4 line-clamp-2">{description}</p>
//                 <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-400">
//                     <div className="flex -space-x-2">
//                         <div className="h-8 w-8 rounded-full border-2 border-white bg-slate-200"></div>
//                         <div className="h-8 w-8 rounded-full border-2 border-white bg-slate-300"></div>
//                     </div>
//                     <Link to={`projects/${id}`} className="text-xs flex flex-row items-center gap-3 text-purple-600 transition-all hover:-translate-y-0.5">
//                         Open
//                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
//                             <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
//                         </svg>

//                     </Link>
//                 </div>
//             </div>
//         </>
//     )
// }

// export default ProjectCard
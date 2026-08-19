import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useCreateProject } from './hooks/useCreateProject';
import FormInput from './InputField';

const CreateProjectModal = ({ setModalState }) => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const { mutate: createProject, isPending: loading } = useCreateProject();

    const onSubmit = async (data) => {
        console.log("submit : ",data);
        createProject(data, {
            onSuccess: () => {
                setModalState(false);
                toast.success('Project created successfully', {
                    duration: 4000,
                    position: 'top-center'
                });
            },
            onError: (error) => {
                console.error(error);
            }
        });
    };

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 backdrop-blur-md font-sans"
            onClick={() => setModalState(false)}
        >
            <div
                className="relative w-full max-w-md animate-modal-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bg-slate-900/90 backdrop-blur-2xl rounded-3xl p-8 border border-white/10">
                    <div className="text-center mb-10">
                        <h1 className="text-2xl font-bold text-white tracking-tight">Create New Project</h1>
                        <p className="text-secondary text-sm mt-1">Describe your project and get started</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <FormInput
                            label="Project Title"
                            name="title"
                            register={register}
                            errors={errors}
                            validation={{
                                required: 'Title is required',
                                minLength: { value: 5, message: 'Min 5 chars' }
                            }}
                            placeholder="Enter project title"
                        />

                        <FormInput
                            label="Description"
                            name="description"
                            type="textarea"
                            register={register}
                            errors={errors}
                            validation={{
                                required: 'Description is required',
                                minLength: { value: 20, message: 'Min 20 chars' }
                            }}
                            placeholder="Tell us about the project..."
                            rows={5}
                        />

                        <div className="flex gap-3 mt-4">
                            <button
                                type="button"
                                onClick={() => setModalState(false)}
                                className="flex-1 py-3.5 rounded-xl font-medium text-secondary transition-colors hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 flex items-center justify-center gap-2 bg-brand text-white font-bold py-3.5 rounded-xl hover:bg-brand/90 transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                                {loading && (
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                )}
                                {loading ? 'Creating...' : 'Create Project'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateProjectModal;

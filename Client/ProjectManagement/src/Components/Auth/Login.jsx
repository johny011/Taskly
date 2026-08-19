import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useLogin } from './hooks/useLogin';
import FormInput from '../InputField';

export default function Login() {
    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: { email: '', password: '' }
    });

    const { login, loading, errorResponse } = useLogin();
    const navigate = useNavigate();

    async function onSubmit(data) {
        const { success } = await login(data);
        if (success) navigate('/');
    }

    return (
        <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center px-4 font-sans">
            {/* الخلفية AMOLED مع لمسات خفيفة - مطابقة تماماً للـ Register */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand/10 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand/10 rounded-full blur-[120px]"></div>

            <div className="relative z-10 w-full max-w-md">
                <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
                    <div className="text-center mb-10">
                        <h1 className="text-2xl font-bold text-white tracking-tight">Welcome Back</h1>
                        <p className="text-secondary text-sm mt-1">Sign in to your account</p>
                    </div>

                    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
                        {errorResponse && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
                                <p className="text-red-400 text-xs">{errorResponse || "Error occurred"}</p>
                            </div>
                        )}

                        <FormInput
                            label="Email"
                            name="email"
                            type="email"
                            register={register}
                            errors={errors}
                            validation={{ 
                                required: 'Required',
                                pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' }
                            }}
                        />

                        <FormInput
                            label="Password"
                            name="password"
                            type="password"
                            register={register}
                            errors={errors}
                            validation={{ required: 'Required' }}
                        />

                        <div className="text-right !mt-2">
                             <button type="button" className="text-xs text-secondary hover:text-white transition-colors">
                                Forgot password?
                             </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-brand text-white font-bold py-3.5 rounded-xl hover:bg-brand/90 transition-all active:scale-[0.98] disabled:opacity-50 mt-4"
                        >
                            {loading ? "Processing..." : "Login"}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-secondary text-xs">
                        Don't have an account? {' '}
                        <button onClick={() => navigate('/register')} className="text-white hover:underline font-medium">
                            Sign Up
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
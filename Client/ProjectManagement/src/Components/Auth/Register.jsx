import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useRegister } from './hooks/useRegister';
import FormInput from '../InputField';

export default function Register() {
    const { register, handleSubmit, watch, formState: { errors } } = useForm({
        defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' }
    });

    const { registerUser, isPending, error: apiErrors } = useRegister();
    const navigate = useNavigate();
    const password = watch('password');

    const onSubmit = (data) => {
        registerUser(data,{
            onError:(errors)=>{
                console.error("Registration error:", errors);   
                console.log("API Errors:", apiErrors);
            }
        });
    };

    return (
        <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center px-4 font-sans">
            {/* الخلفية AMOLED مع لمسات خفيفة */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand/10 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand/10 rounded-full blur-[120px]"></div>

            <div className="relative z-10 w-full max-w-md">
                <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
                    <div className="text-center mb-10">
                        <h1 className="text-2xl font-bold text-white tracking-tight">Create Account</h1>
                        <p className="text-secondary text-sm mt-1">Start your journey with us</p>
                    </div>

                    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
                        {apiErrors?.length >0 && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
                                {apiErrors.map((error, index) => (
                                    <p className="text-red-400 text-xs" key={index}>
                                        {error || "Error occurred"}
                                    </p>
                                ))}
                            </div>
                        )}

                        <FormInput
                            label="Full Name"
                            name="fullName"
                            register={register}
                            errors={errors}
                            validation={{ required: 'Required' }}
                        />

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
                            validation={{ required: 'Required', minLength: { value: 8, message: 'Min 8 chars' } }}
                        />

                        <FormInput
                            label="Confirm Password"
                            name="confirmPassword"
                            type="password"
                            register={register}
                            errors={errors}
                            validation={{
                                required: 'Required',
                                validate: (v) => v === password || 'No match'
                            }}
                        />

                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full bg-brand text-white font-bold py-3.5 rounded-xl hover:bg-brand/90 transition-all active:scale-[0.98] disabled:opacity-50 mt-4"
                        >
                            {isPending ? "Processing..." : "Sign Up"}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-secondary text-xs">
                        Already have an account? {' '}
                        <button onClick={() => navigate('/login')} className="text-white hover:underline font-medium">
                            Login
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
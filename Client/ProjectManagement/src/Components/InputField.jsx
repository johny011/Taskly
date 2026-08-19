// components/FormInput.jsx
export default function FormInput({ 
  label, 
  name, 
  register, 
  errors = {}, 
  type = "text", 
  validation = {}, 
  placeholder,
  rows = 5,
}) {
  const errorMessage = errors[name]?.message;
  const isTextarea = type === 'textarea';

  const fieldClassName = `block w-full rounded-xl bg-white/5 px-4 py-3 border text-white placeholder-secondary transition-all 
          hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand focus:bg-white/10
          ${errorMessage ? 'border-red-500/50 focus:border-red-500' : 'border-white/10'}${isTextarea ? ' min-h-[7rem] resize-none' : ''}`;

  return (
    <div className="w-full">
      <label className="block text-xs font-semibold uppercase tracking-wide text-secondary mb-2 ml-1">
        {label}
      </label>
      {isTextarea ? (
        <textarea
          {...register(name, validation)}
          rows={rows}
          className={fieldClassName}
          placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        />
      ) : (
        <input
          type={type}
          {...register(name, validation)}
          className={fieldClassName}
          placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        />
      )}
      
      {/* يظهر فقط في حال وجود خطأ، ليحافظ على مساحة الواجهة */}
      {errorMessage && (
        <span className="text-red-400 text-[11px] mt-1.5 ml-1 block animate-in fade-in slide-in-from-top-1">
          {errorMessage}
        </span>
      )}
    </div>
  );
}
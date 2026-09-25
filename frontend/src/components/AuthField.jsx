export default function AuthField({
  label,
  type,
  placeholder,
  name,
  value,
  onChange,
  autoComplete,
  required = false,
}) {
  return (
    <label className="auth-field">
      <span className="auth-field__label">{label}</span>
      <span className="auth-field__wrap">
        <input
          name={name}
          type={type}
          placeholder={placeholder}
          className="auth-field__input"
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          required={required}
        />
      </span>
    </label>
  )
}

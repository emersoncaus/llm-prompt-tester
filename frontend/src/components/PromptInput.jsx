export default function PromptInput({ 
  value, 
  onChange, 
  onSubmit, 
  loading, 
  disabled 
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim() && !loading) {
      onSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <label htmlFor="prompt-input" className="label text-lg">
        Digite seu Prompt
      </label>
      
      <textarea
        id="prompt-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading}
        placeholder="Aplique o modelo de prompt aqui..."
        rows={16}
        className="input resize-none disabled:bg-gray-100"
      />
      
      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-gray-500">
          {value.length} caracteres
        </span>
        
        <button
          type="submit"
          disabled={!value.trim() || loading || disabled}
          className="btn btn-primary flex items-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processando...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Enviar Prompt
            </>
          )}
        </button>
      </div>
    </form>
  );
}

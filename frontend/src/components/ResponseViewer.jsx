import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ResponseViewer({ response, loading, error }) {
  if (loading) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
          Resposta
        </h3>
        <div className="flex flex-col items-center justify-center py-12">
          <svg className="animate-spin h-12 w-12 text-primary-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Aguardando resposta do modelo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card border-red-200 bg-red-50">
        <h3 className="text-lg font-semibold text-red-800 mb-4 border-b border-red-200 pb-2">
          Erro
        </h3>
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-red-800 font-medium">Ocorreu um erro ao processar sua solicitação</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="card border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
          Resposta
        </h3>
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <p className="text-center">
            Digite um prompt e clique em "Enviar Prompt"<br />
            para ver a resposta aqui
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between border-b pb-2 mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Resposta
        </h3>
        <div className="flex gap-4 text-xs text-gray-500">
          {response.tokens_used && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              {response.tokens_used} tokens
            </span>
          )}
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {response.response_time_ms}ms
          </span>
        </div>
      </div>
      
      <div className="prose prose-slate max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {response.response_text}
        </ReactMarkdown>
      </div>
      
      <div className="mt-4 pt-4 border-t text-xs text-gray-400">
        Modelo: {response.model_id.split('/').pop()} • {new Date(response.timestamp).toLocaleString('pt-BR')}
      </div>
    </div>
  );
}

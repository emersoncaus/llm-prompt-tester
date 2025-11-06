export default function HistoryPanel({ history, onSelectHistory, onClearHistory }) {
  if (history.length === 0) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
          Histórico
        </h3>
        <div className="text-center py-8 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm">Nenhum histórico ainda</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between border-b pb-2 mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Histórico ({history.length})
        </h3>
        <button
          onClick={onClearHistory}
          className="text-xs text-red-600 hover:text-red-700 font-medium"
        >
          Limpar
        </button>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {history.slice().reverse().map((item, index) => (
          <button
            key={index}
            onClick={() => onSelectHistory(item)}
            className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors duration-150"
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-sm font-medium text-gray-700 line-clamp-1">
                {item.prompt.substring(0, 50)}...
              </p>
              <span className="text-xs text-gray-400 flex-shrink-0">
                {new Date(item.timestamp).toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="px-2 py-0.5 bg-gray-100 rounded">
                {item.model_id.split('.')[0]}
              </span>
              {item.tokens_used && (
                <span>{item.tokens_used} tokens</span>
              )}
              <span>{item.response_time_ms}ms</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

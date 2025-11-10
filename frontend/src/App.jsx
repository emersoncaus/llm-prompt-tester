import { useState } from 'react';
import ModelSelector from './components/ModelSelector';
import ParametersPanel from './components/ParametersPanel';
import PromptInput from './components/PromptInput';
import ResponseViewer from './components/ResponseViewer';
import HistoryPanel from './components/HistoryPanel';
import { apiService } from './services/api';

function App() {
  // State for prompt and parameters
  const [prompt, setPrompt] = useState('');
  const [context, setContext] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [topP, setTopP] = useState(0.9);

  // State for response
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // State for history
  const [history, setHistory] = useState([]);

  // Handle prompt submission
  const handleSubmit = async () => {
    if (!prompt.trim() || !selectedModel) return;

    setLoading(true);
    setError(null);

    try {
      // Concatenar o contexto ao prompt se fornecido
      let finalPrompt = prompt;
      if (context.trim()) {
        finalPrompt = `${prompt}\n\n---\n\nContexto:\n${context}`;
      }

      const result = await apiService.sendPrompt({
        prompt: finalPrompt,
        model_id: selectedModel,
        temperature,
        max_tokens: maxTokens,
        top_p: topP,
      });

      setResponse(result);
      
      // Add to history
      setHistory(prev => [...prev, {
        prompt,
        ...result,
      }]);

    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Erro ao processar prompt');
    } finally {
      setLoading(false);
    }
  };

  // Handle selecting from history
  const handleSelectHistory = (item) => {
    setPrompt(item.prompt);
    setResponse(item);
  };

  // Clear history
  const handleClearHistory = () => {
    if (window.confirm('Deseja realmente limpar todo o histórico?')) {
      setHistory([]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-full mx-auto px-3 sm:px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div> */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  LLM Prompt Tester
                </h1>
                {/* <p className="text-sm text-gray-500">
                  Teste prompts com AWS Bedrock
                </p> */}
              </div>
            </div>
            
            {/* <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Conectado</span>
            </div> */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-full mx-auto px-3 sm:px-4 lg:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Configuration */}
          <div className="lg:col-span-1 space-y-6">
            {/* Model Selection */}
            <div className="card">
              <ModelSelector
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                disabled={loading}
              />
            </div>

            {/* Parameters */}
            <ParametersPanel
              temperature={temperature}
              maxTokens={maxTokens}
              topP={topP}
              onTemperatureChange={setTemperature}
              onMaxTokensChange={setMaxTokens}
              onTopPChange={setTopP}
              disabled={loading}
            />

            {/* History */}
            {/* <HistoryPanel
              history={history}
              onSelectHistory={handleSelectHistory}
              onClearHistory={handleClearHistory}
            /> */}
          </div>

          {/* Right Column - Prompt and Response */}
          <div className="lg:col-span-3 space-y-6">
            {/* Prompt Input */}
            <PromptInput
              value={prompt}
              onChange={setPrompt}
              contextValue={context}
              onContextChange={setContext}
              onSubmit={handleSubmit}
              loading={loading}
              disabled={!selectedModel}
            />

            {/* Response Viewer */}
            <ResponseViewer
              response={response}
              loading={loading}
              error={error}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 text-center text-sm text-gray-500 border-t border-gray-200">

      </footer>
    </div>
  );
}

export default App;

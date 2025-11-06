import { useState, useEffect } from 'react';

export default function ModelSelector({ selectedModel, onModelChange, disabled }) {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/models');
      if (!response.ok) throw new Error('Failed to fetch models');
      const data = await response.json();
      setModels(data);
      
      // Set first model as default if none selected
      if (data.length > 0 && !selectedModel) {
        onModelChange(data[0].model_id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <label className="label">Modelo LLM</label>
        <div className="input bg-gray-100 animate-pulse">Carregando modelos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <label className="label">Modelo LLM</label>
        <div className="input bg-red-50 text-red-600">Erro: {error}</div>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor="model-select" className="label">
        Modelo LLM
      </label>
      <select
        id="model-select"
        value={selectedModel}
        onChange={(e) => onModelChange(e.target.value)}
        disabled={disabled}
        className="input disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        {models.map((model) => (
          <option key={model.model_id} value={model.model_id}>
            {model.name} ({model.provider})
          </option>
        ))}
      </select>
      
      {selectedModel && (
        <p className="text-sm text-gray-500 mt-1">
          {models.find(m => m.model_id === selectedModel)?.description}
        </p>
      )}
    </div>
  );
}

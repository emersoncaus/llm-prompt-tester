export default function ParametersPanel({ 
  temperature, 
  maxTokens, 
  topP, 
  onTemperatureChange, 
  onMaxTokensChange, 
  onTopPChange,
  disabled 
}) {
  return (
    <div className="card space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
        Parâmetros
      </h3>

      {/* Temperature */}
      <div>
        <label htmlFor="temperature" className="label">
          Temperatura: {temperature.toFixed(2)}
        </label>
        <input
          id="temperature"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={temperature}
          onChange={(e) => onTemperatureChange(parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Preciso (0)</span>
          <span>Criativo (1)</span>
        </div>
      </div>

      {/* Max Tokens */}
      <div>
        <label htmlFor="maxTokens" className="label">
          Máximo de Tokens: {maxTokens}
        </label>
        <input
          id="maxTokens"
          type="range"
          min="100"
          max="4096"
          step="100"
          value={maxTokens}
          onChange={(e) => onMaxTokensChange(parseInt(e.target.value))}
          disabled={disabled}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>100</span>
          <span>4096</span>
        </div>
      </div>

      {/* Top P */}
      <div>
        <label htmlFor="topP" className="label">
          Top P: {topP.toFixed(2)}
        </label>
        <input
          id="topP"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={topP}
          onChange={(e) => onTopPChange(parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Focado (0)</span>
          <span>Diverso (1)</span>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
        <ul className="text-xs space-y-1 ml-4 list-disc">
          <li><strong>Temperatura:</strong> Controla a aleatoriedade das respostas</li>
          <li><strong>Max Tokens:</strong> Limite de comprimento da resposta</li>
          <li><strong>Top P:</strong> Controla a diversidade de vocabulário</li>
        </ul>
      </div>
    </div>
  );
}

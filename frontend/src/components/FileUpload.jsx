import { useState, useEffect } from 'react';
import { apiService } from '../services/api';

export default function FileUpload({ onUploadSuccess, onProcessingUpdate }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [userType, setUserType] = useState(null); // 'aluno' ou 'professor'
  const [processingResult, setProcessingResult] = useState(null);
  const [includeInPrompt, setIncludeInPrompt] = useState(false);

  // Notificar o App quando processingResult ou includeInPrompt mudarem
  useEffect(() => {
    console.log('FileUpload - useEffect chamado:', { processingResult: !!processingResult, includeInPrompt });
    if (onProcessingUpdate) {
      onProcessingUpdate(processingResult, includeInPrompt);
    }
  }, [processingResult, includeInPrompt]);

  const parseCSVHeaders = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const firstLine = text.split('\n')[0];
          const headers = firstLine.split(',').map(h => h.trim().replace(/"/g, ''));
          resolve(headers);
        } catch (err) {
          reject(err);
        }
      };
      
      reader.onerror = () => reject(new Error('Erro ao ler o arquivo'));
      reader.readAsText(file);
    });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    validateAndSetFile(selectedFile);
  };

  const validateAndSetFile = async (selectedFile) => {
    setError(null);
    setSuccess(null);
    setCsvHeaders([]);
    setSelectedColumns([]);
    setProcessingResult(null); // Limpar resultado do processamento anterior
    setIncludeInPrompt(false); // Resetar checkbox

    if (selectedFile) {
      // Validate file type
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Apenas arquivos CSV são permitidos');
        setFile(null);
        return;
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (selectedFile.size > maxSize) {
        setError('Arquivo muito grande. Máximo: 10MB');
        setFile(null);
        return;
      }

      setFile(selectedFile);

      // Parse CSV headers
      try {
        const headers = await parseCSVHeaders(selectedFile);
        setCsvHeaders(headers);
        setSelectedColumns([]); // Reset selected columns
      } catch (err) {
        setError('Erro ao ler o cabeçalho do CSV');
        console.error(err);
      }
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    // Validações antes de enviar
    if (!userType) {
      setError('Por favor, selecione o tipo de usuário (Aluno ou Professor)');
      return;
    }

    if (selectedColumns.length === 0) {
      setError('Por favor, selecione pelo menos uma coluna');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);
    setProcessingResult(null);

    try {
      // 1. Upload do arquivo para S3
      const formData = new FormData();
      formData.append('file', file);

      const uploadData = await apiService.uploadFile(formData);
      setSuccess(`Arquivo "${uploadData.filename}" enviado ao S3!`);

      // 2. Chamar Lambda para processar o arquivo
      const lambdaPayload = {
        body: {
          csv_key: uploadData.filename,
          target: userType === 'aluno' ? 'alumno' : 'professor',
          columns: selectedColumns
        }
      };

      const processData = await apiService.processFile(lambdaPayload);
      
      // Exibir resultado do processamento
      // O backend já retorna apenas o 'data' do Lambda
      const resultText = typeof processData.data === 'string' 
        ? processData.data 
        : JSON.stringify(processData.data, null, 2);
      
      setProcessingResult(resultText);
      setSuccess(`Arquivo processado com sucesso!`);

      // NÃO resetar após sucesso - manter seleções para o usuário poder reenviar
      // setFile(null);
      // setCsvHeaders([]);
      // setSelectedColumns([]);
      // setUserType(null);
      // document.getElementById('file-input').value = '';
      
      // Call callback if provided
      if (onUploadSuccess) {
        onUploadSuccess({
          upload: uploadData,
          processing: processData
        });
      }

    } catch (err) {
      setError(err.message || 'Erro ao fazer upload do arquivo');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setError(null);
    setSuccess(null);
    setCsvHeaders([]);
    setSelectedColumns([]);
    setUserType(null);
    document.getElementById('file-input').value = '';
  };

  const toggleColumnSelection = (columnName) => {
    setSelectedColumns(prev => {
      if (prev.includes(columnName)) {
        return prev.filter(col => col !== columnName);
      } else {
        return [...prev, columnName];
      }
    });
  };

  const selectAllColumns = () => {
    setSelectedColumns(csvHeaders);
  };

  const deselectAllColumns = () => {
    setSelectedColumns([]);
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
        Upload CSV
      </h3>

      {/* Drag & Drop Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          id="file-input"
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          disabled={uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        <div className="pointer-events-none">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-600">
            {dragActive ? (
              <span className="font-semibold text-primary-600">Solte o arquivo aqui</span>
            ) : (
              <>
                <span className="font-semibold">Clique para selecionar</span> ou arraste um arquivo
              </>
            )}
          </p>
          <p className="mt-1 text-xs text-gray-500">Apenas arquivos CSV (máx. 10MB)</p>
        </div>
      </div>

      {/* Selected File */}
      {file && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
            </div>
            <button
              onClick={handleRemove}
              disabled={uploading}
              className="text-red-600 hover:text-red-700 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* User Type Selection */}
      {file && (
        <div className="mt-4 p-3 bg-white rounded-lg border border-gray-300">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">
            Selecione o tipo de usuário
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setUserType('aluno')}
              className={`px-3 py-2 rounded border transition-all ${
                userType === 'aluno'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className={`w-4 h-4 ${userType === 'aluno' ? 'text-primary-600' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className={`text-sm font-medium ${userType === 'aluno' ? 'text-primary-700' : 'text-gray-700'}`}>
                  Aluno
                </span>
              </div>
            </button>

            <button
              onClick={() => setUserType('professor')}
              className={`px-3 py-2 rounded border transition-all ${
                userType === 'professor'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className={`w-4 h-4 ${userType === 'professor' ? 'text-primary-600' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className={`text-sm font-medium ${userType === 'professor' ? 'text-primary-700' : 'text-gray-700'}`}>
                  Professor
                </span>
              </div>
            </button>
          </div>
          {!userType && (
            <p className="mt-2 text-xs text-amber-600">
              ⚠️ Selecione um tipo de usuário
            </p>
          )}
        </div>
      )}

      {/* CSV Headers Selection */}
      {csvHeaders.length > 0 && (
        <div className="mt-4 p-4 bg-white rounded-lg border border-gray-300">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-800">
              Selecione as Colunas ({selectedColumns.length}/{csvHeaders.length})
            </h4>
            <div className="flex gap-2">
              <button
                onClick={selectAllColumns}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                Todas
              </button>
              <span className="text-gray-400">|</span>
              <button
                onClick={deselectAllColumns}
                className="text-xs text-gray-600 hover:text-gray-700 font-medium"
              >
                Nenhuma
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {csvHeaders.map((header, index) => (
              <label
                key={index}
                className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors ${
                  selectedColumns.includes(header)
                    ? 'bg-primary-50 border-primary-300'
                    : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedColumns.includes(header)}
                  onChange={() => toggleColumnSelection(header)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 truncate" title={header}>
                  {header}
                </span>
              </label>
            ))}
          </div>

          {selectedColumns.length === 0 && (
            <p className="mt-2 text-xs text-amber-600">
              ⚠️ Nenhuma coluna selecionada
            </p>
          )}
        </div>
      )}

      {/* Upload Button */}
      {file && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="btn btn-primary w-full mt-4 flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Enviando...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              Enviar arquivo para pré-processamento
            </>
          )}
        </button>
      )}

      {/* Success Message */}
      {success && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-green-800">{success}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
        <ul className="text-xs space-y-1 ml-4 list-disc">
          <li>O arquivo será enviado para o Amazon S3 e processado por um Amazon Lambda</li>
          <li>Formatos aceitos: .csv</li>
          <li>Tamanho máximo: 10MB</li>
        </ul>
      </div>

      {/* Processing Result */}
      {processingResult && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">
            Retorno do Processamento
          </h4>
          <textarea
            value={processingResult}
            onChange={(e) => setProcessingResult(e.target.value)}
            rows={16}
            className="w-full px-3 py-2 text-sm font-mono text-gray-700 bg-white border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <label className="mt-2 flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeInPrompt}
              onChange={(e) => setIncludeInPrompt(e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">Incluir no prompt</span>
          </label>
        </div>
      )}
    </div>
  );
}

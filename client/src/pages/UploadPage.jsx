import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileUp, Loader2, UploadCloud, CheckCircle, AlertCircle, Check } from 'lucide-react';
import { api } from '../lib/api.js';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import PageTransition from '../components/ui/PageTransition.jsx';

export default function UploadPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [uploadedPath, setUploadedPath] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [error, setError] = useState('');
  const [processingState, setProcessingState] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  function showToast(message, type = 'success') {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  }

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  function handleFileChange(event) {
    const nextFile = event.target.files?.[0] || null;
    if (nextFile && nextFile.size > MAX_FILE_SIZE) {
      setFile(null);
      setUploadError('File size exceeds the 10 MB limit. Please select a smaller file.');
      return;
    }
    setFile(nextFile);
    setUploadedPath('');
    setUploadError('');
    setError('');
  }

  async function handleUploadAndProcess(event) {
    event.preventDefault();
    if (!file || !user) return;

    setUploading(true);
    setUploadError('');
    setError('');
    setProcessingState('uploading');

    try {
      // 1. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const storagePath = `${user.id}/${fileName}`;

      const { data, error: storageError } = await supabase.storage
        .from('documents')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (storageError) {
        throw storageError;
      }

      const uploadedFilePath = data.path;
      setUploadedPath(uploadedFilePath);
      showToast('Document uploaded successfully to storage', 'success');

      // 2. Generate signed URL for backend to download
      setProcessingState('extracting');
      const { data: urlData, error: urlError } = await supabase.storage
        .from('documents')
        .createSignedUrl(uploadedFilePath, 60 * 15); // Valid for 15 minutes

      if (urlError) {
        throw new Error(`Failed to generate secure URL: ${urlError.message}`);
      }

      const pdfUrl = urlData.signedUrl;

      // 3. Send to backend to save in MongoDB and extract text
      const upload = await api.uploadDocument({
        originalName: file.name,
        supabasePath: uploadedFilePath,
        pdfUrl: pdfUrl,
        size: file.size,
        mimeType: file.type
      });

      showToast('Text extracted and document saved to MongoDB', 'success');

      // 4. Run analysis
      await api.analyzeDocument(upload.document._id);
      showToast('Analysis completed successfully', 'success');
      
      setProcessingState('done');
      
      // Navigate to the analysis page
      navigate(`/app/analysis/${upload.document._id}`);
    } catch (err) {
      console.error('Upload and process error:', err);
      const errMsg = err.message || 'Unknown processing error';
      setError(errMsg);
      showToast('Processing failed, please try again', 'error');
      setProcessingState('');
      setUploadedPath('');
    } finally {
      setUploading(false);
    }
  }

  function acceptDrop(event) {
    event.preventDefault();
    setDragging(false);
    const nextFile = event.dataTransfer.files?.[0];
    if (nextFile) {
      if (nextFile.size > MAX_FILE_SIZE) {
        setFile(null);
        setUploadError('File size exceeds the 10 MB limit. Please select a smaller file.');
        return;
      }
      setFile(nextFile);
      setUploadedPath('');
      setUploadError('');
      setError('');
    }
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl relative">
        {/* Floating Toast Notification in top right */}
        {toast.show && (
          <div
            className={`fixed top-6 right-6 z-50 flex items-center gap-2 rounded-xl border px-4 py-3.5 shadow-xl transition-all duration-300 transform translate-y-0 animate-fade-in ${
              toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle size={18} className="text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle size={18} className="text-rose-500 shrink-0" />
            )}
            <span className="text-sm font-semibold tracking-wide">{toast.message}</span>
          </div>
        )}

        <div className="mb-7 animate-fade-up">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brandBlue">Upload</p>
          <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Add a legal document</h1>
          <p className="mt-2 text-slate-600">Upload to secure storage, then trigger dynamic text extraction and AI analysis.</p>
        </div>

        <Card className="p-5 sm:p-8 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div>
            <label
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={acceptDrop}
              className={`flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center transition ${
                dragging ? 'border-brandBlue bg-brandBlue/5' : 'border-slate-300 bg-slate-50/50 hover:border-brandBlue hover:bg-brandBlue/5'
              }`}
            >
              <input
                type="file"
                accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                className="sr-only"
                onChange={handleFileChange}
              />
              <div className="grid size-16 place-items-center rounded-lg bg-white shadow-sm border border-slate-100">
                {file ? <FileUp size={28} className="text-brandBlue" /> : <UploadCloud size={30} className="text-brandBlue" />}
              </div>
              <h2 className="mt-5 font-display text-2xl font-bold">{file ? file.name : 'Drop your file here'}</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
                {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB selected` : 'Choose a contract, agreement, policy, NDA, notice, or rental file.'}
              </p>
            </label>

            {/* Error alerts */}
            {uploadError && (
              <div className="mt-5 flex items-start gap-2.5 rounded-lg bg-rose-50 border border-rose-100 px-4 py-3 text-sm font-semibold text-rose-600">
                <AlertCircle size={17} className="mt-0.5 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {error && (
              <div className="mt-5 flex items-start gap-2.5 rounded-lg bg-rose-50 border border-rose-100 px-4 py-3 text-sm font-semibold text-rose-600">
                <AlertCircle size={17} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="mt-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <p className="text-sm text-slate-500">Maximum file size: 10 MB</p>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button
                  onClick={handleUploadAndProcess}
                  disabled={!file || uploading}
                  className="w-full sm:w-auto bg-brandBlue hover:bg-blue-700 shadow-sm hover:shadow transition-all text-white font-bold"
                >
                  {uploading && <Loader2 size={17} className="animate-spin" />}
                  {processingState === 'uploading'
                    ? 'Uploading to storage...'
                    : processingState === 'extracting'
                    ? 'Extracting text and analyzing...'
                    : 'Upload and Analyze'}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </PageTransition>
  );
}

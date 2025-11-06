import React, { useState, useCallback, useRef, ChangeEvent } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';

// --- Helper: File to Base64 Converter ---
const fileToBase64 = (file: File): Promise<{ base64: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve({ base64: reader.result as string, mimeType: file.type });
    reader.onerror = (error) => reject(error);
  });
};

// --- UI Components / Icons ---
const WandIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.2929 2.29289C11.6834 1.90237 12.3166 1.90237 12.7071 2.29289L14.7071 4.29289C15.0976 4.68342 15.0976 5.31658 14.7071 5.70711L10 10.4142L13.5858 14L18.2929 9.29289C18.6834 8.90237 19.3166 8.90237 19.7071 9.29289L21.7071 11.2929C22.0976 11.6834 22.0976 12.3166 21.7071 12.7071L12 22.4142L1.58579 12L7.29289 6.29289C7.68342 5.90237 8.31658 5.90237 8.70711 6.29289L10 7.58579L5.70711 11.8787C5.31658 12.2692 5.31658 12.9024 5.70711 13.2929L9.29289 16.8787C9.68342 17.2692 10.3166 17.2692 10.7071 16.8787L12 15.5858L15.2929 18.8787C15.6834 19.2692 15.6834 19.9024 15.2929 20.2929L13.2929 22.2929C12.9024 22.6834 12.2692 22.6834 11.8787 22.2929L2.29289 12.7071C1.90237 12.3166 1.90237 11.6834 2.29289 11.2929L11.2929 2.29289Z" />
  </svg>
);

const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
);

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

const PublishIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
);

const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
    </svg>
);


const Spinner: React.FC = () => (
  <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<{ base64: string; mimeType: string } | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('enhance and make crystal clear');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [urlCopied, setUrlCopied] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleReset();
      try {
        const { base64, mimeType } = await fileToBase64(file);
        setOriginalImage({ base64, mimeType });
      } catch (err) {
        setError('Failed to read the image file.');
        console.error(err);
      }
    }
  };

  const handleEditImage = useCallback(async () => {
    if (!originalImage || !prompt) {
      setError('Please upload an image and provide a prompt.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setEditedImage(null);
    setPublishedUrl(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
      const base64DataWithoutPrefix = originalImage.base64.split(',')[1];

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64DataWithoutPrefix,
                mimeType: originalImage.mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });

      const generatedPart = response.candidates?.[0]?.content?.parts?.[0];
      if (generatedPart && generatedPart.inlineData) {
        const editedBase64 = generatedPart.inlineData.data;
        const editedMimeType = generatedPart.inlineData.mimeType || 'image/png';
        setEditedImage(`data:${editedMimeType};base64,${editedBase64}`);
      } else {
        throw new Error('No image was generated. The model may have refused the request.');
      }
    } catch (err: any) {
      setError(`An error occurred: ${err.message}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [originalImage, prompt]);
  
  const handleDownload = () => {
    if (!editedImage) return;
    const link = document.createElement('a');
    link.href = editedImage;
    link.download = 'edited-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePublish = () => {
    if (!editedImage) return;
    setIsPublishing(true);
    // Simulate a network request to a hosting service
    setTimeout(() => {
        setPublishedUrl(editedImage);
        setIsPublishing(false);
    }, 1500);
  };

  const handleCopyUrl = () => {
    if (!publishedUrl) return;
    navigator.clipboard.writeText(publishedUrl).then(() => {
        setUrlCopied(true);
        setTimeout(() => setUrlCopied(false), 2000); // Reset after 2 seconds
    });
  };

  const handleReset = () => {
    setOriginalImage(null);
    setEditedImage(null);
    setIsLoading(false);
    setError(null);
    setPublishedUrl(null);
    setIsPublishing(false);
    setUrlCopied(false);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };
  
  const ImagePanel: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-lg w-full p-4 flex flex-col gap-4">
        <h2 className="text-xl font-bold text-white text-center tracking-wider">{title}</h2>
        <div className="aspect-square w-full bg-gray-900/50 rounded-lg flex items-center justify-center overflow-hidden">
            {children}
        </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-4 sm:p-6 md:p-8 flex flex-col items-center">
      <header className="w-full max-w-6xl text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
          Gemini Image Enhancer
        </h1>
        <p className="mt-2 text-lg text-gray-300">
          Transform your photos with the power of AI.
        </p>
      </header>
      
      <main className="w-full max-w-6xl flex-grow flex flex-col items-center justify-center">
        {!originalImage ? (
          <div className="w-full max-w-lg">
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" ref={fileInputRef} />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-64 border-4 border-dashed border-gray-500 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:border-purple-400 hover:text-purple-300 transition-all duration-300"
            >
              <UploadIcon className="h-16 w-16 mb-4" />
              <span className="text-xl font-semibold">Click to upload an image</span>
              <span className="mt-1 text-sm">PNG, JPG, WEBP, etc.</span>
            </button>
             {error && <p className="mt-4 text-center text-red-400">{error}</p>}
          </div>
        ) : (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Input Panel */}
            <div className="flex flex-col gap-6">
              <ImagePanel title="Original Image">
                  <img src={originalImage.base64} alt="Original user upload" className="object-contain w-full h-full" />
              </ImagePanel>
              <div className="flex flex-col gap-4">
                  <label htmlFor="prompt" className="text-lg font-medium text-gray-200">Editing Prompt:</label>
                  <textarea
                      id="prompt"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="e.g., add a retro filter, make it look like a watercolor painting"
                      className="w-full p-3 bg-gray-800/60 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-200 resize-none"
                      rows={3}
                  />
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                  <button
                      onClick={handleEditImage}
                      disabled={isLoading || !prompt}
                      className="flex-grow inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                  >
                      <WandIcon className="w-5 h-5 mr-2 -ml-1"/>
                      {isLoading ? 'Enhancing...' : 'Enhance Image'}
                  </button>
                  <button
                      onClick={handleReset}
                      className="px-6 py-3 border border-gray-600 text-base font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                  >
                      Start Over
                  </button>
              </div>
            </div>

            {/* Output Panel */}
            <div className="flex flex-col gap-4">
                <ImagePanel title="Edited Image">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center text-gray-300">
                            <Spinner />
                            <span className="mt-4 text-lg">Gemini is thinking...</span>
                        </div>
                    )}
                    {error && !isLoading && (
                        <div className="p-4 text-center text-red-400">
                            <p className="font-bold">An error occurred</p>
                            <p className="text-sm mt-2">{error}</p>
                        </div>
                    )}
                    {!isLoading && !error && editedImage && (
                        <img src={editedImage} alt="AI-edited result" className="object-contain w-full h-full" />
                    )}
                    {!isLoading && !error && !editedImage && (
                        <div className="text-center text-gray-400 p-4">
                            <p>Your enhanced image will appear here.</p>
                        </div>
                    )}
                </ImagePanel>

                {editedImage && !isLoading && !error && (
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={handleDownload}
                            className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                        >
                            <DownloadIcon className="w-5 h-5 mr-2 -ml-1" />
                            Download
                        </button>
                        <button
                            onClick={handlePublish}
                            disabled={isPublishing || !!publishedUrl}
                            className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                        >
                            <PublishIcon className="w-5 h-5 mr-2 -ml-1" />
                            {isPublishing ? 'Publishing...' : (publishedUrl ? 'Published!' : 'Publish')}
                        </button>
                    </div>
                )}
                {publishedUrl && (
                    <div className="relative flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-300">Shareable URL:</label>
                        <div className="flex">
                            <input
                                type="text"
                                readOnly
                                value={publishedUrl}
                                className="flex-grow bg-gray-800/60 border border-gray-600 rounded-l-lg p-2 text-sm text-gray-300 truncate"
                            />
                            <button
                                onClick={handleCopyUrl}
                                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-lg shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                            >
                                <CopyIcon className="w-4 h-4 mr-2"/>
                                {urlCopied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;

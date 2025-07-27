
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { toBase64 } from './utils/audio';
import InputTabs from './components/InputTabs';
import InputMethod from './components/InputMethod';
import TranslationForm from './components/TranslationForm';
import TranslationResult from './components/TranslationResult';
import ThemeToggle from './components/ThemeToggle';
import Spinner from './components/Spinner';

// Add this before the component
declare global {
    interface Window {
        VANTA: any;
    }
}

// Initialize the GoogleGenAI client once.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Normalizes a string by removing diacritical marks.
 * e.g., "crème brûlée" -> "creme brulee"
 */
const removeDiacritics = (str: string): string => {
    if (!str) return '';
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

const getInitialTheme = (): 'light' | 'dark' => {
    if (typeof window !== 'undefined') {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light' || savedTheme === 'dark') {
            return savedTheme;
        }
    }
    return 'dark'; // Default theme
};


const App = () => {
    const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);
    const [vantaEffect, setVantaEffect] = useState(null);
    const [textToSynthesize, setTextToSynthesize] = useState("");
    const [translatedText, setTranslatedText] = useState("");
    const [latinScriptText, setLatinScriptText] = useState("");
    const [isLoading, setIsLoading] = useState(true); // Start in loading state for data fetch
    const [loadingText, setLoadingText] = useState('Loading languages...');
    const [selectedLanguage, setSelectedLanguage] = useState('ta-IN');
    const [error, setError] = useState('');
    
    const [activeInput, setActiveInput] = useState<'text' | 'file' | 'live'>('text');
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

    // State for language data
    const [languages, setLanguages] = useState<{ code: string; name: string }[]>([]);
    const [languageToVoiceMap, setLanguageToVoiceMap] = useState<{ [key: string]: string }>({});

    const isAudioSupported = useMemo(() => selectedLanguage in languageToVoiceMap, [selectedLanguage, languageToVoiceMap]);
    const isTargetEnglish = useMemo(() => selectedLanguage === 'en-US', [selectedLanguage]);
    
    useEffect(() => {
        const fetchLanguageData = async () => {
            try {
                const [languagesResponse, voicesResponse] = await Promise.all([
                    fetch('/languages.json'),
                    fetch('/language-voices.json')
                ]);

                if (!languagesResponse.ok || !voicesResponse.ok) {
                    throw new Error('Network response was not ok');
                }

                const languagesData = await languagesResponse.json();
                const voicesData = await voicesResponse.json();

                setLanguages(languagesData);
                setLanguageToVoiceMap(voicesData);
            } catch (error) {
                console.error("Failed to fetch language data:", error);
                setError("Could not load application data. Please refresh the page.");
            } finally {
                setIsLoading(false);
                setLoadingText('');
            }
        };

        fetchLanguageData();
    }, []);


    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);

        if (window.VANTA) {
            if (vantaEffect) {
                (vantaEffect as any).destroy();
            }

            const newVantaEffect = window.VANTA.CELLS({
                el: "#vanta-bg",
                mouseControls: true,
                touchControls: true,
                gyroControls: false,
                minHeight: 200.00,
                minWidth: 200.00,
                scale: 1.00,
                color1: theme === 'dark' ? 0x8a2be2 : 0xc4b5fd,
                color2: theme === 'dark' ? 0xff00ff : 0xd8b4fe,
                size: 3.0,
                speed: 1.0
            });
            setVantaEffect(newVantaEffect);
        }

        return () => {
            if (vantaEffect) {
                (vantaEffect as any).destroy();
            }
        };
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
    };

    const handleTranslate = async () => {
        if (!textToSynthesize) return;

        setIsLoading(true);
        setLoadingText('Translating...');
        setError('');
        setTranslatedText('');
        setLatinScriptText('');
        setAudioUrl(null);
        
        try {
            const selectedLanguageName = languages.find(l => l.code === selectedLanguage)?.name;
            if (!selectedLanguageName) throw new Error("Invalid language selected.");

            const systemInstruction = `You are an expert multilingual translator. You will be given text to translate into a specified target language.
You must provide two outputs in a JSON object:
1. 'translation': The accurate translation of the text in the target language's native script.
2. 'latinScript': The transliteration of the 'translation' into Latin (Roman) characters. This provides a phonetic representation of the translation.

For example, if the input is 'hello' and the target language is Hindi, the output should be:
{
  "translation": "नमस्ते",
  "latinScript": "namaste"
}

If the target language already uses the Latin script (e.g., French), the 'translation' and 'latinScript' values will be the same.
Always respond in the requested JSON format.`;

            const prompt = `Translate the following text into ${selectedLanguageName}: "${textToSynthesize}"`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    systemInstruction,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            translation: {
                                type: Type.STRING,
                                description: `The translation of the text into ${selectedLanguageName}.`,
                            },
                            latinScript: {
                                type: Type.STRING,
                                description: "The phonetic, Latin-script transliteration of the translated text.",
                            },
                        },
                        required: ['translation', 'latinScript'],
                    },
                },
            });

            try {
                const result = JSON.parse(response.text);
                const translation = result.translation?.trim().replace(/^"|"$/g, '') || '';
                const latinScriptWithDiacritics = result.latinScript?.trim().replace(/^"|"$/g, '') || '';

                // Remove diacritics for a plain Latin script representation
                const plainLatinScript = removeDiacritics(latinScriptWithDiacritics);
                
                setTranslatedText(translation);
                setLatinScriptText(plainLatinScript);
            } catch (e) {
                console.error("Failed to parse JSON response:", e);
                setError("Failed to get structured response from AI. Displaying raw output.");
                setTranslatedText(response.text.trim());
                setLatinScriptText('');
            }

        } catch (error) {
            console.error("Translation failed.", error);
            const message = error instanceof Error ? error.message : "An unknown error occurred.";
            setError(`Translation Error: ${message}`);
        } finally {
            setIsLoading(false);
            setLoadingText('');
        }
    };

    const handleTranscription = async (audioBlob: Blob, mimeType: string) => {
        setIsLoading(true);
        setLoadingText('Transcribing...');
        setError('');
        setTranslatedText('');
        setLatinScriptText('');
        setTextToSynthesize('');

        try {
            const base64Audio = await toBase64(audioBlob);
            
            const audioPart = { inlineData: { data: base64Audio, mimeType } };
            const textPart = { text: "Transcribe this audio accurately. The audio may contain transliterated language like Hinglish or Tanglish." };
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [audioPart, textPart] },
            });
            
            const transcribedText = response.text.trim();
            setTextToSynthesize(transcribedText);

            if (!transcribedText) {
                 setError("Transcription resulted in empty text. Please try again.");
            }
        } catch (err) {
            console.error("Transcription failed", err);
            const message = err instanceof Error ? err.message : "An unknown error occurred during transcription.";
            setError(`Transcription Error: ${message}`);
        } finally {
            setIsLoading(false);
            setLoadingText('');
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setAudioFile(file);
            handleTranscription(file, file.type);
        }
    };
    
    const handleStartRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => audioChunksRef.current.push(event.data);
            
            mediaRecorderRef.current.onstop = () => {
                const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
                const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                handleTranscription(audioBlob, mimeType);
                stream.getTracks().forEach(track => track.stop());
            };
            
            mediaRecorderRef.current.start();
            setIsRecording(true);
            setError('');
        } catch (err) {
            console.error("Could not start recording", err);
            setError("Microphone access denied. Please allow microphone permissions in your browser settings.");
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleGenerateAudio = async () => {
        if (!translatedText || !isAudioSupported) return;

        const voice = languageToVoiceMap[selectedLanguage];
        if (!voice) {
            console.warn("Audio generation attempted for an unsupported language.");
            return;
        }

        setIsGeneratingAudio(true);
        setError('');
        setAudioUrl(null);

        try {
            const response = await fetch(`https://api.streamelements.com/kappa/v2/speech?voice=${voice}&text=${encodeURIComponent(translatedText)}`);
            if (!response.ok) {
                throw new Error(`API returned status ${response.status}`);
            }
            const audioBlob = await response.blob();
            const url = URL.createObjectURL(audioBlob);
            setAudioUrl(url);

        } catch (err) {
            console.error("Audio generation failed.", err);
            const message = err instanceof Error ? err.message : "An unknown error occurred.";
            setError(`Audio generation failed: ${message}`);
        } finally {
            setIsGeneratingAudio(false);
        }
    };


    return (
        <main className="main-container">
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
            <h2>AI Translator</h2>
            <div className="card">
                { isLoading && loadingText === 'Loading languages...' ? (
                     <Spinner text={loadingText} />
                ) : (
                <>
                <div className="form-step">
                    <label className="form-label">Step 1: Provide Input</label>
                    <InputTabs 
                        activeInput={activeInput}
                        setActiveInput={setActiveInput}
                        disabled={isLoading}
                    />
                    <InputMethod 
                        activeInput={activeInput}
                        audioFile={audioFile}
                        isRecording={isRecording}
                        isLoading={isLoading}
                        loadingText={loadingText}
                        onFileChange={handleFileChange}
                        onStartRecording={handleStartRecording}
                        onStopRecording={handleStopRecording}
                    />
                </div>
                <TranslationForm
                    textToSynthesize={textToSynthesize}
                    setTextToSynthesize={setTextToSynthesize}
                    selectedLanguage={selectedLanguage}
                    setSelectedLanguage={setSelectedLanguage}
                    languages={languages}
                    onTranslate={handleTranslate}
                    isLoading={isLoading}
                    loadingText={loadingText}
                    activeInput={activeInput}
                />
                
                {error && <p className="error-message" role="alert">{error}</p>}

                <TranslationResult
                    translatedText={translatedText}
                    latinScriptText={latinScriptText}
                    onGenerateAudio={handleGenerateAudio}
                    isGeneratingAudio={isGeneratingAudio}
                    audioUrl={audioUrl}
                    isAudioSupported={isAudioSupported}
                    isTargetEnglish={isTargetEnglish}
                />
                </>
                )}
            </div>
        </main>
    );
};

export default App;
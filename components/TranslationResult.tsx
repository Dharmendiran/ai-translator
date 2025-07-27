
import React, { useState } from 'react';
import Spinner from './Spinner';
import ClipboardIcon from './ClipboardIcon';
import CheckIcon from './CheckIcon';

interface TranslationResultProps {
    translatedText: string;
    latinScriptText: string;
    isGeneratingAudio: boolean;
    audioUrl: string | null;
    onGenerateAudio: () => void;
    isAudioSupported: boolean;
    isTargetEnglish: boolean;
}

const TranslationResult: React.FC<TranslationResultProps> = ({
    translatedText,
    latinScriptText,
    isGeneratingAudio,
    audioUrl,
    onGenerateAudio,
    isAudioSupported,
    isTargetEnglish,
}) => {
    const [copiedLatin, setCopiedLatin] = useState(false);
    const [copiedTranslation, setCopiedTranslation] = useState(false);

    if (!translatedText && !latinScriptText) {
        return null;
    }

    const handleCopy = (textToCopy: string, type: 'latin' | 'translation') => {
        if (!textToCopy || !navigator.clipboard) return;

        navigator.clipboard.writeText(textToCopy).then(() => {
            if (type === 'latin') {
                setCopiedLatin(true);
                setTimeout(() => setCopiedLatin(false), 2000);
            } else {
                setCopiedTranslation(true);
                setTimeout(() => setCopiedTranslation(false), 2000);
            }
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    };

    return (
        <div className="result-container">
            <hr className="result-divider" />
            
            {latinScriptText && !isTargetEnglish && (
                 <>
                    <div className="result-heading-container">
                        <h3 className="result-heading">Latin Script</h3>
                        <button
                            className={`copy-btn ${copiedLatin ? 'copied' : ''}`}
                            onClick={() => handleCopy(latinScriptText, 'latin')}
                            aria-label={copiedLatin ? 'Copied Latin Script' : 'Copy Latin Script'}
                        >
                            {copiedLatin ? <CheckIcon /> : <ClipboardIcon />}
                        </button>
                    </div>
                    <div className="translated-text-container" aria-live="assertive">
                        {latinScriptText}
                    </div>
                 </>
            )}

            {translatedText && (
                <>
                    <div className="result-heading-container">
                        <h3 className="result-heading">Translation Result</h3>
                        <button
                            className={`copy-btn ${copiedTranslation ? 'copied' : ''}`}
                            onClick={() => handleCopy(translatedText, 'translation')}
                             aria-label={copiedTranslation ? 'Copied Translation' : 'Copy Translation'}
                        >
                            {copiedTranslation ? <CheckIcon /> : <ClipboardIcon />}
                        </button>
                    </div>
                    <div className="translated-text-container" aria-live="assertive">
                        {translatedText}
                    </div>
                    <div className="result-controls">
                        {!audioUrl ? (
                            <div className="audio-controls-wrapper">
                                <button
                                    className="btn btn-primary"
                                    onClick={onGenerateAudio}
                                    disabled={isGeneratingAudio || !isAudioSupported}
                                    aria-live="polite"
                                    aria-describedby={!isAudioSupported ? "audio-unsupported-note" : undefined}
                                >
                                    {isGeneratingAudio ? <Spinner text="Generating Audio..." /> : 'Generate Audio'}
                                </button>
                                {!isAudioSupported && (
                                    <span id="audio-unsupported-note" className="availability-note">
                                        Audio is not supported for this language.
                                    </span>
                                )}
                            </div>
                        ) : (
                            <div className="audio-player-container">
                               <audio src={audioUrl} controls autoPlay>
                                    Your browser does not support the audio element.
                               </audio>
                               <a
                                    href={audioUrl}
                                    download="translation.mp3"
                                    className="btn btn-primary"
                                    aria-label="Download translated audio"
                               >
                                    Download
                               </a>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default TranslationResult;
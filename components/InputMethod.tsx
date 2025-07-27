
import React from 'react';
import Spinner from './Spinner';

interface InputMethodProps {
    activeInput: 'text' | 'file' | 'live';
    audioFile: File | null;
    isRecording: boolean;
    isLoading: boolean;
    loadingText: string;
    onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onStartRecording: () => void;
    onStopRecording: () => void;
}

const InputMethod: React.FC<InputMethodProps> = ({
    activeInput,
    audioFile,
    isRecording,
    isLoading,
    loadingText,
    onFileChange,
    onStartRecording,
    onStopRecording,
}) => {
    if (activeInput === 'text') {
        return null;
    }

    const isTranscribing = isLoading && loadingText === 'Transcribing...';

    return (
        <div className="input-method-container">
            {activeInput === 'file' && (
                <div className="file-input-wrapper">
                    <input
                        type="file"
                        id="audio-upload"
                        accept="audio/*"
                        onChange={onFileChange}
                        disabled={isLoading}
                    />
                    <label htmlFor="audio-upload">
                        {isTranscribing ? (
                            <Spinner text="Transcribing..." />
                        ) : audioFile ? (
                            `Selected: ${audioFile.name}`
                        ) : (
                            'Click to upload or drag & drop an audio file'
                        )}
                    </label>
                </div>
            )}
            {activeInput === 'live' && (
                <div className="live-recording-controls">
                    {isTranscribing ? (
                         <Spinner text="Transcribing..." />
                    ) : !isRecording ? (
                        <button
                            className="btn btn-primary"
                            onClick={onStartRecording}
                            disabled={isLoading}
                        >
                            Start Recording
                        </button>
                    ) : (
                        <button
                            className="btn btn-outline-danger"
                            onClick={onStopRecording}
                        >
                            <span className="recording-indicator">
                                <span className="recording-dot"></span>
                                Stop Recording
                            </span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default InputMethod;

import React from 'react';

interface InputTabsProps {
    activeInput: 'text' | 'file' | 'live';
    setActiveInput: (input: 'text' | 'file' | 'live') => void;
    disabled: boolean;
}

const InputTabs: React.FC<InputTabsProps> = ({ activeInput, setActiveInput, disabled }) => {
    return (
        <div className="tabs-container">
            <button
                className={`tab-button ${activeInput === 'text' ? 'active' : ''}`}
                onClick={() => setActiveInput('text')}
                disabled={disabled}
                aria-pressed={activeInput === 'text'}
            >
                Text
            </button>
            <button
                className={`tab-button ${activeInput === 'file' ? 'active' : ''}`}
                onClick={() => setActiveInput('file')}
                disabled={disabled}
                aria-pressed={activeInput === 'file'}
            >
                Audio File
            </button>
            <button
                className={`tab-button ${activeInput === 'live' ? 'active' : ''}`}
                onClick={() => setActiveInput('live')}
                disabled={disabled}
                aria-pressed={activeInput === 'live'}
            >
                Live Recording
            </button>
        </div>
    );
};

export default InputTabs;

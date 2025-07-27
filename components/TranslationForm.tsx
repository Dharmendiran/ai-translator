import React, { useState, useRef, useEffect } from 'react';
import Spinner from './Spinner';

interface TranslationFormProps {
    textToSynthesize: string;
    setTextToSynthesize: (text: string) => void;
    selectedLanguage: string;
    setSelectedLanguage: (lang: string) => void;
    languages: { code: string; name: string }[];
    onTranslate: () => void;
    isLoading: boolean;
    loadingText: string;
    activeInput: 'text' | 'file' | 'live';
}

const TranslationForm: React.FC<TranslationFormProps> = ({
    textToSynthesize,
    setTextToSynthesize,
    selectedLanguage,
    setSelectedLanguage,
    languages,
    onTranslate,
    isLoading,
    loadingText,
    activeInput,
}) => {
    const isAudioInput = activeInput !== 'text';
    const isTranslating = isLoading && loadingText === 'Translating...';

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (isDropdownOpen) {
            // Focus the search input when dropdown opens
            setTimeout(() => searchInputRef.current?.focus(), 0);
        }
    }, [isDropdownOpen]);

    const filteredLanguages = languages.filter(lang =>
        lang.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedLanguageName = languages.find(lang => lang.code === selectedLanguage)?.name || 'Select Language';

    const handleSelectLanguage = (langCode: string) => {
        setSelectedLanguage(langCode);
        setIsDropdownOpen(false);
        setSearchTerm('');
    };

    return (
        <>
            <div className="form-step">
                <label htmlFor="text-input" className="form-label">
                    {isAudioInput ? 'Step 2: Review Transcription' : 'Step 2: Enter Text'}
                </label>
                <textarea
                    id="text-input"
                    value={textToSynthesize}
                    onChange={(e) => setTextToSynthesize(e.target.value)}
                    placeholder={isAudioInput ? 'Transcription will appear here...' : 'Type text to translate...'}
                    disabled={isLoading}
                    aria-label="Text to translate"
                />
            </div>

            <div className="form-step">
                <label id="language-select-label" className="form-label">
                    Step 3: Select Language & Translate
                </label>
                <div className="translation-controls">
                    <div className="custom-select-container" ref={dropdownRef}>
                        <button
                            className="select-trigger"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            disabled={isLoading}
                            aria-haspopup="listbox"
                            aria-expanded={isDropdownOpen}
                            aria-labelledby="language-select-label"
                        >
                            <span>{selectedLanguageName}</span>
                            <span className="arrow"></span>
                        </button>
                        {isDropdownOpen && (
                            <div className="select-dropdown">
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    className="select-search-input"
                                    placeholder="Search language..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    aria-label="Search for a language"
                                />
                                <ul className="select-options-list" role="listbox" aria-labelledby="language-select-label">
                                    {filteredLanguages.length > 0 ? (
                                        filteredLanguages.map((lang) => (
                                            <li
                                                key={lang.code}
                                                className={`select-option ${selectedLanguage === lang.code ? 'selected' : ''}`}
                                                onClick={() => handleSelectLanguage(lang.code)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSelectLanguage(lang.code)}
                                                role="option"
                                                aria-selected={selectedLanguage === lang.code}
                                                tabIndex={0}
                                            >
                                                {lang.name}
                                            </li>
                                        ))
                                    ) : (
                                        <li className="select-option-empty" role="option" aria-live="polite">
                                            No languages found
                                        </li>
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={onTranslate}
                        disabled={isLoading || !textToSynthesize}
                        aria-live="polite"
                    >
                        {isTranslating ? <Spinner text={loadingText} /> : 'Translate'}
                    </button>
                </div>
            </div>
        </>
    );
};

export default TranslationForm;
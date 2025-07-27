
import React from 'react';

interface SpinnerProps {
    text: string;
}

const Spinner: React.FC<SpinnerProps> = ({ text }) => {
    return (
        <span className="spinner-container" aria-label={text}>
            <span className="spinner"></span>
            <span>{text}</span>
        </span>
    );
};

export default Spinner;
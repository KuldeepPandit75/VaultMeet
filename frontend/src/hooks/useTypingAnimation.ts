import { useState, useEffect } from 'react';

interface UseTypingAnimationProps {
    words: string[];
    typingSpeed?: number;
    deletingSpeed?: number;
    pauseTime?: number;
}

export const useTypingAnimation = ({
    words,
    typingSpeed = 100,
    deletingSpeed = 50,
    pauseTime = 2000
}: UseTypingAnimationProps) => {
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [currentText, setCurrentText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        let timeout: NodeJS.Timeout;

        if (isPaused) {
            timeout = setTimeout(() => {
                setIsPaused(false);
                setIsDeleting(true);
            }, pauseTime);
            return () => clearTimeout(timeout);
        }

        const currentWord = words[currentWordIndex];

        if (!isDeleting && currentText === currentWord) {
            setIsPaused(true);
            return;
        }

        if (isDeleting && currentText === '') {
            setIsDeleting(false);
            setCurrentWordIndex((prev) => (prev + 1) % words.length);
            return;
        }

        const speed = isDeleting ? deletingSpeed : typingSpeed;
        const nextText = isDeleting
            ? currentWord.substring(0, currentText.length - 1)
            : currentWord.substring(0, currentText.length + 1);

        timeout = setTimeout(() => {
            setCurrentText(nextText);
        }, speed);

        return () => clearTimeout(timeout);
    }, [currentText, currentWordIndex, isDeleting, isPaused, words, typingSpeed, deletingSpeed, pauseTime]);

    return currentText;
}; 
'use client';

import { useTypingAnimation } from '@/hooks/useTypingAnimation';

interface TypingTextProps {
    words: string[];
    className?: string;
    typingSpeed?: number;
    deletingSpeed?: number;
    pauseTime?: number;
}

export default function TypingText({
    words,
    className = '',
    typingSpeed = 100,
    deletingSpeed = 50,
    pauseTime = 2000
}: TypingTextProps) {
    const text = useTypingAnimation({
        words,
        typingSpeed,
        deletingSpeed,
        pauseTime
    });

    return (
        <span className={className}>
            {text}
            <span className="animate-blink">|</span>
        </span>
    );
} 
import { checkNumeric } from '@/libs/utils';
import React, { useState, useEffect } from 'react';

interface Props {
    count_minutes?: any;
    onBack: any;
}

export default function CountDown({ count_minutes, onBack }: Props) {
    const [minutes, setMinutes] = useState(count_minutes);
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        if (minutes == 0 && seconds == 0) {
            onBack();
        }

        const countdown = setInterval(() => {
            if (checkNumeric(seconds) > 0) {
                setSeconds(checkNumeric(seconds) - 1);
            }
            if (checkNumeric(seconds) === 0) {
                if (checkNumeric(minutes) === 0) {
                    clearInterval(countdown);
                } else {
                    setMinutes(checkNumeric(minutes) - 1);
                    setSeconds(59);
                }
            }
        }, 1000);
        return () => clearInterval(countdown);
    }, [minutes, seconds]);

    return (
        <div className="text-red-500 absolute top-1/2 right-4 leading-none -translate-y-1/2">
            {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
        </div>
    );
}

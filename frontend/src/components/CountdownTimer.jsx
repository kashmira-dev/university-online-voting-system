import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const CountdownTimer = ({ targetDate, onExpire }) => {
  const calculateTimeLeft = () => {
    const difference = +new Date(targetDate) - +new Date();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        hours: Math.floor((difference / (1000 * 60 * 60))),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    } else {
      timeLeft = { hours: 0, minutes: 0, seconds: 0 };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      
      if (remaining.hours === 0 && remaining.minutes === 0 && remaining.seconds === 0) {
        clearInterval(timer);
        if (!expired) {
          setExpired(true);
          if (onExpire) onExpire();
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, expired]);

  const isExpiringSoon = timeLeft.hours === 0 && timeLeft.minutes < 60;

  return (
    <div className={`inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border text-xs font-mono font-bold ${
      isExpiringSoon 
        ? 'bg-rose-500/10 border-rose-500/30 text-rose-300 animate-pulse' 
        : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
    }`}>
      <Clock className="w-3.5 h-3.5" />
      <span>
        {String(timeLeft.hours).padStart(2, '0')}h : {String(timeLeft.minutes).padStart(2, '0')}m : {String(timeLeft.seconds).padStart(2, '0')}s
      </span>
      {isExpiringSoon && <span className="text-[10px] text-rose-400 font-sans font-normal">(Closing Soon)</span>}
    </div>
  );
};

export default CountdownTimer;
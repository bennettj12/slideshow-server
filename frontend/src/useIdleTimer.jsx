import { useState, useEffect, useCallback, useRef } from "react";

const useIdleTimer = (timeout = 3000) => {
    const [isIdle, setIsIdle] = useState(false);
    // reference of the setTimeout
    const timeoutIdRef = useRef(null)

    const resetTimer = useCallback(() => {
        setIsIdle(false);
        if(timeoutIdRef.current) {
            clearTimeout(timeoutIdRef.current)
        }
        timeoutIdRef.current = setTimeout(() => setIsIdle(true), timeout);
    }, [timeout])

    useEffect(() => {
        //events which will reset idle timer
        const events = ['mousemove', 'keydown', 'touchstart', 'click'];

        events.forEach(event => {
            window.addEventListener(event, resetTimer);
        })

        resetTimer();

        // cleanup
        return () => {
            if(timeoutIdRef.current){
                clearTimeout(timeoutIdRef);
            }
            events.forEach(event => {
                window.removeEventListener(event, resetTimer);
            })
        }
    }, [resetTimer])

    return {isIdle, resetTimer}

}

export default useIdleTimer;
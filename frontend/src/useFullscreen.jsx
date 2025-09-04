// hook for enabling fullscreen

import { useState, useCallback, useEffect, useRef } from "react";

const useFullscreen = () => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const fullscreenElementRef = useRef(null)


    // Enter Fullscreen
    const enterFullscreen = useCallback(() => {
        const element = fullscreenElementRef.current || document.documentElement

        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.mozRequestFullscreen) {
            element.mozRequestFullscreen();
        } else if (element.webkitRequestFullescreen) {
            element.webkitRequestFullescreen();
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        }
    }, [])
    // Exit Fullscreen
    const exitFullscreen = useCallback(() => {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) { // Firefox
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) { // Chrome, Safari, Opera
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { // IE/Edge
            document.msExitFullscreen();
        }
    })

    const toggleFullscreen = useCallback(() => {
        if (isFullscreen){
            exitFullscreen();
        } else {
            enterFullscreen();
        }
    }, [isFullscreen, enterFullscreen, exitFullscreen])

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        }

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenchange', handleFullscreenChange);
        }
    }, [])

    return {
        isFullscreen,
        toggleFullscreen,
        enterFullscreen,
        exitFullscreen,
        fullscreenElementRef,
    }
}

export default useFullscreen;
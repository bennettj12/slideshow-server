import { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import useKeyboardControls from './useKeyboardControls.jsx'

import { useSettings } from './SettingsContext.jsx'

import './App.css'

import axios from 'axios'
import useIdleTimer from './useIdleTimer.jsx'
import useFullscreen from './useFullscreen.jsx'

// Icons
import { MdClose, MdFullscreen, MdCloseFullscreen , MdPause , MdPlayArrow, MdNavigateNext, MdNavigateBefore, MdSettings } from "react-icons/md";

import NoSleep from '@zakj/no-sleep'

function App() {

  const {
    intervalTime,
    setIntervalTime,
    timerVisible,
    setTimerVisible,
    serverUrl,
    setServerUrl,
    progressBarVisible,
    setProgressBarVisible
  } = useSettings();

  const [isPlaying, setIsPlaying] = useState(false)

  const [intervalSeconds, setIntervalSeconds] = useState(Math.floor(intervalTime % 60000) / 1000)
  const [intervalMinutes, setIntervalMinutes] = useState(Math.floor(intervalTime / 60000))

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [imageUrls, setImageUrls] = useState([])
  const [imageIndex, setImageIndex] = useState(-1)

  const [controlsVisible, setControlsVisible] = useState(true);

  const currentImage = imageIndex >= 0 ? imageUrls[imageIndex]: '';

  // time tracking
  const [timeLeft, setTimeLeft] = useState(0);
  const lastChangeTime = useRef(Date.now());
  const elapsedBeforePause = useRef(0);

  const [progressBar, setProgressBar] = useState(0);

  // options
  const [menuOpen, setMenuOpen] = useState(false);


  const LIST_MAX = 100;

  const submitRef = useRef(null)
  const playButtonRef = useRef(null);
  const nextButtonRef = useRef(null);
  const menuButtonRef = useRef(null);
  const prevButtonRef = useRef(null);

  const idleTimer = useIdleTimer(3000);

  const { isFullscreen, toggleFullscreen } = useFullscreen();

  const noSleep = useMemo(() => new NoSleep(), [])


  const fetchRandomImage = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      lastChangeTime.current = Date.now()
      elapsedBeforePause.current = 0
      setTimeLeft(intervalTime)
      setProgressBar(0)

      const response = await axios.get('/api/random-image')
      const imagePath = response.data.image;
      const imageUrl = `/images/${encodeURIComponent(imagePath)}`
      
      setImageUrls(prev => {
        const newUrls = [...prev, imageUrl];
        return newUrls.length > LIST_MAX ? newUrls.slice(1) : newUrls
      })

      setImageIndex(prev => {
        const newIndex = prev < 0 ? 0 : prev + 1;
        return Math.min(newIndex, LIST_MAX - 1)
      })


    } catch (err) {
      setError('Failed to load image');
      console.error('Error fetching image: ', err)
    } finally {
      setLoading(false);
    }
  }, [intervalTime])


  // Slideshow timer setup
  useEffect(() => {
    let countdownInterval = null
    if( isPlaying ) {
      countdownInterval = setInterval(() => {
        if(isPlaying){
          const elapsed = Date.now() - lastChangeTime.current;
          const remaining = Math.max(0, intervalTime - elapsed)
          setTimeLeft(remaining)
          const prog = Math.round(elapsed) / (intervalTime + 0.0) * 100;
          setProgressBar(prog)
          if(remaining == 0){
            fetchRandomImage()
          }
        }
      }, 100)
      // wake lock when isPlaying
      
    }
    return () => {
      if (countdownInterval) clearInterval(countdownInterval)
    }
  }, [isPlaying, intervalTime, progressBar, fetchRandomImage])


  // idle timer logic
  useEffect(() => {
    setControlsVisible(!idleTimer.isIdle)
    if(idleTimer.isIdle){
      document.activeElement.blur()
    }
  }, [idleTimer])

  const goToImage = useCallback((index) => {
    if (index >= 0 && index < imageUrls.length){
      lastChangeTime.current = Date.now()
      setTimeLeft(intervalTime)
      setProgressBar(0)
      elapsedBeforePause.current = 0
      setImageIndex(index)

      setLoading(true)
      setInterval(() => {
        setLoading(false)
      }, 100)
    }
  }, [imageUrls.length, intervalTime])



  // Initial Fetch
  useEffect(() => {
    fetchRandomImage()
  }, [fetchRandomImage])

  const togglePlaying = useCallback(() => {
    playButtonRef.current.focus()
    if( isPlaying ) {
      elapsedBeforePause.current = Date.now() - lastChangeTime.current
      noSleep.disable()
    } else {
      lastChangeTime.current = Date.now() - elapsedBeforePause.current
      noSleep.enable()
    }


    setIsPlaying(!isPlaying);

  }, [isPlaying, elapsedBeforePause, lastChangeTime, noSleep])
  const handleNextImage = useCallback(() => {
    nextButtonRef.current.focus();
    if (imageIndex >= imageUrls.length - 1){
      // at most recent image
      fetchRandomImage()
    } else {
      // we are not at the end of image array, so we will just go to the next one already in the array.
      goToImage(imageIndex + 1)
    }
  }, [imageIndex, imageUrls.length, goToImage, fetchRandomImage])

  const handlePreviousImage = useCallback(() => {
    if( imageIndex > 0) {
      prevButtonRef.current.focus()
      goToImage(imageIndex - 1);
    }
  }, [imageIndex, goToImage]);

  const handleOpenMenu = useCallback(() => {

    if(!menuOpen){
      setIntervalMinutes(Math.floor(intervalTime / 60000));
      setIntervalSeconds(Math.floor((intervalTime % 60000) / 1000));
    }
    setMenuOpen(!menuOpen);
  }, [setMenuOpen, menuOpen, intervalTime])

  const toggleCountdown = useCallback(() => {
    setTimerVisible(!timerVisible);
  }, [setTimerVisible, timerVisible])

  const handleSubmit = () => {

    const milli = (intervalMinutes * 60000) + (intervalSeconds * 1000);
    if(milli < 1000) {
      alert("Interval must be at least one second long")
      return;
    }
    setIntervalTime(milli);
    setTimeLeft(milli)
    lastChangeTime.current = Date.now()
    elapsedBeforePause.current = 0

    if(menuOpen){
      setMenuOpen(false)
    }

  }

  const breakDownTime = (ms) => {
    const time = {
      hour: Math.floor(ms/ 3600000),
      minute: Math.floor(ms/60000) % 60,
      second: Math.floor(ms/1000) % 60,
      tenth: Math.floor(ms/100) % 10
    }
    return time
  }
  const formatTime = (ms) => {
    const time = breakDownTime(ms)
    let output = null
    if (ms > 3600000) {
      output = `${time.hour}:${time.minute}:${time.second}.${time.tenth}`
    } else if (ms >= 60000) {
      output = `${time.minute}:${time.second}.${time.tenth}`
    } else {
      output = `${time.second}.${time.tenth}`
    }
    return output
  }

  /// Keyboard/button controls:
  useKeyboardControls({
    ' ': togglePlaying,
    'MediaPlayPause': togglePlaying,
    'NavigateNext': handleNextImage,
    'NavigatePrevious': handlePreviousImage,
    'ArrowLeft': handlePreviousImage,
    'ArrowRight': handleNextImage,
    'Escape': () => {
      if(!menuOpen && isFullscreen){
        toggleFullscreen();
      }
      setMenuOpen(false)
    },
    'm': () => setMenuOpen(prev => !prev),
    'Enter': menuOpen ? handleSubmit : null,
    'f': toggleFullscreen,
  })




  return (
    <>
      <div className='app'>
        <div className="slideshow-container">
          {loading && <div className='loading'>Loading next image...</div>}
          {error && <div className='error'>{error}</div>}
          {!loading && !error && (
           <img 
            src={currentImage}
            className={`slide-image ${!loading ? 'loaded' : ''}`}
            onLoad={() => setLoading(false)}
            onError={() => setError("Failed to load image")}
           /> 
          )}

        </div>
        {
          timerVisible && (
            <div className={`countdown`}>
              {formatTime(timeLeft)}
            </div>
          )
        }
        {
          progressBarVisible && (
            <div className={`progress-bar`} >
              <div className="progress-bar-inner" style={{width: `${progressBar}%`}} />
            </div>
          )
        }

        <div className={`controls ${controlsVisible ? '' : 'idle'}`}>
          <button ref={prevButtonRef} onClick={handlePreviousImage} disabled={imageIndex <= 0}>
            < MdNavigateBefore />
          </button>
          <button ref={playButtonRef} onClick={togglePlaying}>
            {
              isPlaying ? <MdPause /> : <MdPlayArrow />
            }
          </button>
          <button ref={nextButtonRef} onClick={handleNextImage}>
            < MdNavigateNext />
          </button>
          <button ref={menuButtonRef} onClick={handleOpenMenu}>
            {menuOpen ? <MdClose /> : <MdSettings />}
          </button>
        </div>
        <button onClick={toggleFullscreen} className={`fullscreen ${controlsVisible ? '' : 'idle'}`}>
          {isFullscreen ? <MdCloseFullscreen /> : <MdFullscreen />}
        </button>
          <div aria-hidden={!menuOpen} inert={!menuOpen} className={`menu ${menuOpen ? 'visible' : ''}`}> 
            <div> 
              <h2>Configuration</h2>
              <button onClick={handleOpenMenu}><MdClose /></button>
            </div>
            <hr />
            <div>
              <h3>Interval (minutes)</h3>
              <input type='tel' onChange={e => setIntervalMinutes(parseInt(e.target.value) || 0)} value={intervalMinutes} className='input'/>
            </div>
            <div>
              <h3>Interval (seconds)</h3>
              <input type='tel' onChange={e => setIntervalSeconds(parseInt(e.target.value) || 0)} value={intervalSeconds} className='input'/>
            </div>
            <div>
              <h3>Show Countdown</h3>
              <button onClick={toggleCountdown}>
                {timerVisible ? 'On' : 'Off'}
              </button>
            </div>
            <div>
              <h3>Show Progress Bar</h3>
              <button onClick={() => setProgressBarVisible(!progressBarVisible)}>
                {progressBarVisible ? 'On' : 'Off'}
              </button>
            </div>
            <button ref={submitRef} className='submit' onClick={handleSubmit}>Submit</button>
          </div>
      </div>
    </>
  )
}

export default App

import { useState, useEffect, useCallback, useRef } from 'react'
import './App.css'

import axios from 'axios'


function App() {
  //const [currentImage, setCurrentImage] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [intervalTime, setIntervalTime] = useState(3600000 * (0) + 60000 * (0) + 1000 * (10)); // default of 10 seconds

  const [serverUrl, setServerUrl] = useState('http://localhost:3001')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [imageUrls, setImageUrls] = useState([])
  const [imageIndex, setImageIndex] = useState(-1)

  const currentImage = imageIndex >= 0 ? imageUrls[imageIndex]: '';

  // time tracking
  const [timeLeft, setTimeLeft] = useState(0);
  const lastChangeTime = useRef(Date.now());
  const elapsedBeforePause = useRef(0);

  const [progressBar, setProgressBar] = useState(0);

  //const imageUrls = [];
  const LIST_MAX = 100;

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
          console.log(prog)
          setProgressBar(prog)
          if(remaining == 0){
            fetchRandomImage()
          }
        }
      }, 100)
    }
    return () => {
      if (countdownInterval) clearInterval(countdownInterval)
    }
  }, [isPlaying, intervalTime, progressBar])

  const fetchRandomImage = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      lastChangeTime.current = Date.now()
      elapsedBeforePause.current = 0
      setTimeLeft(intervalTime)
      setProgressBar(0)

      const response = await axios.get(`${serverUrl}/api/random-image`)
      const imagePath = response.data.image;
      const imageUrl = `${serverUrl}/images/${encodeURIComponent(imagePath)}`
      
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
  }, [serverUrl])

  const goToImage = useCallback((index) => {
    if (index >= 0 && index < imageUrls.length){
      lastChangeTime.current = Date.now()
      setTimeLeft(intervalTime)
      setProgressBar(0)
      elapsedBeforePause.current = 0
      setImageIndex(index)
    }
  }, [imageUrls.length])



  // Initial Fetch
  useEffect(() => {
    fetchRandomImage()
  }, [fetchRandomImage])

  const togglePlaying = () => {
    if( isPlaying ) {
      elapsedBeforePause.current = Date.now() - lastChangeTime.current
    } else {
      lastChangeTime.current = Date.now() - elapsedBeforePause.current
    }


    setIsPlaying(!isPlaying);

  }
  const handleNextImage = useCallback(() => {
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
      goToImage(imageIndex - 1);
    }
  }, [imageIndex, goToImage])
  const formatTime = (ms) => {
    const time = {
      hour: Math.floor(ms/ 3600000),
      minute: Math.floor(ms/60000) % 60,
      second: Math.floor(ms/1000) % 60,
      tenth: Math.floor(ms/100) % 10
    }
    let output = null
    if (ms > 3600000) {
      output = `${time.hour}:${time.minute}:${time.second}.${time.tenth}`
    } else if (ms > 60000) {
      output = `${time.minute}:${time.second}.${time.tenth}`
    } else {
      output = `${time.second}.${time.tenth}`
    }
    return output
  }
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
        <div className={`countdown`}>
          Next: {formatTime(timeLeft)}
        </div>
        <div className={`progress-bar`} >
          <div className="progress-bar-inner" style={{width: `${progressBar}%`}} />
        </div>
        <div className="controls">
          <button onClick={handlePreviousImage} disabled={imageIndex <= 0}>
            Previous
          </button>
          <button onClick={togglePlaying}>
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button onClick={handleNextImage}>
            Next
          </button>
        </div>

      </div>
    </>
  )
}

export default App

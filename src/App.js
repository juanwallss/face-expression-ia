import React, { useRef, useEffect, useState } from 'react'
import * as faceapi from 'face-api.js'

const translatedExpressions = {
  neutral: 'Neutro',
  happy: 'Feliz',
  sad: 'Triste',
  angry: 'Enojado',
  fearful: 'Asustado',
  disgusted: 'Disgustado',
  surprised: 'Sorprendido'
}

const FaceExpressionApp = () => {
  const videoRef = useRef(null)
  const [expressions, setExpressions] = useState(null)
  const [emotionTimes, setEmotionTimes] = useState({
    neutral: 0,
    happy: 0,
    sad: 0,
    angry: 0,
    fearful: 0,
    disgusted: 0,
    surprised: 0
  })
  const canvasRef = useRef(null)
  const [emotionPercentages, setEmotionPercentages] = useState([])


  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models'
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)
      await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
    }

    const startVideo = async () => {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          videoRef.current.srcObject = stream
        })
        .catch(console.error)
    }

    loadModels().then(startVideo)
  }, [])

  const handleVideoPlay = async () => {
    const canvas = faceapi.createCanvasFromMedia(videoRef.current)
    canvasRef.current.appendChild(canvas)
    const displaySize = {
      width: videoRef.current.videoWidth,
      height: videoRef.current.videoHeight
    }
    faceapi.matchDimensions(canvas, displaySize)

    let lastDominantEmotion = null
    let lastUpdateTime = Date.now()

    const interval = setInterval(async () => {
      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions()

      const context = canvas.getContext('2d')
      context.clearRect(0, 0, canvas.width, canvas.height)

      if (detections.length > 0) {
        const resizedDetections = faceapi.resizeResults(detections, displaySize)

        faceapi.draw.drawDetections(canvas, resizedDetections)

        resizedDetections.forEach((detection) => {
          const { expressions } = detection
          const dominantEmotion = Object.entries(expressions).sort(
            ([, valueA], [, valueB]) => valueB - valueA
          )[0][0] // Obtener la emoción dominante

          const currentTime = Date.now()

          // Actualizar tiempos acumulados
          if (lastDominantEmotion && currentTime > lastUpdateTime) {
            const elapsedTime = currentTime - lastUpdateTime
            setEmotionTimes((prev) => ({
              ...prev,
              [lastDominantEmotion]: prev[lastDominantEmotion] + elapsedTime
            }))
          }

          lastDominantEmotion = dominantEmotion
          lastUpdateTime = currentTime

          const { box } = detection.detection
          const text = `${translatedExpressions[dominantEmotion]}`
          context.fillStyle = 'blue'
          context.font = '18px Arial'
          context.fillText(text, box.x + 100, box.y - 10)
        })
      }
    }, 100)

    return () => clearInterval(interval)
  }
  const handleDownloadAndReset = () => {
    const totalTime = Object.values(emotionTimes).reduce((a, b) => a + b, 0)
    if (totalTime === 0) return
  
    const data = {
      totalTime: `${totalTime.toFixed(2)} segundos`,
      emotions: Object.entries(emotionTimes).map(([emotion, time]) => ({
        emotion: translatedExpressions[emotion],
        time: `${time.toFixed(2)} segundos`,
        percentage: `${((time / totalTime) * 100).toFixed(2)}%`
      }))
    }
  
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
  
    // Crear un enlace para descargar el archivo
    const link = document.createElement('a')
    link.href = url
    link.download = `emotion_data_${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
  
    // Limpiar la información
    setEmotionTimes({
      neutral: 0,
      happy: 0,
      sad: 0,
      angry: 0,
      fearful: 0,
      disgusted: 0,
      surprised: 0,
    })
    setEmotionPercentages([])
    URL.revokeObjectURL(url)
  }
  

  const calculatePercentages = () => {
    const totalTime = Object.values(emotionTimes).reduce((a, b) => a + b, 0)
    if (totalTime === 0) return
  
    const percentages = Object.entries(emotionTimes).map(([emotion, time]) => ({
      emotion: translatedExpressions[emotion],
      percentage: ((time / totalTime) * 100).toFixed(2)
    }))
  
    setEmotionPercentages(percentages)
    console.log(percentages);
  }

  useEffect(() => {
    const interval = setInterval(calculatePercentages(), 5000)
    return () => clearInterval(interval)
  }, [emotionTimes])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: 'black',
        color: 'white',
        height: '100vh'
      }}
    >
      <header
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1em'
        }}
      >
        <img
          src='logo-facesense.png'
          alt='logo'
        />
        <h1
          style={{
            color: 'white',
            textAlign: 'center',
            fontSize: '6em'
          }}
        >
          FACESENSE
        </h1>
      </header>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1em'
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          width='1200'
          height='800'
          onPlay={handleVideoPlay}
          style={{ position: 'absolute', top: '300px' }}
        />
        <div
          ref={canvasRef}
          style={{ position: 'absolute', top: '400px' }}
        />
      </div>
      <button
  style={{
    margin: '1em',
    padding: '0.5em 1em',
    backgroundColor: '#e63946',
    color: 'white',
    border: 'none',
    borderRadius: '0.5em',
    cursor: 'pointer',
    fontSize: '1em'
  }}
  onClick={handleDownloadAndReset}
>
  Descargar y Reiniciar
</button>

      <div
        style={{
          position: 'absolute',
          bottom: '60px',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1em',
          width: '100%',
        }}
      >
        {emotionPercentages.map(({ emotion, percentage }) => (
          <div
            key={emotion}
            style={{
              backgroundColor: '#020078',
              padding: '1em',
              borderRadius: '0.5em',
              textAlign: 'center',
              minWidth: '120px'
            }}
          >
            {emotion}: {percentage}%
          </div>
        ))}
      </div>
    </div>
  )
}

export default FaceExpressionApp

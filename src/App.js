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
  const canvasRef = useRef(null)

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
  
    const interval = setInterval(async () => {
      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions()
  
      // Limpia el canvas antes de redibujar
      const context = canvas.getContext('2d')
      context.clearRect(0, 0, canvas.width, canvas.height)
  
      if (detections.length > 0) {
        // Redimensiona las detecciones a las dimensiones del video
        const resizedDetections = faceapi.resizeResults(detections, displaySize)
  
        // Dibuja los cuadros alrededor de las caras
        faceapi.draw.drawDetections(canvas, resizedDetections)
  
        // Dibuja la emoción detectada más fuerte
        resizedDetections.forEach((detection) => {
          const { expressions } = detection
          const dominantEmotion = Object.entries(expressions).sort(
            ([, valueA], [, valueB]) => valueB - valueA
          )[0] // La emoción más fuerte
  
          const { box } = detection.detection
          const text = `${translatedExpressions[dominantEmotion[0]]}: ${(dominantEmotion[1] * 100).toFixed(2)}%`
  
          // Dibuja el texto sobre la cara
          context.fillStyle = 'blue'
          context.font = '18px Arial'
          context.fillText(
            text,
            box.x + 100,
            box.y - 10 // Muestra el texto un poco arriba del cuadro
          )
        })
      }
    }, 100)
  
    return () => clearInterval(interval)
  }

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
      <header style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1em'
      }}>
        <img src='logo-facesense.png' alt='logo'/>
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
          style={{ position: 'absolute',
            top: '300px',
          }}

        />
        <div
          ref={canvasRef}
          style={{ position: 'absolute',
            top: '400px',
           }}
        />
      </div>
    </div>
  )
}

export default FaceExpressionApp

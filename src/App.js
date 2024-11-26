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
      const MODEL_URL = '/models' // Coloca los modelos en "public/models"
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
      if (detections.length > 0) {
        setExpressions(detections[0].expressions)
      }

      // Limpia el lienzo antes de redibujar
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)

      // Redimensiona las detecciones a las dimensiones del video
      const resizedDetections = faceapi.resizeResults(detections, displaySize)

      // Dibuja los cuadros alrededor de las caras
      faceapi.draw.drawDetections(canvas, resizedDetections)
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
          width='800'
          height='600'
          onPlay={handleVideoPlay}
        />
        <div
          ref={canvasRef}
          style={{ position: 'absolute' }}
        />
        <div style={{
          fontSize: '2em',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1em',
          width: '50%',
          justifyContent: 'center',
          fontWeight: 'bold'
        }}>
          {expressions &&
            Object.entries(expressions).map(([expression, value]) => (
              <div style={{
                backgroundColor: '#020078',
                padding: '1em',
                borderRadius: '0.5em',
                textAlign: 'center'
              }} key={expression}>
                {translatedExpressions[expression]}: {(value * 100).toFixed(2)}%
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}

export default FaceExpressionApp

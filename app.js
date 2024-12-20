class AsciiRenderer {
	renderConfig
	mediaConfig
	rendererTarget
	fontSize
	asciiGradient = '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/|()1{}[]?-_+~<>i!lI;:,"^`.                          '

	constructor(charsByLine, htmlRendererTarget, maxRendererWidth, maxRendererHeight, customAsciiGradient = null) {
		if (customAsciiGradient) this.asciiGradient = customAsciiGradient

		this.rendererTarget = htmlRendererTarget
		this.fontSize = maxRendererWidth / charsByLine
		this.renderConfig = { width: maxRendererWidth / this.fontSize, height: maxRendererHeight / this.fontSize }
		this.mediaConfig = { audio: false, video: this.renderConfig }
	}

	// ===================================
	// Renderer types
	// ===================================
	renderLive() {
		navigator.mediaDevices.getUserMedia(this.mediaConfig).then(mediaStream => {
			this.renderVideoStream(mediaStream)
		})
	}

	renderVideoStream(videoStream) {
		const video = document.createElement('video')
		video.setAttribute('autoplay', '')
		video.setAttribute('muted', '')
		video.setAttribute('playsinline', '')
		video.width = this.renderConfig.width
		video.height = this.renderConfig.height
		video.srcObject = videoStream

		const step = () => {
			this.fillTargetWithAscii(video)
			requestAnimationFrame(step)
		}

		video.addEventListener('play', () => {
			requestAnimationFrame(step)
		})

		video.play()
	}

	renderImage(imageSrc) {
		const image = new Image(this.renderConfig.width, this.renderConfig.height)
		image.src = imageSrc

		image.onload = () => {
			this.fillTargetWithAscii(image)
		}
	}

	// ===================================
	// Main rendering ascii
	// ===================================
	fillTargetWithAscii(image) {
		this.rendererTarget.innerText = ''

		const pixels = this.getPixels(image)

		this.rendererTarget.style.fontSize = this.fontSize + 'px'

		let row = ''

		for (let i = 0; i < image.height; i++) {
			for (let j = 0; j < image.width; j++) {
				// Get pixel color rgba
				const pixelColorIdx = (j + i * image.width) * 4
				const r = pixels[pixelColorIdx]
				const g = pixels[pixelColorIdx + 1]
				const b = pixels[pixelColorIdx + 2]
				// const a = pixels[pixelColorIdx+3];

				// Get ascii char
				const colorAvg = (r + g + b) / 3
				const asciiChar = this.getAsciiCharFromValue(colorAvg)

				row += asciiChar
			}

			row += '\r\n'
		}

		this.rendererTarget.innerText += row
	}

	// ===================================
	// Helper methods
	// ===================================
	getPixels(imageToGetData) {
		const innerCanvas = document.createElement('canvas')
		const innerCtx = innerCanvas.getContext('2d')
		innerCanvas.width = imageToGetData.width
		innerCanvas.height = imageToGetData.height
		innerCtx.drawImage(imageToGetData, 0, 0, imageToGetData.width, imageToGetData.height)
		const imageInfo = innerCtx.getImageData(0, 0, imageToGetData.width, imageToGetData.height)
		return imageInfo.data
	}

	getAsciiCharFromValue(value) {
		// Keep in bounds
		value = Math.max(0, value)
		value = Math.min(255.9, value)

		const asciiCharIdx = Math.floor((value * this.asciiGradient.length) / 256)
		// const asciiCharIdx  = Math.floor( value % this.asciiGradient.length )
		const asciiChar = this.asciiGradient[asciiCharIdx]

		return asciiChar
	}
}

// ==========================================
// Demostration only - Uncomment desired one
// ==========================================
const CHARS_ENUM = {
	DEFAULT: '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/|()1{}[]?-_+~<>i!lI;:,"^`.                          ',
	SIMPLE: '█▓▒░ ',
	SOFT: '<>[]{}()¯`´¨^~-=_+";:,.!*^',
	MID: '}#*$+""!^~[]()/|<>_;,-.`\'',
	ALPHA: '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/|()1{}[]?-_+~<>i!lI;:,"^`.',
	ALPHA_CONTRAST: '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/|()1{}[]?-_+~<>i!lI;:,"^`.                          ',
	DENSE: '█▓▒░#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/|()1{}[]¯`´¨^~-=_+";:,.!*^$#@%&',
	PIRAMIDAL: '▁▂▃▄▅▆▇█▇▆▅▄▃▂▁▂▃▄▅▆▇█▇▆▅▄▃▂▁▂▃▄▅▆▇█▇▆▅▄▃▂▁▂▃▄▅▆▇█',
	LINEAR: '░▒▓█▄▀▌▐─│┌┐└┘├┤┬┴┼',
	LINEAR_CONTRAST: '░▒▓█▄▀▌▐─│┌┐└┘├┤┬┴┼'
}

const RESOLUTION_ENUM = {
	LOW: window.innerWidth * 0.1,
	MID: window.innerWidth * 0.14,
	HIGHT: window.innerWidth * 0.18
}

// ====================
// Config:
// ====================
const url = new URL(location.href)
const params = new URLSearchParams(url.search)
const charsByLine = RESOLUTION_ENUM[params.get('resolution')?.toUpperCase()] || RESOLUTION_ENUM.MID
const asciiGradient = CHARS_ENUM[params.get('gradient')?.toUpperCase()] || CHARS_ENUM.ALPHA_CONTRAST

// ====================
// Init
// ====================
const asciiContainerElement = document.querySelector('.ascii')
const { width, height } = asciiContainerElement.getBoundingClientRect()
const asciiRenderer = new AsciiRenderer(charsByLine, asciiContainerElement, width, height, asciiGradient)
asciiRenderer.renderLive()

// ====================
// GUI
// ====================
const gui = new dat.GUI({ name: 'Ascii Live Renderer' })
const config = gui.addFolder('Config')
config.add(asciiRenderer, 'asciiGradient', Object.keys(CHARS_ENUM)).name('Gradient')

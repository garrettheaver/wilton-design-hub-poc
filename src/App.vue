<template>
  <div class="root">
    <div class="controls">
      <div class="selector">
        <select name="image" @change="onSelectImage" v-model="name">
          <option v-for="name in images" :key="name" :value="name">{{ name }}</option>
        </select>
      </div>
      <div>
      <color-changer class="changer" 
        v-for="(color, index) in colors" 
        :key="index" 
        :index="index" 
        :color="color" 
        @colorChange="onColorChange" />
      </div>
      <div class="dropper">
        <label for="useHalfDrop">Use "Half Drop" Tiling</label>
        <input type="checkbox" id="useHalfDrop" v-model="useHalfDrop" @change="onOptChange">
      </div>
      <div class="texture">
        <label for="useTexture">Use Carpet "Texture" Mapping</label>
        <input type="checkbox" id="useTexture" v-model="useTexture" @change="onOptChange">
      </div>
    </div>
    <div class="canvas">
      <canvas ref="single">
      </canvas>
      <br />
      <canvas ref="drop">
      </canvas>
      <br />
      <canvas ref="tiled">
      </canvas>
    </div>
    <div class="visual-tab visual-3d show">
        <div class="pattern-container room room-1 show">
          <div class="room-overlay overlay-room-1"></div>
          <div class="pattern" id="room1_3d_pattern" ref="threeDView"></div>
        </div>
      </div>
  </div>
</template>

<script>
import ColorChanger from './ColorChanger.vue'
import IndexedPNG from './png-js.browser.es.min'

export default {
  components: { ColorChanger },
  data() {
    return {
      name: '',
      useTexture: false,
      useHalfDrop: false,
      image: '',
      texture: '',
      palette: [],
      images: [
        'AC15918',
        'AC16054',
        'AC16439',
        '28611-300',
        '28612-89',
        '28613-73',
        '28614-13',
        '28615-36',
        '28616-89',
        '28617-300',
        '28618-88',
        '28619-77',
        '28620-76',
        '69432-14'
      ]
    }
  },
  methods: {
    async onSelectImage(event) {
      this.useTexture = false
      this.useHalfDrop = false
      await this.setImage(event.target.value)
    },
    async onOptChange(event) {
      await this.setPalette(this.palette)
    },
    async setImage(name) {
      this.name = name
      this.image = ''
      this.palette = []
      
      await this.loadImage(name)
      await this.setPalette(this.image.decodedPalette)
    },
    async loadImage(name) {
      this.original = await fetch(`assets/${name}.indexed.png`)
        .then(res => res.arrayBuffer())
        .then(buffer => new IndexedPNG(new Uint8ClampedArray(buffer)))
        .then(png => {
          png.decode()
          this.image = png
          return png
        })
    },
    async setPalette(newPalette) {
      this.palette = newPalette
      this.original.toImageData({
        palette: this.palette
      })
      .then(png => {
        const singleCanvas = this.$refs.single
        singleCanvas.width = png.width
        singleCanvas.height = png.height

        const tempContext = singleCanvas.getContext('2d')
        tempContext.putImageData(png, 0, 0)

        const dropCanvas = this.$refs.drop
        dropCanvas.width = png.width * 2
        dropCanvas.height = png.height
        
        const dropContext = dropCanvas.getContext('2d')
        dropContext.putImageData(png, 0, 0)

        const dropHeight = this.useHalfDrop ? png.height / 2 : 0
        dropContext.putImageData(png, png.width, -dropHeight)
        dropContext.putImageData(png, png.width, dropHeight)

        const tiledCanvas = this.$refs.tiled
        const threeDView = this.$refs.threeDView

        tiledCanvas.height = window.innerHeight
        tiledCanvas.width = tiledCanvas.parentElement.clientWidth - 5

        const useTexture = this.useTexture
        const texture = this.texture

        const img = new Image()
        img.src = dropCanvas.toDataURL('image/png')
        
        img.onload = function() {
          const context = tiledCanvas.getContext('2d')
          context.fillStyle = context.createPattern(img, 'repeat')
          context.fillRect(0, 0, tiledCanvas.width, tiledCanvas.height)

          if (useTexture) {
            context.filter = "brightness(1.5)"
            context.globalCompositeOperation = 'multiply'
            context.fillStyle = context.createPattern(texture, 'repeat')
            context.fillRect(0, 0, tiledCanvas.width, tiledCanvas.height)
          }

          threeDView.style = `background-image: url(${tiledCanvas.toDataURL('image/png')})`
        }
      })
    },
    async loadTexture() {
      if (this.texture !== '') {
        return Promise.resolve()
      }

      return new Promise((resolve, reject) => {
          this.texture = new Image()
          this.texture.src = "assets/texture.png"
          this.texture.onload = function () {
            resolve()
          }
      })
    },
    onColorChange(newColor) {
      const newPalette = Uint8Array.from(this.palette)
      const colorOffset = newColor.index * 4
      newPalette[colorOffset] = newColor.color[0]
      newPalette[colorOffset + 1] = newColor.color[1]
      newPalette[colorOffset + 2] = newColor.color[2]
      newPalette[colorOffset + 3] = newColor.color[3]
      this.setPalette(newPalette)
    }
  },
  computed: {
    colors() {
      const chunks = []
      const palette = this.palette || []
      for (let i = 0; i < palette.length; i += 4) {
          chunks.push(palette.slice(i, i + 4))
      }
      return chunks
    }
  },
  async mounted() {
    await this.loadTexture()
    await this.setImage('28616-89')
  }
}
</script>

<style>
body {
  padding: 0 5px;
}
</style>

<style scoped>
.canvas {
  margin: 5px 0;
}

canvas {
  margin: 5px 0;
}

.selector {
  margin-bottom: 15px;
}

.dropper {
  margin: 5px 0;
}

.changer, .dropper label {
  margin-right: 5px;
}

.visual-tab {
  -webkit-transition: all 0.3s ease-in-out;
  -moz-transition: all 0.3s ease-in-out;
  -o-transition: all 0.3s ease-in-out;
  transition: all 0.3s ease-in-out;
  height: 380px;
  z-index: -1;
}

.visual-tab .pattern-container {
  border: 1px solid #DFDFDF;
  height: 430px;
  overflow: hidden;
  position: absolute;
  width: 570px;
}

.visual-tab.visual-3d .room-1 .overlay-room-1:before {
  background: url("/assets/room-1-background-shadows.png");
}

.visual-tab.visual-3d .room-overlay:before {
  content: '';
  height: 100%;
  position: absolute;
  width: 100%;
}

.visual-tab.visual-3d .room-1 .overlay-room-1:after {
  background: url("/assets/room-1-background.png") top center no-repeat;
}

.visual-tab.visual-3d .room-overlay:after {
  content: '';
  height: 100%;
  position: absolute;
  width: 100%;
}

.visual-tab .room-1 .pattern {
  -moz-transform: perspective(720px) rotateX(70deg) skewX(4deg) skewY(-20deg);
  -o-transform: perspective(720px) rotateX(70deg) skewX(4deg) skewY(-20deg);
  -ms-transform: perspective(720px) rotateX(70deg) skewX(4deg) skewY(-20deg);
  -webkit-transform: perspective(720px) rotateX(70deg) skewX(4deg) skewY(-20deg);
  transform: perspective(720px) rotateX(70deg) skewX(4deg) skewY(-20deg);
  background: #A0A0A0;
  height: 2860px;
  margin: -1030px 0px 0px -770px;
  width: 1590px;
}

.visual-tab.visual-3d .room-overlay {
  height: 100%;
  position: absolute;
  width: 100%;
  z-index: 9;
}
</style>
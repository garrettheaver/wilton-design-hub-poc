<template>
  <div class="root">
    <div class="controls">
      <div class="selector">
        <select name="image" @change="onSelectImage">
          <option v-for="name in images" :key="name" :value="name">{{ name }}</option>
        </select>
      </div>
      <color-changer class="changer" 
        v-for="(color, index) in colors" 
        :key="index" 
        :index="index" 
        :color="color" 
        @colorChange="onColorChange" />
    </div>
    <div class="canvas">
      <canvas ref="canvas" height="999" width="800">
      </canvas>
    </div>
  </div>
</template>

<script>
import ColorChanger from './ColorChanger.vue'
import IndexedPNG from './png-js.browser.es'

export default {
  components: { ColorChanger },
  data() {
    return {
      image: '',
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
        '28620-76'
      ]
    }
  },
  methods: {
    async onSelectImage(event) {
      this.setImage(event.target.value)
    },
    async setImage(name) {
      const context = this.$refs.canvas.getContext('2d')
      context.clearRect(0, 0, 9999, 9999)

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
        var t1 = performance.now();
        const context = this.$refs.canvas.getContext('2d')
        context.putImageData(png, 0, 0)
      });
    },
    onColorChange(newColor) {
      console.log(newColor)
      const newPalette = Uint8Array.from(this.palette)
      const colorOffset = newColor.index * 4
      newPalette[colorOffset] = newColor.color[0]
      newPalette[colorOffset + 1] = newColor.color[1]
      newPalette[colorOffset + 2] = newColor.color[2]
      newPalette[colorOffset + 3] = newColor.color[3]
      this.setPalette(newPalette);
    }
  },
  computed: {
    colors() {
      const chunks = [];
      const palette = this.palette || []
      for (let i = 0; i < palette.length; i += 4) {
          chunks.push(palette.slice(i, i + 4))
      }
      return chunks;
    }
  },
  async mounted() {
    await this.setImage('AC15918')
  }
}
</script>

<style scoped>
.controls {
  margin-bottom: 10px;
}

.selector {
  margin-bottom: 10px;
}

.changer {
  margin-right: 5px;
}
</style>
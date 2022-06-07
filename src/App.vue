<template>
  <div class="root" style="display: flex">
    <div>
      <canvas ref="canvas" height="999" width="800">
      </canvas>
    </div>
    <div>
      <div class="images">
        <button @click="setImage('AC15918')">AC15918</button>
        <button @click="setImage('AC16054')">AC16054</button>
        <button @click="setImage('AC16439')">AC16439</button>
      </div>
      <color-changer class="changer" v-for="(color, index) in colors" :key="index" :index="index" :color="color" @colorChange="onColorChange"></color-changer>
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
      palette: []
    }
  },
  methods: {
    async setImage(name) {
      this.$refs.canvas.getContext('2d').clearRect(0, 0, 9999, 9999)

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
        this.$refs.canvas.getContext('2d').putImageData(png, 0, 0)
      });
    },
    onColorChange(newColor) {
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
.root > div {
  margin: 0 20px
}

.images, .changer {
  margin: 10px 0;
}

.images button {
  margin-right: 5px;
}
</style>

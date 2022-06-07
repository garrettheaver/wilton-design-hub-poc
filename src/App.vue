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
      original: ''
    }
  },
  methods: {
    async setImage(name) {
      this.$refs.canvas.getContext('2d').clearRect(0, 0, 9999, 9999);
      this.original = ''
      
      await this.loadImage(name)
      await this.setPalette(this.original.decodedPalette)
    },
    async loadImage(name) {
      this.original = await fetch(`/assets/${name}.indexed.png`)
        .then(res => res.arrayBuffer())
        .then(buffer => new IndexedPNG(new Uint8ClampedArray(buffer)))
        .then(png => {
          png.decode()
          return png
        })
    },
    async setPalette(palette) {
      this.original.toImageData({
        palette
      })
      .then(png => {
        this.$refs.canvas.getContext('2d').putImageData(png, 0, 0);
      });
    },
    async swapPalette() {
      await this.setPalette(this.original.decodedPalette.reverse())
    },
    onColorChange(newColor) {
      const newPalette = Uint8ClampedArray.from(this.original.decodedPalette)
      const colorOffset = newColor.index * 4
      newPalette[colorOffset] = newColor.color[0]
      newPalette[colorOffset + 1] = newColor.color[1]
      newPalette[colorOffset + 2] = newColor.color[2]
      newPalette[colorOffset + 3] = newColor.color[3]
      this.setPalette(newPalette);
    }
  },
  computed: {
    palette() {
      return this.original?.decodedPalette ?? []
    },
    colors() {
      const chunks = [];
      for (let i = 0; i < this.palette.length; i += 4) {
          chunks.push(this.palette.slice(i, i + 4));
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

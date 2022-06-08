<template>
    <VSwatches v-model="colour"
        trigger-style="border: 1px black solid"
        swatches="text-advanced"
        show-fallback="true"
        @update:modelValue="onChange" />
</template>

<script>
import VSwatches from 'vue3-swatches'
import 'vue-swatches/dist/vue-swatches.css'

export default {
    components: {
        VSwatches
    },
    props: {
        index: {
            type: Number
        },
        color: {
            type: Uint8Array
        }
    },
    data() {
        return {
            colour: "#" + ((1 << 24) + (this.color[0] << 16) + (this.color[1] << 8) + this.color[2]).toString(16).slice(1),
            alpha: this.color[3]
        }
    },
    methods: {
        onChange(color) {
            console.log(color)
            var aRgbHex = color.match(/[^#]{2}/g)
            console.log(aRgbHex)
            this.$emit('colorChange', {
                index: this.index,
                color: [
                    parseInt(aRgbHex[0], 16),
                    parseInt(aRgbHex[1], 16),
                    parseInt(aRgbHex[2], 16),
                    this.alpha
                ]
            })
        }
    }
}
</script>

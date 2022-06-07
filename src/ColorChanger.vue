<template>
    <div>
        <label class="label">{{ index + 1 }}</label>
        <input type="number" @change="onChange" v-model="red" min="0" max="255" />
        <input type="number" @change="onChange" v-model="green" min="0" max="255" />
        <input type="number" @change="onChange" v-model="blue" min="0" max="255" />
    </div>
</template>

<script>
export default {
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
            red: this.color[0],
            green: this.color[1],
            blue: this.color[2],
            alpha: this.color[3]
        }
    },
    methods: {
        onChange() {
            this.$emit('colorChange', {
                index: this.index,
                color: [this.red, this.green, this.blue, this.alpha]
            })
        }
    }
}
</script>

<style scoped>
label, input {
    margin-right: 10px;
}
</style>
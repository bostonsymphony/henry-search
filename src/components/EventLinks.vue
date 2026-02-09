<script setup>

import AudioLinks from "./AudioLinks.vue"
import formatDate from '../composables/formatDate'

const props = defineProps({
    item: {
        type: Object,
        require: true
    },
    extraClasses: {
        type: String,
        default: ""
    },
    detail: {
        type: Boolean,
        default: false
    }
})

const showAudioLinks = (event) => {
    event.stopPropagation()
    const audioLinkBox = event.currentTarget.parentElement.querySelector(".audioLinks__box")
    audioLinkBox.classList.toggle("-open")
}

const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href)
    const htmlHolder = document.querySelector('#copy_link').innerHTML
    document.querySelector('#copy_link').innerHTML = "URL Copied!"
    setTimeout(() => {
        document.querySelector('#copy_link').innerHTML = htmlHolder
    }, 1000)
}


</script>

<template>
    <template v-if="props.detail">
        <div class="headerLinks__media">
            <template v-if="props.item.program_book_link">
                <a :href="props.item.program_book_link" target="_blank">
                    <svg class="headerLinks__icon" width="24" height="24" viewBox="-1 -1 26 26" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="12" />
                        <path d="M8.30469 16.0947L15.8468 8.55259" stroke-width="2" fill="none"/>
                        <path d="M8.30469 8.55127L15.847 8.55144L15.8472 16.0937" stroke-width="2" fill="none"/>
                    </svg>
                    View Program Book
                </a>
            </template>
            <template v-if="props.item.media && props.item.media.includes('audio') && props.item.bso_audio_id">
                <a @click="showAudioLinks">
                    <svg class="headerLinks__icon" width="24" height="24" viewBox="-1 -1 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="12"/>
                        <path d="M13.081 6.66675L9.23961 9.73985H6.1665V14.3495H9.23961L13.081 17.4226V6.66675Z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                        <path d="M16.5688 9.32495C17.289 10.0453 17.6936 11.0222 17.6936 12.0408C17.6936 13.0594 17.289 14.0363 16.5688 14.7567" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                    </svg>
                    Access Audio</a>
                <audio-links :audio-id="props.item.bso_audio_id" />
                
            </template>
        </div>
        <a @click="copyUrl()" id="copy_link">
            <svg width="24" height="24" viewBox="-1 -1 26 26" fill="none" xmlns="http://www.w3.org/2000/svg" class="headerLinks__icon">
                <circle cx="12" cy="12" r="12" />
                <path d="M10.8982 12.0536C11.136 12.3715 11.4393 12.6345 11.7877 12.8249C12.1361 13.0152 12.5213 13.1284 12.9173 13.1567C13.3132 13.1851 13.7106 13.128 14.0826 12.9892C14.4545 12.8505 14.7923 12.6334 15.0729 12.3526L16.7339 10.6916C17.2382 10.1695 17.5172 9.47018 17.5109 8.74432C17.5046 8.01846 17.2135 7.32412 16.7002 6.81084C16.1869 6.29756 15.4926 6.00641 14.7667 6.0001C14.0409 5.9938 13.3416 6.27283 12.8194 6.77712L11.8671 7.7239" stroke-linecap="round" fill="none" stroke-linejoin="round" stroke-width="1.5"/>
                <path d="M13.1129 10.9466C12.8751 10.6287 12.5717 10.3657 12.2233 10.1754C11.875 9.98504 11.4897 9.87186 11.0938 9.8435C10.6978 9.81514 10.3004 9.87227 9.92847 10.011C9.55654 10.1498 9.21879 10.3669 8.93814 10.6476L7.27712 12.3086C6.77283 12.8308 6.4938 13.5301 6.5001 14.2559C6.50641 14.9818 6.79756 15.6761 7.31084 16.1894C7.82412 16.7027 8.51846 16.9938 9.24432 17.0001C9.97018 17.0064 10.6695 16.7274 11.1916 16.2231L12.1384 15.2763" stroke-linecap="round" fill="none" stroke-linejoin="round"  stroke-width="1.5"/>
            </svg>
            Copy URL
        </a>
    </template>
    <template v-else>
        <div :class="`eventLinks ${ props.extraClasses }`">
            <a class="eventLinks__details" :href="`/details?performanceId=${props.item.id}`" :title="formatDate(item.performance_date) + ' Details'">
                <svg class="eventLinks__icon" width="18" height="18" viewBox="-1 -1 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="9" cy="9" r="9" />
                    <path d="M4.85706 9H12.8571" stroke-width="1.5" fill="none"/>
                    <path d="M8.85706 5L12.8571 9L8.85706 13" stroke-width="1.5" fill="none"/>
                </svg>
                Details
            </a>
        </div>
        <div v-if="props.item.program_book_link" :class="`eventLinks ${ props.extraClasses }`">
            <a class="eventLinks__details" target="_blank" :href="props.item.program_book_link" :title="formatDate(item.performance_date) + ' Details'">
                <svg class="eventLinks__icon" width="18" height="18" viewBox="-1 -1 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="9" cy="9" r="9" />
                    <path d="M6.22876 12.0714L11.8854 6.41475" stroke-width="1.5" fill="none"/>
                    <path d="M6.22864 6.41376L11.8854 6.41388L11.8855 12.0706" stroke-width="1.5" fill="none"/>
                </svg>

                Program
            </a>
        </div>
        <div v-if="props.item.media && props.item.media.includes('audio') && props.item.bso_audio_id" :class="`eventLinks ${ props.extraClasses }`">
            <button class="eventLinks__details" @click="showAudioLinks"  :title="formatDate(item.performance_date) + ' Audio'">
                <svg class="eventLinks__icon" width="18" height="18" viewBox="-1 -1 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="9" cy="9" r="9" />
                    <path d="M9.81086 5L6.92983 7.30483H4.625V10.7621H6.92983L9.81086 13.0669V5Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                    <path d="M12.4268 6.99219C12.9669 7.53246 13.2703 8.26513 13.2703 9.02908C13.2703 9.79302 12.9669 10.5257 12.4268 11.066" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                </svg>

                Audio
            </button>
            <audio-links :audio-id="props.item.bso_audio_id" />

        </div>
    </template>
    
</template>
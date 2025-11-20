<script setup>

import AudioLinks from "./AudioLinks.vue"

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

function showAudioLinks(event) {
    event.stopPropagation()
    const audioLinkBox = event.currentTarget.parentElement.querySelector(".audioLinkBox")
    audioLinkBox.classList.toggle("-open")
}


</script>

<template>
    <template v-if="props.detail">
        <div class="media">
            <template v-if="props.item.program_link">
                <a :href="props.item.program_link" target="_new">
                    <svg class="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="12" fill="#01ABE6"/>
                        <path d="M8.30469 16.0947L15.8468 8.55259" stroke="white" stroke-width="2"/>
                        <path d="M8.30469 8.55127L15.847 8.55144L15.8472 16.0937" stroke="white" stroke-width="2"/>
                    </svg>
                    View Program Book
                </a>
            </template>
            <template v-if="props.item.media && props.item.media.includes('audio') && props.item.bso_audio_id">
                <a @click="showAudioLinks">
                    <svg class="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="12" fill="#01ABE6"/>
                        <path d="M13.081 6.66675L9.23961 9.73985H6.1665V14.3495H9.23961L13.081 17.4226V6.66675Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M16.5688 9.32495C17.289 10.0453 17.6936 11.0222 17.6936 12.0408C17.6936 13.0594 17.289 14.0363 16.5688 14.7567" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Access Audio</a>
                <audio-links :audio-id="props.item.bso_audio_id" />
                
            </template>
        </div>
        <a onclick="navigator.clipboard.writeText(window.location.href);">
            <svg class="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="11.25" fill="white" stroke="#01ABE6" stroke-width="1.5"/>
                <path d="M11.0835 12.6969C11.3142 13.0223 11.6086 13.2915 11.9466 13.4864C12.2846 13.6812 12.6584 13.797 13.0427 13.8261C13.4269 13.8551 13.8125 13.7966 14.1734 13.6546C14.5343 13.5126 14.862 13.2903 15.1343 13.0029L16.7461 11.3026C17.2354 10.7681 17.5062 10.0523 17.5 9.30925C17.4939 8.56622 17.2114 7.85545 16.7134 7.33002C16.2153 6.8046 15.5416 6.50656 14.8372 6.50011C14.1329 6.49365 13.4544 6.77929 12.9477 7.2955L12.0237 8.26469" stroke="#01ABE6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M13.8333 11.3032C13.5696 10.9778 13.2332 10.7085 12.8469 10.5137C12.4606 10.3189 12.0334 10.203 11.5943 10.174C11.1552 10.145 10.7145 10.2034 10.302 10.3455C9.88955 10.4875 9.515 10.7097 9.20377 10.9971L7.36178 12.6975C6.80256 13.2319 6.49312 13.9478 6.50012 14.6908C6.50711 15.4338 6.82998 16.1446 7.39918 16.67C7.96838 17.1955 8.73837 17.4935 9.54331 17.5C10.3483 17.5064 11.1237 17.2208 11.7027 16.7046L12.7527 15.7354" stroke="#01ABE6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Copy URL
        </a>
    </template>
    <template v-else>
        <div :class="`eventsSearch__perfDetails ${ props.extraClasses }`">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="9" cy="9" r="9" fill="#01ABE6"/>
                <path d="M5 9H13" stroke="white" stroke-width="1.5"/>
                <path d="M9 5L13 9L9 13" stroke="white" stroke-width="1.5"/>
            </svg>
            <a class="detailsLink" :href="`/details?performanceId=${props.item.id}`">Details</a>
        </div>
        <div v-if="props.item.program_book_link" :class="`eventsSearch__perfDetails ${ props.extraClasses }`">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="9" cy="9" r="8.25" fill="white" stroke="#01ABE6" stroke-width="1.5"/>
            <path d="M6.22876 12.0713L11.8854 6.41469" stroke="#01ABE6" stroke-width="1.5"/>
            <path d="M6.22864 6.41382L11.8854 6.41395L11.8855 12.0707" stroke="#01ABE6" stroke-width="1.5"/>
        </svg>
        <a class="detailsLink" target="_new" :href="props.item.program_book_link">Program</a>
        </div>
        <div v-if="props.item.media && props.item.media.includes('audio') && props.item.bso_audio_id" :class="`eventsSearch__perfDetails ${ props.extraClasses }`">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="9" cy="9" r="8.25" fill="white" stroke="#01ABE6" stroke-width="1.5"/>
                <path d="M9.81086 5L6.92983 7.30483H4.625V10.7621H6.92983L9.81086 13.0669V5Z" fill="white" stroke="#01ABE6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12.4268 6.99219C12.9669 7.53246 13.2703 8.26513 13.2703 9.02908C13.2703 9.79302 12.9669 10.5257 12.4268 11.066" fill="white"/>
                <path d="M12.4268 6.99219C12.9669 7.53246 13.2703 8.26513 13.2703 9.02908C13.2703 9.79302 12.9669 10.5257 12.4268 11.066" stroke="#01ABE6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <a class="detailsLink" @click="showAudioLinks">Audio</a>
            <audio-links :audio-id="props.item.bso_audio_id" />

        </div>
    </template>
    
</template>
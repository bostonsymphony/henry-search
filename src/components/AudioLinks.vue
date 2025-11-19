<script setup>

const props = defineProps({
    audioId: {
        type: Number,
        require: true
    }
})

</script>

<template>
    <div class="audioLinkBox">
        <div class="audioLinks">                            
            <span class="audioLabel -first">Public</span>
                <a href="https://forms.office.com/pages/responsepage.aspx?id=OdIW0TyQrUiHfXYXUGXf-OBndBFJDdZNtXXrOlwA-shUNVBBNjZNQkozSEw2SUs3SFU1Q1I2R1VQTCQlQCN0PWcu&fswReload=1&fswNavStart=1674745526953" class="audioLink -first">Request Form<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.82893 8.48571L8.48553 2.82911" stroke="#01ABE6" stroke-width="1.5"/>
                <path d="M2.8288 2.82799L8.48553 2.82812L8.48566 8.48485" stroke="#01ABE6" stroke-width="1.5"/>
                </svg>
            </a>
            <span class="audioLabel">BSO Staff</span>
            <a :href="`https://bso.netx.net/app/#search/exact/${ props.audioId }-A`" class="audioLink">Login<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.82893 8.48571L8.48553 2.82911" stroke="#01ABE6" stroke-width="1.5"/>
                <path d="M2.8288 2.82799L8.48553 2.82812L8.48566 8.48485" stroke="#01ABE6" stroke-width="1.5"/>
                </svg>
            </a>
        </div>
    </div>
</template>
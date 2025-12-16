<script setup>
import { ref } from 'vue'

import formatDate from '../composables/formatDate'
import formatSearchTitle from '../composables/formatSearchTitle'

const props = defineProps({
    performanceIndex: {
      type: String,
      default: "archived_performances"
    },
    artistIndex: {
        type: String,
        default: "artists"
    },
    workIndex: {
        type: String,
        default: "works"
    }
})

const searchHistory = ref(JSON.parse(sessionStorage.getItem('searchHistory')))


const filterHistory = (indexName) => {
    if (searchHistory.value) {
        return searchHistory.value.filter((item) => {
            let returnItem = false
            Object.entries(item.uiState).forEach(([k, v]) => {
                if (k == indexName && !returnItem) {
                    returnItem = true
                }
            })
            return returnItem
        })
    } else {
        return null
    }
    
}

</script>

<template>
    <div v-if="searchHistory" class="history__grid">
        <div class="history__performances" v-if="filterHistory(props.performanceIndex).length">
            <template v-for="item, index in filterHistory(props.performanceIndex)">
                <h4 v-if="index == 0">Performances</h4>
                <div class="history__item"  v-if="formatSearchTitle(item?.uiState[props.performanceIndex]).length">
                    <a :href="item.link">{{ formatSearchTitle(item?.uiState[props.performanceIndex]) }}</a><br/>
                    {{ formatDate((new Date(item.date)).getTime() / 1000, 'history', false) }}
                </div>
            </template>
        </div>
        <div class="history__artists" v-if="filterHistory(props.artistIndex).length">
            <template class="history__item" v-for="item, index in filterHistory(props.artistIndex)">
                <h4 v-if="index == 0">Artists</h4>
                <div v-if="formatSearchTitle(item?.uiState[props.artistIndex]).length">
                    <a :href="item.link">{{ formatSearchTitle(item?.uiState[props.artistIndex]) }}</a><br/>
                    {{ formatDate((new Date(item.date)).getTime() / 1000, 'history', false) }}
                </div>
            </template>
        </div>
        <div class="history__works" v-if="filterHistory(props.workIndex).length">
            <template v-for="item, index in filterHistory(props.workIndex)">
                <h4 v-if="index == 0">Works</h4>
                <div class="history__item" v-if="formatSearchTitle(item?.uiState[props.workIndex]).length">
                    <a :href="item.link">{{ formatSearchTitle(item?.uiState[props.workIndex]) }}</a><br/>
                    {{ formatDate((new Date(item.date)).getTime() / 1000, 'history', false) }}
                </div>
            </template>
        </div>
    </div>
    <div v-else>
        <h4>No current search history</h4>
    </div>

</template>
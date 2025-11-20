<script setup>

import formatDate from '../composables/formatDate'

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

const searchHistory = JSON.parse(sessionStorage.getItem('searchHistory'))


function filterHistory(indexName) {
    if (searchHistory) {
        return searchHistory.filter((item) => {
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

function formatItem(state) {
    console.log(state)
    let searchName = state.query ? '"' + state.query + '"' : ""
    if (state.refinementList) {
        Object.entries(state.refinementList).forEach(([k1, v1]) => {
            if (searchName != "") {
                searchName += "; "
            }
            if (Array.isArray(v1)) {
                searchName += " " + v1.join(", ") 
            } else {
                searchName += " " + v1;
            }
            
        })
    }
    if (state.menu) {
        Object.entries(state.menu).forEach(([k1, v1]) => {
            if (searchName != "") {
                searchName += "; "
            }
            if (Array.isArray(v1)) {
                searchName += " " + v1.join(", ") 
            } else {
                searchName += " " + v1;
            }
        })
    }
    if (state.range) {
        Object.entries(state.range).forEach(([k1, v1]) => {
            const dateRange = v1.split(':');
            if (searchName != "") {
                searchName += "; "
            }
            searchName += " " + formatDate(dateRange[0]) + " to " + ( dateRange[1].length ? formatDate(dateRange[0]) : "Present" );
        })
    }
    
    return searchName.trim()
}

</script>

<template>
    <div v-if="searchHistory" class="history__grid">
        <div class="history__performances">
            <template v-for="item, index in filterHistory(props.performanceIndex)">
                <h4 v-if="index == 0">Performances</h4>
                <div class="history__item"  v-if="formatItem(item?.uiState[props.performanceIndex]).length">
                    <a :href="item.link">{{ formatItem(item?.uiState[props.performanceIndex]) }}</a><br/>
                    {{ formatDate((new Date(item.date)).getTime() / 1000, true, false) }}
                </div>
            </template>
        </div>
        <div class="history__artists">
            <template class="history__item" v-for="item, index in filterHistory(props.artistIndex)">
                <h4 v-if="index == 0">Artists</h4>
                <div v-if="formatItem(item?.uiState[props.artistIndex]).length">
                    <a :href="item.link">{{ formatItem(item?.uiState[props.artistIndex]) }}</a><br/>
                    {{ formatDate((new Date(item.date)).getTime() / 1000, true, false) }}
                </div>
            </template>
        </div>
        <div class="history__works">
            <template v-for="item, index in filterHistory(props.workIndex)">
                <h4 v-if="index == 0">Works</h4>
                <div class="history__item" v-if="formatItem(item?.uiState[props.workIndex]).length">
                    <a :href="item.link">{{ formatItem(item?.uiState[props.workIndex]) }}</a><br/>
                    {{ formatDate((new Date(item.date)).getTime() / 1000, true, false) }}
                </div>
            </template>
        </div>
    </div>
    <div v-else>
        <h5>No current search history</h5>
    </div>

</template>
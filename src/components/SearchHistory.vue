<script setup>

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
            console.log("v1", v1)
            if (Array.isArray(v1)) {
                searchName += " " + v1.join(", ") 
            } else {
                searchName += " " + v1;
            }
            
        })
    }
    if (state.menu) {
        Object.entries(state.menu).forEach(([k1, v1]) => {
            if (Array.isArray(v1)) {
                searchName += " " + v1.join(", ") 
            } else {
                searchName += " " + v1;
            }
        })
    }
    
    return searchName
}

</script>

<template>
    <div class="performance__header"><h2>Search History</h2></div>
    <template v-if="searchHistory">
        <div v-for="item, index in filterHistory(props.performanceIndex)">
            <h6 v-if="index == 0">Performances</h6>
            <a :href="item.link">{{ formatItem(item?.uiState[props.performanceIndex]) }}</a><br/>
            {{ item.date }}
        </div>
        <div v-for="item, index in filterHistory(props.artistIndex)">
            <h6 v-if="index == 0">Artists</h6>
            <a :href="item.link">{{ formatItem(item?.uiState[props.artistIndex]) }}</a><br/>
            {{ item.date }}
        </div>
        <div v-for="item, index in filterHistory(props.workIndex)">
            <h6 v-if="index == 0">Works</h6>
            <a :href="item.link">{{ formatItem(item?.uiState[props.workIndex]) }}</a><br/>
            {{ item.date }}
        </div>
    </template>
    <div v-else>
        No current search history
    </div>

</template>
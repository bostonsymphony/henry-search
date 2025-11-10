<script setup>

const props = defineProps({
    performanceIndex: {
      type: String,
      default: "archived_performances"
    }
})

const searchHistory = JSON.parse(sessionStorage.getItem('searchHistory'))
const performanceHistory = searchHistory.filter((item) => {
    let returnItem = false
    Object.entries(item.uiState).forEach(([k, v]) => {
        if (k == props.performanceIndex && !returnItem) {
            returnItem = true
        }
    })
    return returnItem
})

function formatItem(state) {
    console.log(state)
    let searchName = state.query ? '"' + state.query + '"' : ""
    if (state.refinementList) {
        Object.entries(state.refinementList).forEach(([k1, v1]) => {
            searchName += " " + v1 
        })
    }
    if (state.menu) {
        Object.entries(state.menu).forEach(([k1, v1]) => {
            searchName += " " + v1 
        })
    }
    
    return searchName
}

</script>

<template>
    <div class="performance__header"><h2>Search History</h2></div>
    <h6>Performances</h6>
    <div v-for="item in performanceHistory">
        <a :href="item.link">{{ formatItem(item?.uiState[props.performanceIndex]) }}</a><br/>
        {{ item.date }}
    </div>
</template>
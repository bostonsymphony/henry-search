<script setup>

const searchHistory = JSON.parse(sessionStorage.getItem('searchHistory'))

// function formatItem(refinements) {

// }

</script>

<template>
    <div class="performance__header"><h2>Search History</h2></div>
    <div v-for="item in searchHistory">
        {{ item }}
    </div>
</template>
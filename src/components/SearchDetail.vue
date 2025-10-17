<script setup>

import TypesenseInstantSearchAdapter from 'typesense-instantsearch-adapter'
import Typesense from 'typesense'
import { ref, onMounted, onUnmounted, computed } from 'vue'

const searchResults = ref(null)


onMounted(() => {
    let client = new Typesense.Client({
        'nodes': [{
        'host': 'go8f04wi19tuvlyrp-1.a1.typesense.net',
        'port': '443',      
        'protocol': 'https'   
        }],
        'apiKey': 'YcX337xoj8b2col5BakYHqh1BIZrIsJH',
        'connectionTimeoutSeconds': 2
    })

    let searchParameters = {
       'q'            : '6634',
       'query_by'     : 'external_id',
    }

    // client.collections('archived_performances').documents().search(searchParameters).then(function (results) {
    //     searchResults.value = results
    //     console.log('searchResults', searchResults.value)
    // })
    client.collections('archived_performances').documents('9').retrieve().then(function (results) {
        searchResults.value = results
        console.log('searchResults', searchResults.value)
    })
})
 

</script>

<template>
    {{ JSON.stringify(searchResults) }}
</template>


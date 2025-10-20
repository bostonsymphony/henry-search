<script setup>

import TypesenseInstantSearchAdapter from 'typesense-instantsearch-adapter'
import Typesense from 'typesense'
import { ref, onMounted, onUnmounted, computed } from 'vue'

const props = defineProps({
    performanceId: {
        type: Number,
        required: true
    },
    indexName: {
      type: String,
      default: "archived_performances"
    }
})

const performance = ref(null)


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

    client.collections('archived_performances').documents(props.performanceId).retrieve().then(function (results) {
        performance.value = results
        console.log('searchResults', performance.value)
    }).catch(() => {
        document.location = '/404'
    })
})

  function formatDate(unix_timestamp) {
    // multiplied by 1000 so that the argument is in milliseconds, not seconds
    const date = new Date(unix_timestamp * 1000)
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

    return `${(months[date.getMonth()]).substring(0, 3)} ${date.getDay() + 1}, ${date.getFullYear()}`
  }


  function formatTime(unix_timestamp) {
    // multiplied by 1000 so that the argument is in milliseconds, not seconds
    const date = new Date(unix_timestamp * 1000)
    const hour = date.getHours() + 1 > 12 ? date.getHours() - 11 : date.getHours() + 1
    const amPm = date.getHours() + 1 > 12 ? "pm" : "am"
    const minutes = "0" + date.getMinutes()

    return `${hour}:${minutes.substr(-2)}${amPm}`

  }

  function formatLocation(venue, location) {
    const locationArray = [venue]
    if (location.city) {
        locationArray.push(location.city)
    }
    if (location.state) {
        locationArray.push(location.state)
    }
    if (location.country) {
        locationArray.push(location.country)
    }
    return locationArray.join(', ')
  }
 

</script>

<template>
    <div v-if="performance">
        <div class="performance__header">
            <h2>{{ formatDate(performance.performance_date) }} Performance Detail</h2>
            <h3>{{ formatTime(performance.performance_date) }} | {{ formatLocation(performance.venue, performance.location) }}</h3>
        </div>
        <div class="performance__headerLinks">
            <div class="peformance__mediaLinks">
                <div v-if="performance.program_link"><a :href="performance.program_link">View Program Book</a></div>
                <div v-if="performance.bso_audio_id"><a :href="`/request-audio?audioId=${performance.bso_audio_id}`">Access Audio</a></div>
            </div>
            <a onclick="navigator.clipboard.writeText(window.location.href);">Copy URL</a>
        </div>
        <div class="performance__headerData">
            <div><span class="performance__dataTitle">Season:</span><br/>{{ performance.season }}</div>
            <div><span class="performance__dataTitle">Orchestra/Ensemble:</span><br/>{{ performance.orchestra.join('; ') }}</div>
            <div><span class="performance__dataTitle">Conductor:</span><br/>{{ performance.conductor.join(', ') }}</div>
            <div><span class="performance__dataTitle">Event Title:</span><br/>{{ performance.event_title ?? '---' }}</div>
            <div><span class="performance__dataTitle">Event Type:</span><br/>{{ performance.event_type ? performance.event_type.join(', ') : '---' }}</div>
            <div><span class="performance__dataTitle">Notes:</span><br/>{{ performance.notes ?? '---' }}</div>
        </div>
        <h4>Program</h4>
        <div class="performance__program">
            <!--header-->
            <div class="performance__dataTitle header">Composer</div>
            <div class="performance__dataTitle header">Works</div>
            <div class="performance__dataTitle header">Additional Creator</div>
            <div class="performance__dataTitle header">Artist</div>
            <div class="performance__dataTitle header">Role</div>
        </div>
        <div v-for="work, index in performance.work">
            <div :class="`performance__program ${index % 2 == 0 ? '-even' : '-odd'}`">
               <div class="composer">{{ work.composer }}</div>
               <div class="workInfo">{{ work.title }}<br/>
                    <span v-if="work.premier" class="infoItem">Work Premiere:<br/>{{ work.premiere }}</span><br/>
                    <span v-if="work.commission" class="infoItem">Commission:<br/>{{ work.commission }}</span><br/>
                    <span v-if="work.encore" class="infoItem">Encore</span>
                </div>
                <div class="workInfo">
                    <span v-for="c in work.creator" class="infoItem">{{ c.creator_name }}, {{ c.creator_role }}</span>
                </div>
                <div class="workInfo">
                    <span v-for="a in work.artist" class="infoItem">{{ a.artist_name }}</span>
                </div>
                <div class="workInfo">
                    <span v-for="a in work.artist" class="infoItem">{{ a.artist_role }}</span>
                </div>
            </div>
        </div>

    </div>
</template>
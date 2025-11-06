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

  function createURL(facet, value) {
    return encodeURI(`/?${ props.indexName }[refinementList][${ facet }][0]=${ value }`)
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
            <div><span class="performance__dataTitle">Season:</span><br/><a :href="createURL('season', performance.season)">{{ performance.season }}</a></div>
            <div><span class="performance__dataTitle">Orchestra/Ensemble:</span><br/>
                <span v-for="orch, index in performance.orchestra">
                    <a :href="createURL('orchestra', orch)">{{ orch + (index < performance.orchestra.length - 1 ? ";&nbsp;" : "") }}</a>
                </span>
            </div>
           <div><span class="performance__dataTitle">Conductor:</span><br/>
                <span v-for="conductor, index in performance.conductor">
                    <a :href="createURL('conductor', conductor)">{{ conductor + (index < performance.conductor.length - 1 ? ",&nbsp;" : "") }}</a>
                </span>
            </div>
            <div><span class="performance__dataTitle">Event Title:</span><br/>{{ performance.event_title && performance.event_title.length ? performance.event_title : '---' }}</div>
            <div><span class="performance__dataTitle">Event Type:</span><br/>
                <span v-for="type, index in performance.event_type">
                    <a :href="createURL('event_type', type)">{{ type + (index < performance.event_type - 1 ? ",&nbsp;" : "") }}</a>
                </span>
                <span v-if="!performance.event_type || performance.event_type.length < 1">---</span>
            </div>
            <div><span class="performance__dataTitle">Notes:</span><br/>{{ performance.notes ?? '---' }}</div>
        </div>
        <h4>Program</h4>
        <div class="performance__grid">
            <template v-for="work, index in performance.work">
                <!--header-->
                <template v-if="index == 0">
                    <div class="performance__cell -header -first">Composer</div>
                    <div class="performance__cell -header">Works</div>
                    <div class="performance__cell -header">Additional Creator</div>
                    <div class="performance__cell -header">Artist</div>
                    <div class="performance__cell -header">Role</div>
                </template>

               <div :class="`performance__cell -first ${index % 2 == 0 ? '-even' : '-odd'} ${ index + 1 == performance.work.length ? '-last' : ''}`"><a :href="createURL('work.composer', work.composer)">{{ work.composer }}</a></div>
               <div :class="`performance__cell ${index % 2 == 0 ? '-even' : '-odd'} ${ index + 1 == performance.work.length ? '-last' : ''}`">
                    <span class="infoItem">
                        <a :href="createURL('work.title', work.title)">{{ work.title }}</a><br/>
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" v-if="work.has_recording">
                            <path d="M9.81086 5L6.92983 7.30483H4.625V10.7621H6.92983L9.81086 13.0669V5Z" stroke="#01ABE6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M12.4268 6.99365C12.9669 7.53393 13.2703 8.2666 13.2703 9.03054C13.2703 9.79449 12.9669 10.5272 12.4268 11.0674" stroke="#01ABE6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>    
                    </span>
                    <span v-if="work.premiere" class="infoItem">Work Premiere:<br/>
                        <a :href="createURL('work.premiere', work.premier)">{{ work.premiere }}</a>
                    </span><br/>
                    <span v-if="work.commission" class="infoItem">Commission:<br/>
                        <a :href="createURL('work.commission', work.commission)">
                            {{ work.commission }}
                        </a>
                    </span><br/>
                    <span v-if="work.encore" class="infoItem"><a :href="createURL('work.encore', work.encore)">Encore</a></span>
                </div>
                <div :class="`performance__cell ${index % 2 == 0 ? '-even' : '-odd'} ${ index + 1 == performance.work.length ? '-last' : ''}`">
                    <span v-for="c in work.creator" class="infoItem">
                        <a :href="createURL('work.creator.creator_name', c.creator_name)">{{ c.creator_name }}, {{ c.creator_role }}</a>
                    </span>
                </div>
                <div :class="`performance__cell ${index % 2 == 0 ? '-even' : '-odd'} ${ index + 1 == performance.work.length ? '-last' : ''}`">
                    <span v-for="a in work.artist" class="infoItem"><a :href="createURL('work.artist.artist_name', a.artist_name)">{{ a.artist_name }}</a></span>
                </div>
               <div :class="`performance__cell ${index % 2 == 0 ? '-even' : '-odd'} ${ index + 1 == performance.work.length ? '-last' : ''}`">
                    <span v-for="a in work.artist" class="infoItem"><a :href="createURL('work.artist.artist_role', a.artist_role)">{{ a.artist_role }}</a></span>
                </div>
            </template>
        </div>
    </div>
</template>
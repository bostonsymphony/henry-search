<script setup>

import Typesense from 'typesense'
import { ref, onMounted, onUnmounted, computed } from 'vue'

import EventLinks from "./EventLinks.vue"

const props = defineProps({
    performanceId: {
        type: String,
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

    client.collections(props.indexName).documents(props.performanceId).retrieve().then(function (results) {
        performance.value = results
        console.log('searchResults', performance.value)
    }).catch((e) => {
        console.log(e)
        //document.location = '/404'
    })

    document.addEventListener("click", function(){
      document.querySelectorAll(".audioLinkBox").forEach((el) => {
        el.classList.remove("-open")
      })
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

  function formatWorkAttribute(works, attributeName) {
    let returnString = ""
    const attributeArray = []
    works.forEach((w) => {
        w[attributeName].forEach((attr) => {
            if (!attributeArray.includes(attr)) {
                attributeArray.push(attr)
            }
        })
    })
    attributeArray.forEach((attr, index) => {
        returnString += `<a href="${ createURL(`works.${ attributeName }`, attr) }">${ attr }${ index < attributeArray.length - 1 ? ";&nbsp;" : ""}</a>`
    })
    return returnString
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
            <event-links detail="true" :item="performance" />
        </div>
        <div class="performance__headerData">
            <div><span class="performance__dataTitle">Season:</span><br/><a :href="createURL('season', performance.season)">{{ performance.season }}</a></div>
            <div><span class="performance__dataTitle">Orchestra/Ensemble:</span><br/>
                <span v-if="performance.works" v-html="formatWorkAttribute(performance.works, 'ensembles')">
                </span>
                <span v-else v-for="orch, index in performance.ensembles">
                    <a :href="createURL('ensemble', orch)">{{ orch + (index < performance.ensembles.length - 1 ? ";&nbsp;" : "") }}</a>
                </span>
            </div>
           <div><span class="performance__dataTitle">Conductor:</span><br/>
                <span v-if="performance.works" v-html="formatWorkAttribute(performance.works, 'conductors')">
                </span>
                <span v-else v-for="conductor, index in performance.conductors">
                    <a :href="createURL('conductors', conductor)">{{ conductor + (index < performance.conductors.length - 1 ? ",&nbsp;" : "") }}</a>
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
            <template v-for="work, index in performance.works">
                <template v-if="index == 0">
                    <div class="performance__cell -header -first">Composer</div>
                    <div class="performance__cell -header">Works</div>
                    <div class="performance__cell -header">Additional Creator</div>
                    <div class="performance__cell -header">Artist</div>
                    <div class="performance__cell -header">Role</div>
                </template>

               <div :class="`performance__cell -first -composers 
                ${ index == 0 ? '-top' : ''}
                ${ index % 2 == 0 ? '-even' : '-odd' } 
                ${ index + 1 == performance.works.length ? '-last' : ''}`">
                    <span class="mobileHeader">Composer</span>
                    <span v-for="composer, index in work.composers">
                        <a :href="createURL('works.composers', work.composer)">{{ work.composers + (index < work.composers.length - 1 ? ",&nbsp;" : "") }}</a>
                    </span>
                </div>
               <div :class="`performance__cell ${index % 2 == 0 ? '-even' : '-odd'} ${ index + 1 == performance.works.length ? '-last' : ''}`">
                    <span class="mobileHeader">Work</span>
                    <div class="workItem">
                        <span class="infoItem">
                            <a :href="createURL('works.title', work.title)">{{ work.title }}</a>
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" v-if="work.has_recording">
                                <path d="M9.81086 5L6.92983 7.30483H4.625V10.7621H6.92983L9.81086 13.0669V5Z" stroke="#01ABE6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M12.4268 6.99365C12.9669 7.53393 13.2703 8.2666 13.2703 9.03054C13.2703 9.79449 12.9669 10.5272 12.4268 11.0674" stroke="#01ABE6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>    
                        </span>
                        <span v-if="work.premiere" class="infoItem">Work Premiere:<br/>
                            <a :href="createURL('works.premiere', work.premier)">{{ work.premiere }}</a>
                        </span>
                        <span v-if="work.commission" class="infoItem">Commission:<br/>
                            <a :href="createURL('works.commission', work.commission)">
                                {{ work.commission }}
                            </a>
                        </span>
                        <span v-if="work.encore" class="infoItem"><a :href="createURL('works.encore', work.encore)">Encore</a></span>
                        </div>
                </div>
                <div :class="`performance__cell ${index % 2 == 0 ? '-even' : '-odd'} ${ index + 1 == performance.works.length ? '-last' : ''}`">
                    <span class="mobileHeader">Additional Creator</span>
                    <span v-for="c in work.creator" class="infoItem">
                        <a :href="createURL('works.creator.creator_name', c.creator_name)">{{ c.creator_name }}, {{ c.creator_role }}</a>
                    </span>
                </div>
                <div :class="`performance__cell -artist ${index % 2 == 0 ? '-even' : '-odd'} ${ index + 1 == performance.works.length ? '-last' : ''}`">
                    <span class="mobileHeader">Artist</span>
                    <span v-for="a in work.artists" class="infoItem"><a :href="createURL('works.artists.name', a.name)">{{ a.name }}</a></span>
                </div>
               <div :class="`performance__cell -role ${index % 2 == 0 ? '-even' : '-odd'} ${ index + 1 == performance.works.length ? '-last' : ''}`">
                    <span class="mobileHeader">Role</span>
                    <span v-for="a in work.artists" class="infoItem"><a :href="createURL('works.artists.role', a.role)">{{ a.role }}</a></span>
                </div>
            </template>
        </div> 
    </div>
</template>
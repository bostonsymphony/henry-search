<script setup>

import Typesense from 'typesense'
import { ref, onMounted } from 'vue'

import EventLinks from "./EventLinks.vue"
import formatDate from '../composables/formatDate'

const props = defineProps({
    performanceId: {
        type: String,
        required: true
    },
    indexName: {
      type: String,
      default: "archived_performances"
    },
    docKey: {
        type: String,
        require: true
    },
    docHost: {
        type: String,
        require: true
    }
})

const performance = ref(null)

const searchHistory = ref(JSON.parse(sessionStorage.getItem('searchHistory')))


onMounted(() => {
    let client = new Typesense.Client({
        'nodes': [{
            'host': props.docHost,
            'port': '443',      
            'protocol': 'https'   
        }],
        'apiKey': props.docKey,
        'connectionTimeoutSeconds': 2
    })

    client.collections(props.indexName).documents(props.performanceId).retrieve().then(function (results) {
        performance.value = results
        // console.log(results)
        // console.log(new Date(results.performance_datetime))
        document.title = `BSO HENRY | ${ formatDate(performance.value.performance_date) } Performance Detail`
    }).catch((e) => {
        console.log(e)
        //document.location = '/404'
    })

    document.addEventListener("click", function(){
      document.querySelectorAll(".audioLinks__box").forEach((el) => {
        el.classList.remove("-open")
      })
    })

   
})

// const formatDate = (unix_timestamp) => {
//     // multiplied by 1000 so that the argument is in milliseconds, not seconds
//     const date = new Date(unix_timestamp * 1000)
//     const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

//     return `${(months[date.getMonth()]).substring(0, 3)} ${date.getDay() + 1}, ${date.getFullYear()}`
// }


const formatTime = (unix_timestamp) => {
    // multiplied by 1000 so that the argument is in milliseconds, not seconds
    const date = new Date(unix_timestamp * 1000)
    const hour = date.getHours() + 1 > 12 ? date.getHours() - 11 : date.getHours() + 1
    const amPm = date.getHours() + 1 > 12 ? "pm" : "am"
    const minutes = "0" + date.getMinutes()

    return `${hour}:${minutes.substr(-2)}${amPm}`

}

const formatLocation = (venue, location) => {
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

const formatWorkAttribute = (works, attributeName) => {
    let returnString = ""
    const attributeArray = []
    if (works) {
        works.forEach((w) => {
            w[attributeName].forEach((attr) => {
                if (!attributeArray.includes(attr)) {
                    attributeArray.push(attr)
                }
            })
        })
    }
    attributeArray.forEach((attr, index) => {
        returnString += `<a href="${ createURL(`works.${ attributeName }`, attr) }">${ attr }${ index < attributeArray.length - 1 ? ";&nbsp;" : ""}</a>`
    })
    return returnString
}


const createURL = (facet, value) => {
    return encodeURI(`/?${ props.indexName }[refinementList][${ facet }][0]=${ value }`)
}
 

</script>

<template>
    <template v-if="performance">
        <div class="breadCrumb"><a :href="searchHistory && searchHistory.length ? searchHistory[searchHistory.length - 1].link : '/'">Back to Search Results</a></div>
        <div class="performance__details">
            <div class="performance__header">
                <h1>{{ formatDate(performance.performance_date, 'detail') }} Performance Detail</h1>
                <h2>{{ formatTime(performance.performance_date) }} <span class="performance__separator">|</span> {{ formatLocation(performance.venue, performance.location) }}</h2>
            </div>
            <div class="headerLinks">
                <event-links :detail="true" :item="performance" />
            </div>
            <div class="performance__headerData">
                <div class="performance__headerColumn"><span class="performance__dataTitle">Season:</span><br/><a :href="createURL('season', performance.season)">{{ performance.season }}</a></div>
                <div class="performance__headerColumn"><span class="performance__dataTitle">Orchestra/Ensemble:</span><br/>
                    <span v-if="performance.works" v-html="formatWorkAttribute(performance.works, 'ensembles')">
                    </span>
                    <span v-else v-for="orch, index in performance.ensembles">
                        <a :href="createURL('ensemble', orch)">{{ orch + (index < performance.ensembles.length - 1 ? ";&nbsp;" : "") }}</a>
                    </span>
                </div>
                <div class="performance__headerColumn"><span class="performance__dataTitle">Conductor:</span><br/>
                    <span v-if="performance.works" v-html="formatWorkAttribute(performance.works, 'conductors')">
                    </span>
                    <span v-else v-for="conductor, index in performance.conductors">
                        <a :href="createURL('conductors', conductor)">{{ conductor + (index < performance.conductors.length - 1 ? ",&nbsp;" : "") }}</a>
                    </span>
                </div>
                <div class="performance__headerColumn"><span class="performance__dataTitle">Event Title:</span><br/>{{ performance.event_title && performance.event_title.length ? performance.event_title : '---' }}</div>
                <div class="performance__headerColumn"><span class="performance__dataTitle">Event Type:</span><br/>
                    <span v-for="type, index in performance.event_type">
                        <a :href="createURL('event_type', type)">{{ type + (index < performance.event_type - 1 ? ",&nbsp;" : "") }}</a>
                    </span>
                    <span v-if="!performance.event_type || performance.event_type.length < 1">---</span>
                </div>
                <div class="performance__headerColumn"><span class="performance__dataTitle">Notes:</span><br/>{{ performance.notes ?? '---' }}</div>
            </div>
            <h4>Program</h4>
            <div class="performanceGrid">
                <template v-for="work, index in performance.works">
                    <template v-if="index == 0">
                        <div class="performanceGrid__cell -header -first">Composer</div>
                        <div class="performanceGrid__cell -header">Works</div>
                        <div class="performanceGrid__cell -header">Additional Creator</div>
                        <div class="performanceGrid__cell -header">Artist</div>
                        <div class="performanceGrid__cell -header">Role</div>
                    </template>

                <div :class="`performanceGrid__cell -first -composers 
                    ${ index == 0 ? '-top' : ''}
                    ${ index % 2 == 0 ? '-even' : '-odd' } 
                    ${ index + 1 == performance.works.length ? '-last' : ''}`">
                        <span class="performanceGrid__mobileHeader">Composer</span>
                        <span v-for="composer, index in work.composers">
                            <a :href="createURL('works.composers', composer)">{{ composer + (index < work.composers.length - 1 ? ",&nbsp;" : "") }}</a>
                        </span>
                    </div>
                <div :class="`performanceGrid__cell ${index % 2 == 0 ? '-even' : '-odd'} ${ index + 1 == performance.works.length ? '-last' : ''}`">
                        <span class="performanceGrid__mobileHeader">Work</span>
                        <div class="performanceGrid__workItem">
                            <span class="performanceGrid__infoItem">
                                <a :href="createURL('works.title', work.title)">{{ work.title }}</a>
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"  v-if="work.has_recording">
                                    <circle cx="9" cy="9" r="9" />
                                    <path d="M9.81086 5L6.92983 7.30483H4.625V10.7621H6.92983L9.81086 13.0669V5Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M12.4268 6.99219C12.9669 7.53246 13.2703 8.26513 13.2703 9.02908C13.2703 9.79302 12.9669 10.5257 12.4268 11.066" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </span>
                            <span v-if="work.premiere" class="performanceGrid__infoItem -small">Work Premiere:<br/>
                                <a :href="createURL('works.premiere', work.premier)">{{ work.premiere }}</a>
                            </span>
                            <span v-if="work.commission" class="performanceGrid__infoItem -small">Commission:<br/>
                                <a :href="createURL('works.commission', work.commission)">
                                    {{ work.commission }}
                                </a>
                            </span>
                            <span v-if="work.encore" class="performanceGrid__infoItem -small"><a :href="createURL('works.encore', work.encore)">Encore</a></span>
                            </div>
                    </div>
                    <div :class="`performanceGrid__cell ${index % 2 == 0 ? '-even' : '-odd'} ${ index + 1 == performance.works.length ? '-last' : ''}`">
                        <span class="performanceGrid__mobileHeader">Additional Creator</span>
                        <span v-for="c in work.additional_creators" class="performanceGrid__infoItem">
                            <a :href="createURL('works.additional_creators.name', c.name)">{{ c.name }}, {{ c.role }}</a>
                        </span>
                    </div>
                    <div :class="`performanceGrid__cell -artist ${index % 2 == 0 ? '-even' : '-odd'} ${ index + 1 == performance.works.length ? '-last' : ''}`">
                        <span class="performanceGrid__mobileHeader">Artist</span>
                        <span v-for="a in work.artists" class="performanceGrid__infoItem"><a :href="createURL('works.artists.name', a.name)">{{ a.name }}</a></span>
                    </div>
                <div :class="`performanceGrid__cell -role ${index % 2 == 0 ? '-even' : '-odd'} ${ index + 1 == performance.works.length ? '-last' : ''}`">
                        <span class="performanceGrid__mobileHeader">Role</span>
                        <span v-for="a in work.artists" class="performanceGrid__infoItem"><a :href="createURL('works.artists.role', a.role)">{{ a.role }}</a></span>
                    </div>
                </template>
            </div> 
        </div>
    </template>
</template>
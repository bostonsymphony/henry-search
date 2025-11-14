<script setup>

import TypesenseInstantSearchAdapter from 'typesense-instantsearch-adapter'
import Typesense from 'typesense'
import { ref, onMounted, onUnmounted, computed } from 'vue'

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
            <div class="media">
                <template v-if="performance.program_link">
                    <a :href="performance.program_link">
                        <svg class="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="12" fill="#01ABE6"/>
                            <path d="M8.30469 16.0947L15.8468 8.55259" stroke="white" stroke-width="2"/>
                            <path d="M8.30469 8.55127L15.847 8.55144L15.8472 16.0937" stroke="white" stroke-width="2"/>
                        </svg>
                        View Program Book
                    </a>
                </template>
                <template v-if="performance.bso_audio_id">
                    <a :href="`/request-audio?audioId=${performance.bso_audio_id}`">
                        <svg class="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="12" fill="#01ABE6"/>
                            <path d="M13.081 6.66675L9.23961 9.73985H6.1665V14.3495H9.23961L13.081 17.4226V6.66675Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M16.5688 9.32495C17.289 10.0453 17.6936 11.0222 17.6936 12.0408C17.6936 13.0594 17.289 14.0363 16.5688 14.7567" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Access Audio
                    </a>
                </template>
            </div>
            <a onclick="navigator.clipboard.writeText(window.location.href);">
                <svg class="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="11.25" fill="white" stroke="#01ABE6" stroke-width="1.5"/>
                    <path d="M11.0835 12.6969C11.3142 13.0223 11.6086 13.2915 11.9466 13.4864C12.2846 13.6812 12.6584 13.797 13.0427 13.8261C13.4269 13.8551 13.8125 13.7966 14.1734 13.6546C14.5343 13.5126 14.862 13.2903 15.1343 13.0029L16.7461 11.3026C17.2354 10.7681 17.5062 10.0523 17.5 9.30925C17.4939 8.56622 17.2114 7.85545 16.7134 7.33002C16.2153 6.8046 15.5416 6.50656 14.8372 6.50011C14.1329 6.49365 13.4544 6.77929 12.9477 7.2955L12.0237 8.26469" stroke="#01ABE6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M13.8333 11.3032C13.5696 10.9778 13.2332 10.7085 12.8469 10.5137C12.4606 10.3189 12.0334 10.203 11.5943 10.174C11.1552 10.145 10.7145 10.2034 10.302 10.3455C9.88955 10.4875 9.515 10.7097 9.20377 10.9971L7.36178 12.6975C6.80256 13.2319 6.49312 13.9478 6.50012 14.6908C6.50711 15.4338 6.82998 16.1446 7.39918 16.67C7.96838 17.1955 8.73837 17.4935 9.54331 17.5C10.3483 17.5064 11.1237 17.2208 11.7027 16.7046L12.7527 15.7354" stroke="#01ABE6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Copy URL
            </a>
        </div>
        <div class="performance__headerData">
            <div><span class="performance__dataTitle">Season:</span><br/><a :href="createURL('season', performance.season)">{{ performance.season }}</a></div>
            <div><span class="performance__dataTitle">Orchestra/Ensemble:</span><br/>
                <span v-for="orch, index in performance.ensembles">
                    <a :href="createURL('ensemble', orch)">{{ orch + (index < performance.ensembles.length - 1 ? ";&nbsp;" : "") }}</a>
                </span>
            </div>
           <div><span class="performance__dataTitle">Conductor:</span><br/>
                <span v-for="conductor, index in performance.conductors">
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
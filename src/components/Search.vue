<script setup>

  import { ref, onMounted } from 'vue'
  import '@vuepic/vue-datepicker/dist/main.css'
  import PTabs from './PTabs.vue'
  import SearchTab from "./SearchTab.vue"
  import EventLinks from "./EventLinks.vue"

  import formatDate from '../composables/formatDate'

  const props = defineProps({
    performanceIndex: {
      type: String,
      default: "archived_performances"
    },
    artistIndex: {
      type: String,
      default: "performances"
    },
    workIndex: {
      type: String,
      default: "performances"
    },
    searchKey: {
      type: String,
      require: true
    },
    searchHost: {
      type: String,
      require: true
    }
  })
  
  onMounted(() => {
    document.addEventListener("click", function(){
      document.querySelectorAll(".audioLinkBox").forEach((el) => {
        el.classList.remove("-open")
      })
    })


  })

  const mainRefinements = [
    {attribute: 'works.composers', title: 'Composer', placeholder: 'Search Composers'},
    {attribute: 'works.title', title: 'Work', placeholder: 'Search Works'},
    {attribute: 'works.conductors', title: 'Conductor', placeholder: 'Search Conductors'},
    {attribute: 'works.ensembles', title: 'Orchestra/Ensemble', placeholder: 'Search Orchestras/Ensembles'},
    {attribute: 'works.artists.name', title: 'Artist', placeholder: 'Search Artists'},
  ]

  const addlRefinements = [
    {attribute: 'works.artists.role', title: 'Instrument', placeholder: 'Search Instruments', type: 'list', hideSearch: 'true'},
    {attribute: 'works.additional_creators.name', title: 'Additional Creator', placeholder: 'Search Creators', type: 'list'},
    {attribute: 'works.additional_creators.role', title: 'Additional Creator Role', placeholder: 'Search Creator Roles', type: 'list', hideSearch: 'true'},
    {attribute: 'season', title: 'Season', placeholder: 'Search Seasons', type: 'list'},
    {attribute: 'event_title', title: 'Event Title', placeholder: 'Search Event Titles', type: 'list'},
    {attribute: 'event_types', title: 'Series', placeholder: 'Search Event Types', type: 'list'},
    {attribute: 'venue', title: 'Venue', placeholder: 'Search Venues', type: 'list', hideSearch: 'true'},
    {attribute: 'location', title: 'Location', type: 'location'},
    {attribute: 'media', title: 'Media', placeholder: 'Select Media', type: 'list', hideSearch: 'true'},
    {attribute: 'works.premiere', title: 'Premiere', placeholder: 'Select Premiere', type: 'list', hideSearch: 'true'},
    {attribute: 'works.commission', title: 'Commission', placeholder: 'Select Premiere', type: 'list', hideSearch: 'true'}
  ]

  const artistRefinements = [
    {attribute: 'artist_name', title: 'Artist/Ensemble', placeholder: 'Search Artists/Ensembles'},
    {attribute: 'artist_role', title: 'Instrument/Role', placeholder: 'Instruments/Roles'}
  ]

  const addlArtistRefinements = [
    {attribute: 'composer', title: 'Composer', placeholder: 'Search Composers', type: 'list'},
    {attribute: 'work_title', title: 'Work', placeholder: 'Search Works', type: 'list'}
  ]

  const workRefinements = [
    {attribute: 'composers', title: 'Composer', placeholder: 'Search Composers'},
    {attribute: 'title', title: 'Work Title', placeholder: 'Search Work Titles'},
    {attribute: 'commission', title: 'Commission', placeholder: 'Search Commissions'}
  ]

  const addlWorkRefinements = [
    {attribute: 'creators.name', title: 'Additional Creator', placeholder: 'Search Creators', type: 'list'},
    {attribute: 'creators.role', title: 'Creator Role', placeholder: 'Search Creator Roles', type: 'list', hideSearch: 'true'},
  ]


  const createURL = (facets) => {
    let returnUrl = "/?"
    facets.forEach((facet, index) => {
      if (facet.facet && facet.value) {
        if (returnUrl != "/?") {
          returnUrl += '&'
        }
        if (Array.isArray(facet.value)) {
          facet.value.forEach((v, i) => {
            returnUrl += `${ props.performanceIndex }[refinementList][${ facet.facet }][${ i }]=${ v }`
            if (i < facet.value.length - 1) {
              returnUrl += '&'
            }
          })
        } else {
          returnUrl += `${ props.performanceIndex }[refinementList][${ facet.facet }][0]=${ facet.value }`
          if (index < facets.length - 1) {
            returnUrl += '&'
          }
        }
      }
    })
    return encodeURI(returnUrl)
  }

  const formatLocation = (location) => {
    let returnLocation = "";
    if (location) {
       if (location?.city) {
        returnLocation += location.city
      }
      if (location?.state) {
        if (returnLocation != "") {
          returnLocation += ", "
        }
        returnLocation += location.state
      }
      if (location?.country) {
        if (returnLocation != "") {
          returnLocation += ", "
        }
        returnLocation += location.country
      }
    }
    return returnLocation
  }

  const formatWorkAttribute = (works, attributeName) => {    
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
    return attributeArray.join("; ")
  }


</script>

<template>
  <div class="eventsSearch">
    <p-tabs :titles="['Performances', 'Artists', 'Works']">
      <template #tabpanel-1>
        <search-tab
          :index-name="props.performanceIndex"
          :main-refinements="mainRefinements"
          :addl-refinements="addlRefinements"
          :sort-field="'performance_date'"
          :query-by-fields="'works, works.composers, works.title, works.artists, season, venue, event_types, notes, event_title, ensembles, conductors'"
          :include-fields="'works, works.composers, works.title, works.artists, season, venue, event_types, notes, event_title, ensembles, conductors, id, performance_date, program_book_link, media, bso_audio_id'"
          search-placeholder="Search by composer, works, conductor, orchestra, and more"
          results-title="Performances"
          :search-key="props.searchKey"
          :search-host="props.searchHost"
        >
          <template v-slot="{ items }">
            <div class="resultsGrid" v-if="items && items.length">
              <!-- Header Row -->
              <div class="resultsGrid__cell -header -first">Date/Season/Title</div>
              <div class="resultsGrid__cell -header">Venue</div>
              <div class="resultsGrid__cell -header">Ensemble</div>
              <div class="resultsGrid__cell -header">Conductor</div>
              <div class="resultsGrid__cell -header">Composer/Work</div>
              <div class="resultsGrid__cell -header">Artist/Role</div>
              <div class="resultsGrid__cell -header">View</div>
              <template v-for="item, index in items">
                <template v-if="item.works && item.works.length" v-for="w, i in item.works.slice(0, 6)">
                  <!-- First row of an event -->
                  <template v-if="i == 0">
                    <div :class="`resultsGrid__cell -first ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length && (i + 1 == item.works.length || i == 5)) ? '-last' : ''}`">
                      <span class="resultsGrid__mobileHeader">Date/Season/Title</span>
                      {{ formatDate(item.performance_date) }} / {{ item.season + (item.event_title ? " / " + item.event_title : "")}}
                    </div>
                    <div :class="`resultsGrid__cell ${index % 2 == 0 ? '-even' : '-odd'} ${((index + 1 == items.length && (i + 1 == item.works.length || i == 5)) && (i + 1 == item.works.length || i == 5)) ? '-last' : ''}`">
                      <span class="resultsGrid__mobileHeader">Venue</span>
                      {{ item.venue }} {{ formatLocation(item.location) }}
                    </div>
                    <div :class="`resultsGrid__cell ${index % 2 == 0 ? '-even' : '-odd'} 
                      ${(index + 1 == items.length && (i + 1 == item.works.length || i == 5)) ? '-last' : ''}`">
                      <span class="resultsGrid__mobileHeader">Ensemble</span>
                      <span class="resultsGrid__ensembles">{{ w.ensembles.join('; ')}}</span>
                      <span class="resultsGrid__ensemblesMobile">{{ formatWorkAttribute(item.works, 'ensembles') }}</span>  
                    </div>
                    <div :class="`resultsGrid__cell 
                      ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length && (i + 1 == item.works.length || i == 5)) ? '-last' : ''}`">
                      <span class="resultsGrid__mobileHeader">Conductor</span>
                      <span class="resultsGrid__conductors">{{ w.conductors.join('; ') }}</span>
                      <span class="resultsGrid__conductorsMobile">{{ formatWorkAttribute(item.works, 'conductors') }}</span>  
                    </div>
                    <div :class="`resultsGrid__cell -work
                        ${index % 2 == 0 ? '-even' : '-odd'} 
                        ${(index + 1 == items.length && (i + 1 == item.works.length || i == 5)) ? '-last' : ''}`">
                       <span class="resultsGrid__mobileHeader">Composer/Work</span>
                        {{ w?.composers?.join("; ") }} / {{ w?.title }}
                        <div v-if="w.has_recording" class="toolTip">
                          <a :href="`/details?performanceId=${item.id}`">
                             <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" class="resultsGrid__icon">
                            <circle cx="9" cy="9" r="9" fill="#14284E"/>
                            <path d="M9.81086 5L6.92983 7.30483H4.625V10.7621H6.92983L9.81086 13.0669V5Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M12.4268 6.99219C12.9669 7.53246 13.2703 8.26513 13.2703 9.02908C13.2703 9.79302 12.9669 10.5257 12.4268 11.066" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                          </a>
                          <span class="toolTip__text">Access Audio</span>
                        </div>
                    </div>
                    <div :class="`resultsGrid__cell -artist ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length && (i + 1 == item.works.length || i == 5)) ? '-last' : ''}`" v-if="w.artists && w.artists.length < 3">
                       <span class="resultsGrid__mobileHeader">Artist/Role</span>
                      {{ w.artists.map((artist) => artist.name + '/' + artist.role).join('; ') }}
                    </div>
                    <div :class="`resultsGrid__cell -artist ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length && (i + 1 == item.works.length || i == 5)) ? '-last' : ''}`" v-else>
                       <span class="resultsGrid__mobileHeader">Artist/Role</span>
                       {{ w.artists ? w.artists.map((artist) => artist.name + '/' + artist.role).slice(0, 2).join('; ') : ""}}
                       <br/><a v-if="w.artists" :href="`/details?performanceId=${item.id}`">More...</a>
                    </div>
                    <div :class="`resultsGrid__cell -detailsMobile
                      ${item.works.length > 1 ? '-details' : '' }
                      ${index % 2 == 0 ? '-even' : '-odd'} 
                      ${(index + 1 == items.length && (i + 1 == item.works.length || i == 5)) ? '-last -lastMobile' : ''}`">
                      <event-links :item="item" />
                    </div>
                  </template>
                  <!-- Additional event rows -->
                  <template v-else-if="i > 0 && i <= 4">
                    <div :class="`resultsGrid__cell -empty -first ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length && (i + 1 == item.works.length || i == 5)) ? '-last' : ''}`"></div>
                    <div :class="`resultsGrid__cell -empty ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length && (i + 1 == item.works.length || i == 5)) ? '-last' : ''}`"></div>
                    <div :class="`resultsGrid__cell -empty
                      ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length && (i + 1 == item.works.length || i == 5)) ? '-last' : ''}`">
                      {{ w.ensembles.join('; ')}}
                    </div>
                    <div :class="`resultsGrid__cell -empty ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length && (i + 1 == item.works.length || i == 5)) ? '-last' : ''}`">
                      {{ w.conductors.join('; ') }}
                    </div>
                    <div :class="`resultsGrid__cell -work 
                    ${index % 2 == 0 ? '-even' : '-odd'} 
                    ${(index + 1 == items.length && (i + 1 == item.works.length || i == 5)) ? '-last' : ''}`">
                      {{ w?.composers?.join("; ") }} / {{ w?.title }}
                        <div v-if="w.has_recording" class="toolTip">
                          <a :href="`/details?performanceId=${item.id}`">
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" class="resultsGrid__icon">
                            <circle cx="9" cy="9" r="9" fill="#14284E"/>
                            <path d="M9.81086 5L6.92983 7.30483H4.625V10.7621H6.92983L9.81086 13.0669V5Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M12.4268 6.99219C12.9669 7.53246 13.2703 8.26513 13.2703 9.02908C13.2703 9.79302 12.9669 10.5257 12.4268 11.066" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>

                          </a>
                          <span class="toolTip__text">Access Audio</span>
                        </div>
                    </div>
                    <div :class="`resultsGrid__cell -artist 
                      ${index % 2 == 0 ? '-even' : '-odd'} 
                      ${(index + 1 == items.length && (i + 1 == item.works.length || i == 5)) ? '-last' : ''}`" 
                      v-if="w.artists && w.artists.length < 3">
                      {{ w.artists.map((artist) => artist.name + '/' + artist.role).join('; ') }}
                    </div>
                    <div :class="`resultsGrid__cell -artist 
                      ${index % 2 == 0 ? '-even' : '-odd'} 
                      ${(index + 1 == items.length && (i + 1 == item.works.length || i == 5)) ? '-last' : ''}`" 
                      v-else>
                      {{ w.artists ? w.artists.map((artist) => artist.name + '/' + artist.role).slice(0, 2).join('; ') : ""}}
                      <br/><a v-if="w.artists" :href="`/details?performanceId=${item.id}`">More...</a>
                    </div>
                    <div :class="`resultsGrid__cell -detailsMobile
                      ${index % 2 == 0 ? '-even' : '-odd'} 
                      ${(index + 1 == items.length && (i + 1 == item.works.length || i == 4)) ? '-last -lastMobile' : ''}
                      ${ !(i + 1 == item.works.length || i == 5) ? '-empty' : ''}`">
                      <template  v-if="(i + 1 == item.works.length || i == 5)">
                        <event-links :item="item" extra-classes="-detailsMobile" />
                       </template>
                    </div>
                  </template>
                  <template v-else-if="i > 4">
                    <div :class="`resultsGrid__cell -empty -first ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length && (i + 1 == item.works.length || i == 5)) ? '-last' : ''}`"></div>
                    <div :class="`resultsGrid__cell -empty ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length && (i + 1 == item.works.length || i == 5)) ? '-last' : ''}`"></div>
                    <div :class="`resultsGrid__cell -empty ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length && (i + 1 == item.works.length || i == 5)) ? '-last' : ''}`"></div>
                    <div :class="`resultsGrid__cell -empty ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length && (i + 1 == item.works.length || i == 5)) ? '-last' : ''}`"></div>
                    <div :class="`resultsGrid__cell ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length && (i + 1 == item.works.length || i == 5)) ? '-last' : ''}`">
                      <a :href="`/details?performanceId=${item.id}`">More...</a>
                    </div>
                    
                    <div :class="`resultsGrid__cell -empty ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length && (i + 1 == item.works.length || i == 5)) ? '-last' : ''}`"></div>
                    <div :class="`resultsGrid__cell -detailsMobile
                      ${index % 2 == 0 ? '-even' : '-odd'} 
                      ${(index + 1 == items.length && (i + 1 == item.works.length || i == 5)) ? '-last -lastMobile' : ''}
                      ${ !(i + 1 == item.works.length || i == 5) ? '-empty' : ''}`">
                      <template  v-if="(i + 1 == item.works.length || i == 5)">
                        <event-links :item="item" extra-classes="-detailsMobile" />
                       </template>
                    </div>
                  </template>
                </template>
                <template v-if="!item.works || item.works.length == 0">
                  <div :class="`resultsGrid__cell -first ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length) ? '-last' : ''}`">
                    <span class="resultsGrid__mobileHeader">Date/Season/Title</span>
                    {{ formatDate(item.performance_date) }} / {{ item.season + (item.event_title ? " / " + item.event_title : "")}}
                  </div>
                  <div :class="`resultsGrid__cell ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length) ? '-last' : ''}`">
                     <span class="resultsGrid__mobileHeader">Venue</span>
                    {{ item.venue }} {{ formatLocation(item.location) }}
                  </div>
                  <div :class="`resultsGrid__cell
                    ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length) ? '-last' : ''}`">
                    <span class="resultsGrid__mobileHeader">Ensemble</span>
                    {{ item.ensembles ? item.ensembles.join('; ') : ""}}
                  </div>
                  <div :class="`resultsGrid__cell ${index % 2 == 0 ? '-even' : '-odd'} 
                    ${(index + 1 == items.length) ? '-last' : ''}`">
                    <span class="resultsGrid__mobileHeader">Conductor</span>
                    {{ item.conductors.join('; ') }}
                  </div>
                  <div :class="`resultsGrid__cell ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length) ? '-last' : ''}`"><span class="resultsGrid__mobileHeader">Composer/Work</span></div>
                  <div :class="`resultsGrid__cell -hideMobile ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length) ? '-last' : ''}`"></div>
                  <div :class="`resultsGrid__cell -detailsMobile ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length) ? '-last' : ''}`">
                    <event-links :item="item" />

                  </div>
                </template>
            </template>
            </div>
            <div v-else>No results</div>
          </template>
        </search-tab>  
      </template>
      <template #tabpanel-2>
        <search-tab
          :index-name="props.artistIndex"
          :main-refinements="artistRefinements"
          :addl-refinements="addlArtistRefinements"
          :sort-field="'last_performance_date'"
          :query-by-fields="'artist_name, artist_role, work_title, composer'"
          :include-fields="'artist_name, artist_role, work_title, composer, num_performances'"
          search-placeholder="Search by conductor, soloist, ensemble, instrument, or role"
          results-title="Artists"
          :search-key="props.searchKey"
          :search-host="props.searchHost"
        >
          <template v-slot="{ items }">
            <div class="eventsSearch__artistsGrid">
              <div class="resultsGrid__cell -header -first">Artist</div>
              <div class="resultsGrid__cell -header">Instrument/Role</div>
              <div class="resultsGrid__cell -header">Composer/Work</div>
              <div class="resultsGrid__cell -header"># of Performances</div>

              <template v-for="item, index in items">
                <div :class="`resultsGrid__cell -first ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length) ? '-last' : ''}`">
                  <span class="resultsGrid__mobileHeader">Artist</span>
                  <a :href="createURL([{ facet: 'works.artists.name', value: item.artist_name}])">
                    {{ item.artist_name }}
                  </a>
                </div>
                <div :class="`resultsGrid__cell ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length) ? '-last' : ''}`">
                  <span class="resultsGrid__mobileHeader">Role</span>
                  <a :href="createURL([{ facet: 'works.artists.role', value: item.artist_role }])">
                    {{ item.artist_role }}
                  </a>
                </div>
                <div :class="`resultsGrid__cell ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length) ? '-last' : ''}`">
                  <span class="resultsGrid__mobileHeader">Composer/Work</span>
                  <a :href="createURL([{ facet: 'works.title', value: item.work_title }])">
                    {{ item.composer }} / {{ item.work_title }}
                  </a>
                </div>
                <div :class="`resultsGrid__cell -perfs ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length) ? '-last' : ''}`">
                  <span class="resultsGrid__mobileHeader"># of Performances</span>
                  <a :href="createURL([{ facet: 'works.artists.name', value: item.artist_name},
                    { facet: 'works.artists.role', value: item.artist_role },
                    { facet: 'works.title', value: item.work_title }
                  ])">
                    <span class="resultsGrid__lightLink">{{ item.num_performances }} Performances</span>
                    
                  </a>                  
                </div>
              </template>
            </div>
          </template>
        </search-tab>  
      </template>

      <template #tabpanel-3>
        <!-- add search by creators -->
        <search-tab
          :index-name="props.workIndex"
          :main-refinements="workRefinements"
          :addl-refinements="addlWorkRefinements"
          :sort-field="'last_performance_date'"
          :query-by-fields="'commission, composers, title'"
          :include-fields="'commission, composers, title, num_performances'"
          search-placeholder="Search by composer, work, or commission"
          results-title="Works"
          :search-key="props.searchKey"
          :search-host="props.searchHost"
        >
          <template v-slot="{ items }">
            <div class="eventsSearch__worksGrid">
              <div class="resultsGrid__cell -header -first">Composer</div>
              <div class="resultsGrid__cell -header">Work</div>
              <div class="resultsGrid__cell -header">Additional Creator</div>
              <div class="resultsGrid__cell -header"># of times Performed</div>
               <template v-for="item, index in items">
                <div :class="`resultsGrid__cell -first ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length) ? '-last' : ''}`">
                  <span class="resultsGrid__mobileHeader">Composer</span>
                  <a v-for="composer, index in item.composers"
                    :href="createURL([{ facet: 'works.composers', value: composer}])">
                    {{ `${composer}${index < item.composers.length && item.composers.length > 1 ? '; ' : ''}` }}
                  </a>
                </div>
                <div :class="`resultsGrid__cell ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length) ? '-last' : ''}`">
                  <span class="resultsGrid__mobileHeader">Work</span>
                  <a v-for="title, index in item.title"
                    :href="createURL([{ facet: 'works.title', value: title}])">
                    {{ `${title}${index < item.title.length && item.title.length > 1 ? '; ' : ''}` }}
                  </a>
                </div>
                <div :class="`resultsGrid__cell ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length) ? '-last' : ''}`">
                  <span class="resultsGrid__mobileHeader">Additional Creator</span>
                  <a v-if="item.creators && item.creators.length" v-for="creator, index in item.creators"
                    :href="createURL([{ facet: 'works.additional_creators.name', value: creator.name}])">
                    <template v-if="(typeof creator !== 'undefined' && creator && typeof creator.name !== 'undefined' && typeof creator.role !== 'undefined')">
                      {{ `${creator.name} / ${creator.role}${index < item?.creators?.length && items?.creators?.length > 1 ? '; ' : ''}` }}
                    </template>
                  </a>
                </div>
                <div :class="`resultsGrid__cell -perfs ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length) ? '-last' : ''}`">
                  <span class="resultsGrid__mobileHeader"># of times Performed</span>
                  <a :href="createURL([{ facet: 'works.composers', value: item.composers},
                    { facet: 'works.title', value: item.title}
                  ])">
                    <span class="resultsGrid__lightLink">{{ item.num_performances }} Performances</span>
                  </a>
                </div>
              </template>
            </div>
          </template>

        </search-tab>

      </template>
    </p-tabs>
  </div>


</template>



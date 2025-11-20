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
    }
  })
  
  const displayDate = ref(null)

  const today = Date.now()
  const date = ref([today, today])

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
    // {attribute: 'works.additional_creators.creator_name', title: 'Additional Creator', placeholder: 'Search Creators', type: 'list'},
    // {attribute: 'works.additional_creators.creator_role', title: 'Additional Creator Role', placeholder: 'Search Creator Roles', type: 'list'},
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


  function createURL(facets) {
    let returnUrl = "/?"
    facets.forEach((facet, index) => {
      if (facet.facet && facet.value) {
        if (Array.isArray(facet.value)) {
          if (returnUrl != "/?") {
            returnUrl += '&'
          }
          facet.value.forEach((v, i) => {
            returnUrl += `${ props.performanceIndex }[refinementList][${ facet.facet }][${ i }]=${ v }`
            if (i < facet.value.length - 1) {
              returnUrl += '&'
            }
          })
        } else {
          if (returnUrl != "/?") {
            returnUrl += '&'
          }
          returnUrl += `${ props.performanceIndex }[refinementList][${ facet.facet }][0]=${ facet.value }`
          if (index < facets.length - 1) {
            returnUrl += '&'
          }
        }
      }
    })
    return encodeURI(returnUrl)
  }

  function formatLocation(location) {
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
        >
          <template v-slot="{ items }">
            <div class="eventsSearch__resultsGrid" v-if="items && items.length">
              <!-- Header Row -->
              <div class="eventsSearch__resultCell -header -first">Date/Season/Title</div>
              <div class="eventsSearch__resultCell -header">Venue</div>
              <div class="eventsSearch__resultCell -header">Ensemble</div>
              <div class="eventsSearch__resultCell -header">Conductor</div>
              <div class="eventsSearch__resultCell -header">Composer/Work</div>
              <div class="eventsSearch__resultCell -header">Artist/Role</div>
              <div class="eventsSearch__resultCell -header">View</div>
              <template v-for="item, index in items">
                <template v-if="item.works && item.works.length" v-for="w, i in item.works.slice(0, 6)">
                  <!-- First row of an event -->
                  <template v-if="i == 0">
                    <div :class="`eventsSearch__resultCell -first ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length && (i + 1 == item.works.length || i == 5)) ? '-last' : ''}`">
                      <span class="mobileHeader">Date/Season/Title</span>
                      {{ formatDate(item.performance_date) }} / {{ item.season + (item.event_title ? " / " + item.event_title : "")}}
                    </div>
                    <div :class="`eventsSearch__resultCell ${index % 2 == 0 ? '-even' : '-odd'} ${((index + 1 == items.length && (i + 1 == item.works.length || i == 5)) && (i + 1 == item.works.length || i == 5)) ? '-last' : ''}`">
                      <span class="mobileHeader">Venue</span>
                      {{ item.venue }} {{ formatLocation(item.location) }}
                    </div>
                    <div :class="`eventsSearch__resultCell ${index % 2 == 0 ? '-even' : '-odd'} 
                      ${(index + 1 == items.length && (i + 1 == item.works.length || i == 5)) ? '-last' : ''}`">
                      <span class="mobileHeader">Ensemble</span>
                      {{ w.ensembles.join('; ')}}
                    </div>
                    <div :class="`eventsSearch__resultCell 
                      ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length && (i + 1 == item.works.length || i == 5)) ? '-last' : ''}`">
                      <span class="mobileHeader">Conductor</span>
                      {{ w.conductors.join('; ') }}
                    </div>
                    <div :class="`eventsSearch__resultCell 
                        ${item.works.length > 1 ? '-work -left' : ''} ${index % 2 == 0 ? '-even' : '-odd'} 
                        ${(index + 1 == items.length && (i + 1 == item.works.length || i == 5)) ? '-last' : ''}`">
                       <span class="mobileHeader">Composer/Work</span>
                      {{ w?.composers?.join("; ") }} / {{ w?.title }}
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" v-if="w.has_recording">
                        <path d="M9.81086 5L6.92983 7.30483H4.625V10.7621H6.92983L9.81086 13.0669V5Z" stroke="#01ABE6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M12.4268 6.99365C12.9669 7.53393 13.2703 8.2666 13.2703 9.03054C13.2703 9.79449 12.9669 10.5272 12.4268 11.0674" stroke="#01ABE6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </div>
                    <div :class="`eventsSearch__resultCell -artist ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length && (i + 1 == item.works.length || i == 5)) ? '-last' : ''}`" v-if="w.artists && w.artists.length < 3">
                      {{ w.artists.map((artist) => artist.name + '/' + artist.role).join('; ') }}
                    </div>
                    <div :class="`eventsSearch__resultCell -artist ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length && (i + 1 == item.works.length || i == 5)) ? '-last' : ''}`" v-else>
                       {{ w.artists ? w.artists.map((artist) => artist.name + '/' + artist.role).slice(0, 2).join('; ') : ""}}
                       <br/><a v-if="w.artists" :href="`/details?performanceId=${item.id}`">More...</a>
                    </div>
                    <div :class="`eventsSearch__resultCell -detailsMobile
                      ${item.works.length > 1 ? '-details' : '' }
                      ${index % 2 == 0 ? '-even' : '-odd'} 
                      ${(index + 1 == items.length && (i + 1 == item.works.length || i == 5)) ? '-last -lastMobile' : ''}`">
                      <event-links :item="item" />
                    </div>
                  </template>
                  <!-- Additional event rows -->
                  <template v-else-if="i > 0 && i <= 4">
                    <div :class="`eventsSearch__resultCell -empty -first ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length && (i + 1 == item.works.length || i == 5)) ? '-last' : ''}`"></div>
                    <div :class="`eventsSearch__resultCell -empty ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length && (i + 1 == item.works.length || i == 5)) ? '-last' : ''}`"></div>
                    <div :class="`eventsSearch__resultCell -artist
                      ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length && (i + 1 == item.works.length || i == 5)) ? '-last' : ''}`">
                      {{ w.ensembles.join('; ')}}
                    </div>
                    <div :class="`eventsSearch__resultCell -artist ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length && (i + 1 == item.works.length || i == 5)) ? '-last' : ''}`">
                      {{ w.conductors.join('; ') }}
                    </div>
                    <div :class="`eventsSearch__resultCell -work 
                    ${ i % 2 == 1 ? '-right' : '-left' }
                    ${index % 2 == 0 ? '-even' : '-odd'} 
                    ${(index + 1 == items.length && (i + 1 == item.works.length || i == 5)) ? '-last' : ''}`">
                      <span class="mobileHeader" v-if="i == 1">Composer/Work</span>
                      {{ w?.composers?.join("; ") }} / {{ w?.title }}
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" v-if="w.has_recording">
                        <path d="M9.81086 5L6.92983 7.30483H4.625V10.7621H6.92983L9.81086 13.0669V5Z" stroke="#01ABE6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M12.4268 6.99365C12.9669 7.53393 13.2703 8.2666 13.2703 9.03054C13.2703 9.79449 12.9669 10.5272 12.4268 11.0674" stroke="#01ABE6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </div>
                    <div v-if="(i + 1 == item.works.length && i % 2 == 0)" :class="`eventsSearch__resultCell -emptyMobile -work -right ${index % 2 == 0 ? '-even' : '-odd'}`"></div>
                    <div :class="`eventsSearch__resultCell -artist 
                      ${index % 2 == 0 ? '-even' : '-odd'} 
                      ${(index + 1 == items.length && (i + 1 == item.works.length || i == 5)) ? '-last' : ''}`" 
                      v-if="w.artists && w.artists.length < 3">
                      {{ w.artists.map((artist) => artist.name + '/' + artist.role).join('; ') }}
                    </div>
                    <div :class="`eventsSearch__resultCell -artist 
                      ${index % 2 == 0 ? '-even' : '-odd'} 
                      ${(index + 1 == items.length && (i + 1 == item.works.length || i == 5)) ? '-last' : ''}`" 
                      v-else>
                      {{ w.artists ? w.artists.map((artist) => artist.name + '/' + artist.role).slice(0, 2).join('; ') : ""}}
                      <br/><a v-if="w.artists" :href="`/details?performanceId=${item.id}`">More...</a>
                    </div>
                    <div :class="`eventsSearch__resultCell -detailsMobile
                      ${index % 2 == 0 ? '-even' : '-odd'} 
                      ${(index + 1 == items.length && (i + 1 == item.works.length || i == 5)) ? '-last -lastMobile' : ''}
                      ${ !(i + 1 == item.works.length || i == 5) ? '-empty' : ''}`">
                      <template  v-if="(i + 1 == item.works.length || i == 5)">
                        <event-links :item="item" extra-classes="-detailsMobile" />
                       </template>
                    </div>
                  </template>
                  <template v-else-if="i > 4">
                    <div :class="`eventsSearch__resultCell -empty -first ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length && (i + 1 == item.works.length || i == 5)) ? '-last' : ''}`"></div>
                    <div :class="`eventsSearch__resultCell -empty ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length && (i + 1 == item.works.length || i == 5)) ? '-last' : ''}`"></div>
                    <div :class="`eventsSearch__resultCell -empty ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length && (i + 1 == item.works.length || i == 5)) ? '-last' : ''}`"></div>
                    <div :class="`eventsSearch__resultCell -empty ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length && (i + 1 == item.works.length || i == 5)) ? '-last' : ''}`"></div>
                    <div :class="`eventsSearch__resultCell ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length && (i + 1 == item.works.length || i == 5)) ? '-last' : ''}`">
                      <a :href="`/details?performanceId=${item.id}`">More...</a>
                    </div>
                    <div :class="`eventsSearch__resultCell -empty ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length && (i + 1 == item.works.length || i == 5)) ? '-last' : ''}`"></div>
                    <div :class="`eventsSearch__resultCell -empty ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length && (i + 1 == item.works.length || i == 5)) ? '-last' : ''}`"></div>
                  </template>
                </template>
                <template v-if="!item.works || item.works.length == 0">
                  <div :class="`eventsSearch__resultCell -first ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length) ? '-last' : ''}`">
                    <span class="mobileHeader">Date/Season/Title</span>
                    {{ formatDate(item.performance_date) }} / {{ item.season + (item.event_title ? " / " + item.event_title : "")}}
                  </div>
                  <div :class="`eventsSearch__resultCell ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length) ? '-last' : ''}`">
                     <span class="mobileHeader">Venue</span>
                    {{ item.venue }} {{ formatLocation(item.location) }}
                  </div>
                  <div :class="`eventsSearch__resultCell
                    ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length) ? '-last' : ''}`">
                    <span class="mobileHeader">Ensemble</span>
                    {{ item.ensembles ? item.ensembles.join('; ') : ""}}
                  </div>
                  <div :class="`eventsSearch__resultCell ${index % 2 == 0 ? '-even' : '-odd'} 
                    ${(index + 1 == items.length) ? '-last' : ''}`">
                    <span class="mobileHeader">Conductor</span>
                    {{ item.conductors.join('; ') }}
                  </div>
                  <div :class="`eventsSearch__resultCell ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length) ? '-last' : ''}`"><span class="mobileHeader">Composer/Work</span></div>
                  <div :class="`eventsSearch__resultCell -hideMobile ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length) ? '-last' : ''}`"></div>
                  <div :class="`eventsSearch__resultCell -detailsMobile ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length) ? '-last' : ''}`">
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
        >
          <template v-slot="{ items }">
            <div class="eventsSearch__artistsGrid">
              <div class="eventsSearch__resultCell -header -first">Artist</div>
              <div class="eventsSearch__resultCell -header">Instrument/Role</div>
              <div class="eventsSearch__resultCell -header">Composer/Work</div>
              <div class="eventsSearch__resultCell -header"># of Performances</div>

              <template v-for="item, index in items">
                <div :class="`eventsSearch__resultCell -first ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length) ? '-last' : ''}`">
                  <span class="mobileHeader">Artist</span>
                  <a :href="createURL([{ facet: 'works.artists.name', value: item.artist_name}])">
                    {{ item.artist_name }}
                  </a>
                </div>
                <div :class="`eventsSearch__resultCell ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length) ? '-last' : ''}`">
                  <span class="mobileHeader">Role</span>
                  <a :href="createURL([{ facet: 'works.artists.role', value: item.artist_role }])">
                    {{ item.artist_role }}
                  </a>
                </div>
                <div :class="`eventsSearch__resultCell ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length) ? '-last' : ''}`">
                  <span class="mobileHeader">Composer/Work</span>
                  <a :href="createURL([{ facet: 'works.title', value: item.work_title }])">
                    {{ item.composer }} / {{ item.work_title }}
                  </a>
                </div>
                <div :class="`eventsSearch__resultCell ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length) ? '-last' : ''}`">
                  <span class="mobileHeader"># of Performances</span>
                  <a :href="createURL([{ facet: 'works.artists.name', value: item.artist_name},
                    { facet: 'works.artists.role', value: item.artist_role },
                    { facet: 'works.title', value: item.work_title }
                  ])">
                    <span class="eventsSearch__lightLink">{{ item.num_performances }} Performances</span>
                    
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
          :sort-field="'last_performance_date'"
          :query-by-fields="'commission, composers, title'"
          :include-fields="'commission, composers, title, num_performances'"
          search-placeholder="Search by composer, work, or commission"
          results-title="Works"
        >
          <template v-slot="{ items }">
            <div class="eventsSearch__worksGrid">
              <div class="eventsSearch__resultCell -header -first">Composer</div>
              <div class="eventsSearch__resultCell -header">Work</div>
              <div class="eventsSearch__resultCell -header">Additional Creator</div>
              <div class="eventsSearch__resultCell -header"># of times Performed</div>
               <template v-for="item, index in items">
                <div :class="`eventsSearch__resultCell -first ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length) ? '-last' : ''}`">
                  <span class="mobileHeader">Composer</span>
                  <a v-for="composer, index in item.composers"
                    :href="createURL([{ facet: 'works.composers', value: composer}])">
                    {{ `${composer}${index < item.composers.length && item.composers.length > 1 ? '; ' : ''}` }}
                  </a>
                </div>
                <div :class="`eventsSearch__resultCell ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length) ? '-last' : ''}`">
                  <span class="mobileHeader">Work</span>
                  <a v-for="title, index in item.title"
                    :href="createURL([{ facet: 'works.title', value: title}])">
                    {{ `${title}${index < item.title.length && item.title.length > 1 ? '; ' : ''}` }}
                  </a>
                </div>
                <div :class="`eventsSearch__resultCell ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length) ? '-last' : ''}`">
                  <span class="mobileHeader">Additional Creator</span>
                  <a v-if="item.creators && item.creators.length" v-for="creator, index in item.creators"
                    :href="createURL([{ facet: 'works.creators.name', value: creator.name}])">
                    <template v-if="(typeof creator !== 'undefined' && creator && typeof creator.name !== 'undefined' && typeof creator.role !== 'undefined')">
                      {{ `${creator.name} / ${creator.role}${index < item?.creators?.length && items?.creators?.length > 1 ? '; ' : ''}` }}
                    </template>
                  </a>
                </div>
                <div :class="`eventsSearch__resultCell ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length) ? '-last' : ''}`">
                  <span class="mobileHeader"># of times Performed</span>
                  <a :href="createURL([{ facet: 'works.composers', value: item.composers},
                    { facet: 'works.creators', value: item.creators},
                    { facet: 'works.title', value: item.title}
                  ])">
                    <span class="eventsSearch__lightLink">{{ item.num_performances }} Performances</span>
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



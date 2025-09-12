<script setup>

  import { ref, onMounted, computed } from 'vue'
  import { AisClearRefinements,
    AisConfigure,
    AisCurrentRefinements,
    AisHighlight,
    AisHits,
    AisInstantSearch,
    AisPagination,
    AisRangeInput,
    AisRefinementList,
    AisSearchBox,
    AisStats }
    from 'vue-instantsearch/vue3/es'
  import TypesenseInstantSearchAdapter from 'typesense-instantsearch-adapter'
  import VueDatePicker from '@vuepic/vue-datepicker';
  import '@vuepic/vue-datepicker/dist/main.css'
  import { history as historyRouter } from 'instantsearch.js/es/lib/routers'
  import { simple as simpleStateMapping } from 'instantsearch.js/es/lib/stateMappings'

  const props = defineProps({
    indexName: {
      type: String,
      default: "performances"
    }
  })

  const date = ref()
  const routing = ref({
    router: historyRouter(),
    stateMapping: simpleStateMapping()
  })
  const byDate = ref(true)
  const datepicker = ref(null)

  const today = Math.floor(Date.now()/1000)
  console.log('today', today)



  const typesenseInstantsearchAdapter = new TypesenseInstantSearchAdapter({
    server: {
      connectionTimeoutSeconds: 20,
      apiKey: 'qoWHCTjesGfIaxdXbw9vOgod1VToEXNI', // Be sure to use an API key that only allows search operations
      nodes: [
        {
          host: 'go8f04wi19tuvlyrp-1.a1.typesense.net',
          path: '', // Optional. Example: If you have your typesense mounted in localhost:8108/typesense, path should be equal to '/typesense'
          port: '443',
          protocol: 'https',
        },
      ],
      cacheSearchResultsForSeconds: 0, // Cache search results from server. Defaults to 2 minutes. Set to 0 to disable caching.
    },
    // The following parameters are directly passed to Typesense's search API endpoint.
    //  So you can pass any parameters supported by the search endpoint below.
    //  query_by is required.
    additionalSearchParameters: {
      query_by: 'title, excerpt, subhead, content_keywords',
      sort_by: 'performance_date:asc',
      // group_by: 'event_id',
      group_limit: 1
    },
  })

  const searchClient = typesenseInstantsearchAdapter.searchClient

  const perPage = computed(() => byDate.value ? 10 : 8)

  onMounted(() => {
    // const startDate = new Date();
    // const endDate = new Date(new Date().setDate(startDate.getDate() + 7));
    // date.value = [startDate, endDate];
    //datepicker.value.clearValue()
    console.log("index name", props.indexName)
  })

  const format = (date) => {
    if (date && date.length > 1) {
      const startDay = date[0].getDate();
      const startMonth = date[0].getMonth() + 1;
      const startYear = date[0].getFullYear();

      const endDay = date[1].getDate();
      const endMonth = date[1].getMonth() + 1;
      const endYear = date[1].getFullYear();

      return `${startMonth}/${startDay}/${startYear} - ${endMonth}/${endDay}/${endYear}`;
    }
    return ''

  }

  function formatDate(unix_timestamp, display = true) {
        // multiplied by 1000 so that the argument is in milliseconds, not seconds
    const date = new Date(unix_timestamp * 1000)
    const days = ["Sun", "Mon", "Tues", "Weds", "Thurs", "Fri", "Sat"]
    const months = ["January", "February", "March", "Apil", "May", "June", "July", "August", "September", "October", "November", "December"]
    const hour = date.getHours() + 1 > 12 ? date.getHours() - 11 : date.getHours() + 1
    const amPm = date.getHours() + 1 > 12 ? "pm" : "am"
    const minutes = "0" + date.getMinutes()

    if (display) {
      return `${days[date.getDay()]}, ${(months[date.getMonth()]).substring(0, 3)} ${date.getDate()}, ${hour}:${minutes.substr(-2)}${amPm} EDT`
    } else {
      return `${months[date.getMonth()]}, ${date.getFullYear()}`
    }
  }

  function groupItemsByMonth(items) {
    console.log(items)
    let groupedItems = {}
    let currentMonth = null
    items.forEach(item => {
      if (currentMonth != formatDate(item.performance_date, false)) {
        currentMonth = formatDate(item.performance_date, false)
        groupedItems[currentMonth] = []
      }
      groupedItems[currentMonth].push(item)
    })
    return groupedItems
  }

  function toValue(value, range) {
      return [
        typeof value.min === "number" ? value.min * 1000 : range.min * 1000,
        typeof value.max === "number" ? value.max * 1000 : range.max * 1000,
      ];
    }

  function toggleView() {
    byDate.value = !byDate.value
    if (byDate.value) {
      typesenseInstantsearchAdapter.updateConfiguration({...typesenseInstantsearchAdapter.configuration, additionalSearchParameters: {
        query_by: 'title, excerpt, subhead, content_keywords',
        sort_by: 'performance_date:asc'
      }})
    } else {
      typesenseInstantsearchAdapter.updateConfiguration({...typesenseInstantsearchAdapter.configuration, additionalSearchParameters: {
        query_by: 'title, excerpt, subhead, content_keywords',
        sort_by: 'performance_date:asc',
        group_by: 'event_id',
        group_limit: 1
      }})
    }
  }

  function displayItems(items) {
    console.log('performance_venue', items)
    return items
  }

  const setDate = (value) => {
    console.log('set date', value)
    date.value = value;
  }

  function clearDate() {
    datepicker.value.clearValue()
  }
</script>


<template>
  <h1>Search</h1>

  <ais-instant-search
    :search-client="searchClient"
    :index-name="props.indexName"
    :routing="routing"
  >
    <ais-configure
      :hits-per-page.camel="perPage"
      />
    <ais-search-box placeholder="Search for events..." /><br/><br/>

     <br/><br/>
    <button v-text="byDate ? 'By Event' : 'By Date'" @click="toggleView" />
    <ais-range-input attribute="performance_date">
      <template  v-slot="{ currentRefinement, range, refine }">
        Date: <vue-date-picker
                ref="datepicker"
                @update:model-value="setDate"
                :model-value="toValue(currentRefinement, range)"
                :format="format"
                @cleared="refine({ min: Math.floor((new Date())/1000) })"
                range
                multi-calendars
                :enable-time-picker="false"
                @closed="console.log(Math.floor(date[0]/1000), date[1]/1000);refine({ min: Math.floor(date[0]/1000), max: Math.floor(date[1]/1000) })"/>
      </template>
    </ais-range-input>
    Venue: <ais-refinement-list attribute="facet_venue" show-more>
       <template
          v-slot="{
            items,
            isShowingMore,
            isFromSearch,
            canToggleShowMore,
            refine,
            createURL,
            toggleShowMore,
            searchForItems,
            sendEvent,
          }"
        >
          <input @input="searchForItems($event.currentTarget.value)" />
          <ul>
            <li v-if="isFromSearch && !items.length">No results.</li>
            <li v-for="item in items" :key="item.value">
              <a
                :href="createURL(item)"
                :style="{ fontWeight: item.isRefined ?  'bold' : '' }"
                @click.prevent="refine(item.value)"
              >
                <div v-html="item.value"></div>
                <!-- <ais-highlight attribute="item" :hit="item.name"/> -->
                ({{ item.count }})
              </a>
            </li>
          </ul>
        </template>

    </ais-refinement-list><br/><br/>
     Ensembles: <ais-refinement-list attribute="ensembles" show-more>
       <template
          v-slot="{
            items,
            isShowingMore,
            isFromSearch,
            canToggleShowMore,
            refine,
            createURL,
            toggleShowMore,
            searchForItems,
            sendEvent,
          }"
        >
          <input @input="searchForItems($event.currentTarget.value)" />
          <ul>
            <li v-if="isFromSearch && !items.length">No results.</li>
            <li v-for="item in items" :key="item.value">
              <a
                :href="createURL(item)"
                :style="{ fontWeight: item.isRefined ?  'bold' : '' }"
                @click.prevent="refine(item.value)"
              >
                <ais-highlight attribute="item" :hit="item"/>
                ({{ item.count }})
              </a>
            </li>
          </ul>
        </template>

    </ais-refinement-list><br/><br/>

    <!-- Current Refinements cannot go within the hits-->
    Current Refinements: <br/>
    <ais-current-refinements :excluded-attributes="['performance_date']">
      <template v-slot="{ items, createURL }">
        <ul>
          <li v-for="item in items" :key="item.attribute">
            <ul>
              <li
                v-for="refinement in item.refinements"
                :key="[
                  refinement.attribute,
                  refinement.type,
                  refinement.value,
                  refinement.operator
                ].join(':')"
              >
                <a
                  :href="createURL(refinement)"
                  @click.prevent="item.refine(refinement)"
                  v-html="refinement.label + ' X'"
                ></a>
              </li>
            </ul>
          </li>
        </ul>
      </template>
    </ais-current-refinements> <br/><br/>
    <ais-clear-refinements>
      <template v-slot="{ canRefine, refine, createURL }">
        <a
          :href="createURL()"
          @click.prevent="refine"
          v-if="canRefine"
        >
          Clear all filters
        </a>
      </template>
    </ais-clear-refinements>
    <ais-hits > <!-- Search results -->

      <template v-slot="{ items }">
        <ais-stats>
           <template v-slot="{ nbHits, query }">
            <span v-if="query != '*'">{{ nbHits }} Results</span>
            <span v-else></span><!-- if there is no v-else ais-stats shows the default stats-->
          </template>
        </ais-stats>

        <div v-if="byDate">
          <div v-for="month, key in groupItemsByMonth(items)" :key="key">
            <h2>Month: {{ key }}</h2>
            <div v-for="item, index in month" :key="item.objectId">
              <img :src="item.image_src" :alt="item.image_alt" style="width:200px;" />
              <span v-if="item.event_status.length"><em>Status:</em> <span v-for="status in item.event_status">{{ status }} </span><br/></span>
              <span v-if="item.performance_categories.length"><em>Categories:</em> <span v-for="cat in item.performance_categories">{{ cat }} </span><br/></span>
              <span><em>Event Title:</em> </span><span v-html=" item.title "></span><br/>
              <span v-if="item.subhead"><em>Subhead:</em> {{ item.subhead }}<br/></span>

              <span><em>Performance Date:</em> {{ formatDate(item.performance_date) }}<br/></span>

              <span><em>Venue:</em> <a :href="item.performance_venue.link">{{ item.performance_venue.name }}</a>, {{ item.performance_venue.location }}</span><br/>
              <span><em>Performance Note:</em> {{ item.performance_note }}</span>
              <span><a :href="item.performance_link">Learn more</a></span><br/>
              <span><a :href="item.ticket_link">{{ item.ticket_text ? item.ticket_text : 'Buy Tickets' }}</a><br/></span>
              <br/>
            </div>
          </div>
        </div>
        <div v-else>
          <div v-for="item in items" :key="item.objectId">
            <img :src="item.image_src" :alt="item.image_alt" style="width:200px;" />
            <span v-if="item.event_status.length"><em>Status:</em> <span v-for="status in item.event_status">{{ status }} </span><br/></span>
            <span v-if="item.performance_categories.length"><em>Categories:</em> <span v-for="cat in item.performance_categories">{{ cat }} </span><br/></span>
            <span><em>Event Title:</em> </span><span v-html=" item.title "></span><br/>
            <span v-if="item.subhead"><em>Subhead:</em> {{ item.subhead }}<br/></span>

            <span v-if="item.num_performances == 1"><em>Performance Date:</em> {{ formatDate(item.performance_date) }}<br/></span>
            <span v-else-if="item.performance_range"><em>Performance Range:</em> {{ item.performance_range }}<br/></span>

            <span><em>Venue:</em> <a :href="item.performance_venue.link">{{ item.performance_venue.name }}</a>, {{ item.performance_venue.location }}</span><br/>
            <span><em>Performance Note:</em> {{ item.performance_note }}</span>
            <span><a :href="item.performance_link">Learn more</a></span><br/>
            <span v-if="item.ticket_link && item.num_performances == 1"><a :href="item.ticket_link">{{ item.ticket_text ? item.ticket_text : 'Buy Tickets' }}</a><br/></span>
            <span v-else><a :href="item.performance_link">Get Tickets</a></span>
            <br/>
          </div>
        </div>
      </template>
    </ais-hits>
    <ais-pagination
      :show-first="true"
      :show-previous="true"
      :show-next="true"
      :show-last="true"
      ></ais-pagination>
  </ais-instant-search>

</template>

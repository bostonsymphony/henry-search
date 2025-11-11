<script setup>
    import { onMounted, ref } from 'vue'
    import {
        AisClearRefinements,
        AisCurrentRefinements,
        AisHighlight,
        AisHits,
        AisInstantSearch,
        AisMenuSelect,
        AisPagination,
        AisRangeInput,
        AisRefinementList,
        AisSearchBox,
        AisStats
    } from 'vue-instantsearch/vue3/es'
    import TypesenseInstantSearchAdapter from 'typesense-instantsearch-adapter'
    import { history as historyRouter } from 'instantsearch.js/es/lib/routers'
    import { simple as simpleStateMapping } from 'instantsearch.js/es/lib/stateMappings'
    import PAccordion from './PAccordion.vue'
    import VueDatePicker from '@vuepic/vue-datepicker'
    import slugify from '../composables/slugify'
    import formatDate from '../composables/formatDate'
    import vSelect from 'vue-select'
 
    const props = defineProps({
        indexName: {
            type: String,
            default: "archived_performances"
        },
        mainRefinements: {
            type: Object,
            require: true
        },
        addlRefinements: {
            type: Object,
            default: null
        },
        queryByFields: {
            type: String,
            default: "works, season, venue, event_types, notes, event_title"
        },
        sortField: {
            type: String,
            default: "performance_date"
        },
        searchPlaceholder: {
            type: String,
            default: "Search for performances..."
        },
        resultsTitle: {
            type: String,
            default: "Performances"
        }
    })

    const sortView = ref('Most Recent')
    
    const updateNow = ref(0)

    // onMounted(() => {

    // })

    const routing = ref({
        router: historyRouter({
            // Disable scroll restoration to prevent erratic behavior
            writeDelay: 0,
            parseURL({ qsModule, location }) {
                const uiState = qsModule.parse(location.search.slice(1))

                updateStateRefs(uiState)
                
                return uiState
            }
        }),
        stateMapping: simpleStateMapping()
    })

    const server = {
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
    }
    const adapter = new TypesenseInstantSearchAdapter({
        server: server,
        additionalSearchParameters: {
            query_by: props.queryByFields,
            sort_by: `${props.sortField}:desc`,
        },
    })

    const searchClient = adapter.searchClient

    let showNumHits = false
    let showByWorks = false
    let workFilters = null
    let currentQuery = null

    function toggleFilters() {
        const wrapper = document.getElementById(`${props.indexName}_filterRail`)
        const tabContent = document.getElementById(`${props.indexName}_tabs__content`)
        const leftPane = document.getElementById(`${props.indexName}_eventsSearch__results`)
        const toggleOnButton = document.getElementById(`${props.indexName}_filterToggleOn`)
        if (toggleOnButton) {
            toggleOnButton.classList.toggle('closed')
        }
        wrapper.classList.toggle('closed')
        leftPane.classList.toggle('closed')
        tabContent.classList.toggle('open')
        tabContent.classList.toggle('closed')
    }

    function updateStateRefs(uiState) {
        if (uiState && uiState[props.indexName]) {
            currentQuery = uiState[props.indexName].query
            if (currentQuery) {
                if (sortView.value != 'Most Relevant') {
                    sortView.value = 'Most Relevant'
                }
            } else {
                if (sortView.value != 'Most Recent') {
                    sortView.value = 'Most Recent'
                }
            }
            showNumHits = currentQuery || uiState[props.indexName].refinementList || uiState[props.indexName].range || uiState[props.indexName].menu
            workFilters =  uiState[props.indexName].refinementList && Object.keys(uiState[props.indexName].refinementList).length !== 0 ? getWorkFilters(uiState[props.indexName].refinementList) : []
            showByWorks = Object.keys(workFilters).length !== 0

        }
    }

    function getWorkFilters(refinementList) {
        let returnFilters = {}
        Object.entries(refinementList).forEach(([k, v]) => {
            if (k.includes('works')) {
                let workAttribute = k.substring(k.indexOf('works.') + 6, k.length)
                const subFilter = {}
                if (workAttribute.includes('.')) {
                    const workSubAttribute = workAttribute.substring(workAttribute.indexOf('.') + 1, workAttribute.length)
                    workAttribute = workAttribute.substring(0, workAttribute.indexOf('.'))
                    const subSubFilter = {}
                    subSubFilter[workSubAttribute] = v
                    subFilter[workAttribute] = subSubFilter
                    
                } else {
                    subFilter[workAttribute] = v
                }
                returnFilters = {...returnFilters, ...subFilter}
            }
        })
        return returnFilters
    }

    function onStateChange({ uiState, setUiState }) {
        updateStateRefs(uiState)
        setUiState(uiState)
        //console.log('uiState', uiState)

        // update search history
        let searchHistory = sessionStorage.getItem('searchHistory') ? JSON.parse(sessionStorage.getItem('searchHistory')) : []
        // if only pagination, don't add to search history
        if (uiState[props.indexName].page && !uiState[props.indexName].query && !uiState[props.indexName].refinementList && !uiState[props.indexName].menu) {
            return
        }
        searchHistory = searchHistory.map((item) => {
            // make sure that all queries aren't entered into the history as a user types each letter
            if (uiState[props.indexName].query?.includes(item.query) && uiState[props.indexName].query != item.query) {
                return {
                    date: new Date(),
                    uiState: uiState,
                    query: uiState[props.indexName].query,
                    link: document.location.href
                }
            } else {
                return item
            }
        })

        //make sure we're not just adding pagination
        let addState = true
        searchHistory.forEach((item) => {
            if (item.link.replace(/\&page=\d*/, "") == document.location.href.replace(/\&page=\d*/, "")) {
                addState = false
                return
            }
        })
        
        
        if (addState && !(searchHistory.map((a) => a.link)).includes(document.location.href) && 
                document.location.search != '') {
             searchHistory.push({
                date: new Date(),
                uiState: uiState,
                query: uiState[props.indexName].query,
                link: document.location.href
            })
        }
       
        //console.log('searchHistory', searchHistory, typeof searchHistory)
        sessionStorage.setItem('searchHistory', JSON.stringify(searchHistory))
        
       
    }

    function setView() {
        if (sortView.value == 'Oldest First') {
            adapter.updateConfiguration({...adapter.configuration, additionalSearchParameters: {
                query_by: props.queryByFields,
                sort_by: `${props.sortField}:asc`
            }})
        } else if (sortView.value == 'Most Relevant') {
            adapter.updateConfiguration({...adapter.configuration, additionalSearchParameters: {
                query_by: props.queryByFields,
                sort_by: `_text_match:desc,${props.sortField}:desc`
            }})
        } else {
            adapter.updateConfiguration({...adapter.configuration, additionalSearchParameters: {
                query_by: props.queryByFields,
                sort_by: `${props.sortField}:desc`
            }})
        }
        updateNow.value++
    }

    function formatRefinement(refinement) {
        const attributeMap = {
            "works.composers" : "Composer",
            "works.title" : "Work",
            "conductors" : "Conductor",
            "ensembles" : "Orchestra",
            "works.artists.name" : "Artist",
            "query" : "Keyword",
            'works.artists.role': 'Instrument/Role',
            'season': 'Season',
            'event_title': 'Event Title',
            'event_types': 'Series',
            'venue': 'Venue',
            'works.commission': 'Commission',
            'location.city': 'City',
            'location.country': 'Country',
            'location.state': 'State',
            'artist_name': 'Artist',
            'artist_role': 'Instrument/Role',
            'title': 'Work Title',
            'composers': 'Composer',
            'composer': 'Composer'
        }
        if (refinement.attribute == 'performance_date' || refinement.attribute == 'last_performance_date') {
            return 'Date: ' + refinement.label[0] + ' ' + formatDate(refinement.value) + ' ×'
        }
        if (attributeMap[refinement.attribute]) {
            return attributeMap[refinement.attribute] + ': ' + refinement.value + ' ×'
        } else {
            return refinement.attribute + ': ' + refinement.value + ' ×'
        }
       
    }

    function intersect(filters, work){
        let intersectKeys = Object.keys(filters).filter(k => Object.hasOwn(work, k))
        let intersectArray = []
        intersectKeys.forEach((key) => {
            if (typeof filters[key] == 'object' && typeof work[key] == 'object') {
                if (Array.isArray(work[key])) {
                    Object.entries(filters[key])?.forEach(([k1, v1]) => {
                        work[key]?.forEach((workvalue) => {
                            if (typeof workvalue == 'object') {
                                Object.entries(workvalue).forEach(([k2, v2]) => {
                                    if (k1 == k2 && v1.includes(v2)) {
                                        intersectArray.push(workvalue[k2])
                                    }
                                })
                            }
                            
                        })
                    }) 
                }
            } else if (filters[key].includes(work[key])) {
                intersectArray.push(work[key])
            }
        })
        return intersectArray

    }

    function filterItems(items) {
        if (showByWorks && props.indexName == "dev_henry_perfs") {
            let returnItems = items
            let itemIndex = 0
            returnItems.forEach((item) => {
                let shownWorks = []
                item?.works.forEach((work) => {
                    let workAdded = false
                    if (intersect(workFilters, work)?.length) {
                        shownWorks.push(work)
                        workAdded = true
                    }
                    if (!workAdded && currentQuery && JSON.stringify(work).includes(currentQuery)) {
                        shownWorks.push(work)
                    }  
                })
                returnItems[itemIndex].works = shownWorks
                itemIndex++
            })
            return returnItems
        } else {
            return items
        }
        

    }

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

    function toMinValue(value, range) {
        return typeof value.min === "number" && value.min != 0 ? value.min * 1000 : range.min * 1000
    }

    function toMaxValue(value, range) {
        return typeof value.max === "number" && value.max != 0 ? value.max * 1000 : range.max * 1000
    }

    function formatMinValue(minValue, minRange) {
        return typeof minValue === "number" && minValue !== null && minValue !== minRange ? minValue : minRange
    }
    
    function formatMaxValue(maxValue, maxRange) {
      return typeof maxValue === "number" &&  maxValue !== null && maxValue !== maxRange ? maxValue : maxRange
    }

</script>

<template>
    <ais-instant-search
        :search-client="searchClient"
        :index-name="props.indexName"
        :routing="routing"
        :on-state-change="onStateChange"
        
    >
    <!-- :key="sortView" -->
        <div class="tabs__content open" :id="`${props.indexName}_tabs__content`">
            <!-- Header and Search Section -->
            <div class="eventsSearch__topSection">
                <!-- Search Filters Section -->
                <section class="eventsSearch__filters">
                    <div class="eventsSearch__filtersRow">
                        <!-- Search Box -->
                        <div class="eventsSearch__filterGroup eventsSearch__filterGroup--search">
                            <ais-search-box
                                
                                class="eventsSearch__searchBox"
                            >
                                <template v-slot="{ currentRefinement, isSearchStalled, refine }">
                                    <form class="ais-SearchBox-form" novalidate>
                                        <input
                                            class="ais-SearchBox-input"
                                            type="search"
                                            :value="currentRefinement"
                                            @input="refine($event.currentTarget.value)"
                                            :placeholder="props.searchPlaceholder"
                                            >
                                        <button type="submit" title="Submit the search query" class="ais-SearchBox-submit"><svg aria-hidden="true" width="10" height="10" viewBox="0 0 40 40" class="ais-SearchBox-submitIcon"><path d="M26.804 29.01c-2.832 2.34-6.465 3.746-10.426 3.746C7.333 32.756 0 25.424 0 16.378 0 7.333 7.333 0 16.378 0c9.046 0 16.378 7.333 16.378 16.378 0 3.96-1.406 7.594-3.746 10.426l10.534 10.534c.607.607.61 1.59-.004 2.202-.61.61-1.597.61-2.202.004L26.804 29.01zm-10.426.627c7.323 0 13.26-5.936 13.26-13.26 0-7.32-5.937-13.257-13.26-13.257C9.056 3.12 3.12 9.056 3.12 16.378c0 7.323 5.936 13.26 13.258 13.26z"></path></svg>
                                        </button>
                                    </form>
                                    <span :hidden="!isSearchStalled">Loading...</span>
                                </template>
                            </ais-search-box>
                        </div>
                        <div class="eventsSearch__filterGroup eventsSearch__filterGroup--date">
                            <ais-range-input :attribute="props.sortField">
                                <template v-slot="{ currentRefinement, range, canRefine, refine, sendEvent }" >
                                    <vue-date-picker
                                        :model-value="toMinValue(currentRefinement, range)"
                                        @update:model-value="(modelValue) => {
                                            refine({
                                                min: formatMinValue(modelValue/1000, range.min),
                                                max: formatMaxValue(currentRefinement.max, range.max),
                                            });
                                            
                                        }"
                                        
                                        :clearable="false"
                                        :multi-calendars="false"
                                        :enable-time-picker="false"
                                        :text-input="true"
                                        placeholder="Start"
                                        class="eventsSearch__datePicker"
                                        id="start"
                                    />
                                    <vue-date-picker
                                        :model-value="toMaxValue(currentRefinement, range)"
                                        @update:model-value="(modelValue) => { refine({
                                            min: formatMinValue(currentRefinement.min, range.min),
                                            max: formatMaxValue(modelValue/1000, range.max),
                                        })}"
                                        :clearable="false"
                                        :text-input="true"
                                        :multi-calendars="false"
                                        :enable-time-picker="false"
                                        placeholder="End"
                                        class="eventsSearch__datePicker"
                                        id="end"
                                    />
                                </template>
                            </ais-range-input>
                        </div>
                        <div class="eventsSearch__filterGroup">
                            <button class="button info">Search</button>
                        </div>
                    </div>
                </section>
            </div>

                <!-- View Toggle and Active Filters -->
            <section class="eventsSearch__filterRail" :id="`${props.indexName}_filterRail`">
                
                <div class="eventsSearch__filterWrapper">
                    <div class="eventsSearch__filterHeader">
                        <div class="eventsSearch__filterToggle">
                            <svg width="24" height="24" viewBox="0 0 24 24" >
                                <rect width="24" height="24" rx="4" fill="#01ABE6"/>
                                <path d="M6 7.25H18.8864" stroke="white" stroke-linecap="round"/>
                                <path d="M6 12.5681H18.8864" stroke="white" stroke-linecap="round"/>
                                <path d="M6 17.75H18.8864" stroke="white" stroke-linecap="round"/>
                                <circle cx="8.72709" cy="17.9544" r="1.54545" fill="#01ABE6" stroke="white"/>
                                <circle cx="14.8633" cy="12.5" r="1.54545" fill="#01ABE6" stroke="white"/>
                                <circle cx="10.7725" cy="7.04545" r="1.54545" fill="#01ABE6" stroke="white"/>
                            </svg> 
                            <span class="label">Filters</span>
                        </div>
                        <div><a :id="`${props.resultsTitle.toLowerCase()}_filterToggle`" @click="toggleFilters()">Hide</a></div>
                    </div>
                    <ais-refinement-list v-for="refinement in mainRefinements" :attribute="refinement.attribute" operator="and">
                        <template v-slot="{items, refine, searchForItems}">
                            <p-accordion :name="refinement.title" class="accordion" v-if="items.length > 1" :start-open="true">
                                <summary class="accordion__summary">
                                    <h6 class="accordion__heading">{{ refinement.title }}</h6>
                                    <div class="accordion__iconWrapper">
                                    <svg class="accordion__icon icon icon--chevron-right" aria-hidden="true" role="presentation"  viewBox="0 0 18 18" fill="none">
                                        <path d="M7 17L15 9L7 1" stroke="var(--icon-color, currentColor)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                    </div>
                                </summary>
                                <div class="accordion__content">
                                    <div class="ais-SearchBox eventsSearch__searchBox -filter">
                                        <input @input="searchForItems($event.currentTarget.value)" :placeholder="refinement.placeholder" class="ais-SearchBox-input -filter">
                                    </div>
                                    <div class="eventsSearch__checkBoxes">
                                        <label v-for="item in items" class="eventsSearch__boxLabel" :for="slugify(refinement.title + ' ' + item.value)">
                                            <div class="eventSearch__checkBox">
                                                <input :class="`checkbox ${item.isRefined ? '-boxChecked' : ''}`" type="checkbox" :id="slugify(refinement.title + ' ' + item.value)"  :value="item.value" :checked="item.isRefined" @click="refine(item.value)">
                                            </div>
                                            <span>{{ item.value }}</span><span class="eventsSearch__refinementCount">{{ item.count }}</span>
                                        </label>
                                    </div>
                                </div> 
                            </p-accordion>
                            <template v-else><div></div></template>
                        </template>
                    </ais-refinement-list>
                    <p-accordion v-if="props.addlRefinements" :start-open="false" open-text="Fewer Filters" closed-text="More Filters">
                        <summary class="accordion__summary">
                            <h6 class="accordion__heading -thin">More Filters</h6>
                        </summary>
                        <div class="accordion__content">
                            <template v-for="refinement in props.addlRefinements">
                                <ais-refinement-list v-if="refinement.type == 'list'" :attribute="refinement.attribute" operator="and">
                                    <template v-slot="{items, refine, searchForItems}">
                                        <p-accordion :name="refinement.title" class="accordion" v-if="items.length > 1" :start-open="false">
                                            <summary class="accordion__summary">
                                                <h6 class="accordion__heading">{{ refinement.title }}</h6>
                                                <div class="accordion__iconWrapper">
                                                <svg class="accordion__icon icon icon--chevron-right" aria-hidden="true" role="presentation"  viewBox="0 0 18 18" fill="none">
                                                    <path d="M7 17L15 9L7 1" stroke="var(--icon-color, currentColor)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                                </svg>
                                                </div>
                                            </summary>
                                            <div class="accordion__content">
                                                <div class="ais-SearchBox eventsSearch__searchBox -filter" v-if="!refinement.hideSearch">
                                                    <input @input="searchForItems($event.currentTarget.value)" :placeholder="refinement.placeholder" class="ais-SearchBox-input -filter">
                                                </div>
                                                <div class="eventsSearch__checkBoxes">
                                                    <label v-for="item in items" class="eventsSearch__boxLabel" :for="slugify(refinement.title + ' ' + item.value)">
                                                        <div class="eventSearch__checkBox">
                                                            <input :class="`checkbox ${item.isRefined ? '-boxChecked' : ''}`" type="checkbox" :id="slugify(refinement.title + ' ' + item.value)"  :value="item.value" :checked="item.isRefined" @click="refine(item.value)">
                                                        </div>
                                                        <span>{{ item.value }}</span><span>{{ item.count }}</span>
                                                    </label>
                                                </div>
                                            </div> 
                                        </p-accordion>
                                        <template v-else><div></div></template>
                                    </template>
                                </ais-refinement-list>
                                <h6 class="accordion__heading" v-if="refinement.type == 'location'">Location</h6>
                                <ais-menu-select v-if="refinement.type == 'location'" :attribute="'location.city'" operator="or">
                                    <template v-slot="{ items, canRefine, refine, sendEvent }">
                                         <select
                                            :disabled="!canRefine"
                                            @change="refine($event.currentTarget.value)"
                                            >
                                            <option value="">Select City</option>
                                            <option
                                                v-for="item in items"
                                                :key="item.value"
                                                :value="item.value"
                                                :selected="item.isRefined"
                                            >
                                                {{ item.label }}
                                            </option>
                                        </select>
                                    </template>
                                </ais-menu-select>
                                <ais-menu-select v-if="refinement.type == 'location'" :attribute="'location.state'" operator="or">
                                    <template v-slot="{ items, canRefine, refine, sendEvent }">
                                        <select
                                            :disabled="!canRefine"
                                            @change="refine($event.currentTarget.value)"
                                            >
                                            <option value="">Select State</option>
                                            <option
                                                v-for="item in items"
                                                :key="item.value"
                                                :value="item.value"
                                                :selected="item.isRefined"
                                            >
                                                {{ item.label }}
                                            </option>
                                        </select>
                                    </template>
                                </ais-menu-select>
                                <ais-menu-select v-if="refinement.type == 'location'" :attribute="'location.country'" operator="or">
                                    <template v-slot="{ items, canRefine, refine, sendEvent }">
                                        <select
                                            :disabled="!canRefine"
                                            @change="refine($event.currentTarget.value)"
                                            >
                                            <option value="">Select Country</option>
                                            <option
                                                v-for="item in items"
                                                :key="item.value"
                                                :value="item.value"
                                                :selected="item.isRefined"
                                            >
                                                {{ item.label }}
                                            </option>
                                        </select>
                                    </template>
                                </ais-menu-select>
                            </template>
                           
                            <!-- add locations here -->
                            
                        </div>
                    </p-accordion>
                </div>
            </section>

            <!-- Search Results Section -->
            <section class="eventsSearch__results" :id="`${props.indexName}_eventsSearch__results`">
                
                <ais-hits :key="updateNow" class="eventsSearch__hits" :transform-items="filterItems">
                    <template v-slot="{ items }">
                        <div class="eventsSearch__resultsHeader">
                            <div class="eventsSearch__resultsTitle">
                                <svg width="24" height="24" viewBox="0 0 24 24" :id="`${props.indexName}_filterToggleOn`" class="eventsSearch__filterToggleOn" @click="toggleFilters()">
                                    <rect width="24" height="24" rx="4" fill="#01ABE6"/>
                                    <path d="M6 7.25H18.8864" stroke="white" stroke-linecap="round"/>
                                    <path d="M6 12.5681H18.8864" stroke="white" stroke-linecap="round"/>
                                    <path d="M6 17.75H18.8864" stroke="white" stroke-linecap="round"/>
                                    <circle cx="8.72709" cy="17.9544" r="1.54545" fill="#01ABE6" stroke="white"/>
                                    <circle cx="14.8633" cy="12.5" r="1.54545" fill="#01ABE6" stroke="white"/>
                                    <circle cx="10.7725" cy="7.04545" r="1.54545" fill="#01ABE6" stroke="white"/>
                                </svg> 
                                <h3 v-if="showNumHits">
                                    <ais-stats>
                                        <template v-slot="{ nbHits }">
                                            {{ nbHits }} {{ nbHits > 1 ? 'Results' : 'Result' }}
                                        </template>
                                    </ais-stats>
                                </h3>
                                <h3 v-else>{{ props.resultsTitle }}</h3>

                            </div>
                            <div class="eventsSearch__actions">
                                <div class="eventsSearch__resultsSort">Sort by: 
                                    <select v-model="sortView" @change="setView">
                                    <option value="Most Recent">Most Recent</option>
                                    <option value="Most Relevant">Most Relevant</option>
                                    <option value="Oldest First">Oldest First</option>
                                    </select>
                                </div>
                                <div v-if="showNumHits" class="eventsSearch__actionButtons">
                                    <a onclick="navigator.clipboard.writeText(window.location.href);" class="eventsSearch__actionIcon">
                                        <svg width="9" height="9" viewBox="0 0 9 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M3.8335 5.00683C4.00129 5.24348 4.21538 5.4393 4.46122 5.581C4.70706 5.72269 4.97891 5.80696 5.25834 5.82807C5.53776 5.84918 5.81823 5.80665 6.0807 5.70336C6.34317 5.60006 6.58152 5.43843 6.77957 5.22941L7.95175 3.99281C8.30762 3.6041 8.50454 3.08349 8.50009 2.5431C8.49564 2.00271 8.29018 1.48578 7.92796 1.10365C7.56574 0.721528 7.07574 0.504774 6.5635 0.500078C6.05127 0.495382 5.55778 0.70312 5.18932 1.07855L4.51727 1.78341" stroke="#01ABE6" stroke-linecap="round" stroke-linejoin="round"/>
                                            <path d="M5.83333 3.99326C5.64156 3.7566 5.3969 3.56078 5.11594 3.41908C4.83497 3.27739 4.52428 3.19313 4.20494 3.17201C3.8856 3.1509 3.56507 3.19343 3.2651 3.29673C2.96513 3.40002 2.69273 3.56165 2.46639 3.77067L1.12675 5.00727C0.720043 5.39598 0.494997 5.9166 0.500084 6.45698C0.505171 6.99737 0.739985 7.5143 1.15395 7.89643C1.56791 8.27855 2.12791 8.49531 2.71332 8.5C3.29874 8.5047 3.86273 8.29696 4.28382 7.92153L5.04741 7.21667" stroke="#01ABE6" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                    </a>
                                    <a :href="`/actions/csvexport/csv-export${ routing.router.getLocation().search }`"  class="eventsSearch__actionIcon">
                                        <svg width="8" height="12" viewBox="0 0 8 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M7.47805 10.9099L0.5 10.9099" stroke="#01ABE6" stroke-linecap="round" stroke-linejoin="round"/>
                                            <path d="M0.75293 4.94067L3.92477 8.11252L7.09662 4.94067" stroke="#01ABE6" stroke-linecap="round" stroke-linejoin="round"/>
                                            <path d="M3.9248 8.11242V0.5" stroke="#01ABE6" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                    </a>
                                </div>
                            </div>
                        </div>
                        <ais-current-refinements :excluded-attributes="[]">
                            <template v-slot="{ items, createURL }">
                                <div class="eventsSearch__activeFilters">
                                    <div class="eventsSearch__activeTitle" v-if="items.length">Applied Filters</div>
                                    <ais-clear-refinements v-if="items.length" :excluded-attributes="[]">
                                        <template v-slot="{ canRefine, refine, createURL }">
                                        <a
                                            :href="createURL()"
                                            @click.prevent="refine"
                                            v-if="canRefine"
                                            class="eventsSearch__clearFilters"
                                        >
                                            Clear
                                        </a>
                                        <span v-else></span>
                                        </template>
                                    </ais-clear-refinements>
                                    <ul class="eventsSearch__activeFiltersList">
                                        <li v-for="item in items" :key="item.attribute" class="eventsSearch__activeFiltersGroup">
                                        <ul class="eventsSearch__activeFiltersItems">
                                            <li
                                            v-for="refinement in item.refinements"
                                            :key="[
                                                refinement.attribute,
                                                refinement.type,
                                                refinement.value,
                                                refinement.operator
                                            ].join(':')"
                                            class="eventsSearch__activeFilterItem"
                                            >
                                            <a
                                                :href="createURL(refinement)"
                                                @click.prevent="item.refine(refinement)"
                                                v-html="formatRefinement(refinement)"
                                                class="eventsSearch__activeFilterRemove"
                                            ></a>
                                            </li>
                                        </ul>
                                        </li>
                                    </ul>
                                    
                                </div>
                            </template>
                        </ais-current-refinements>
                        <slot :items="items" :show-by-works="showByWorks">
                            <div v-for="item in items">
                                {{ JSON.stringify(item) }}<br/><br/>
                            </div>
                        </slot>
                    </template>
                </ais-hits>


                <!-- Pagination -->
                <nav class="eventsSearch__pagination">
                    <ais-stats>
                        <template v-slot="{ hitsPerPage, nbHits, page }">
                            {{ page * hitsPerPage + 1 }} - {{ (((page + 1) * hitsPerPage)) < nbHits ? (((page + 1) * hitsPerPage)) : nbHits }} of {{ nbHits }} Results
                        </template>
                    </ais-stats>
                    <ais-pagination>
                        <template
                            v-slot="{
                            currentRefinement,
                            nbPages,
                            pages,
                            isFirstPage,
                            isLastPage,
                            refine,
                            createURL
                            }"
                        >
                            <ul class="eventsSearch__paginationComponent" v-if="pages.length > 1">
                                <li v-if="currentRefinement + 1 > 1">
                                    <a
                                    :href="createURL(currentRefinement - 1)"
                                    @click.prevent="refine(currentRefinement - 1)"
                                    >
                                    ‹
                                    </a>
                                </li>
                                <li v-for="page in pages.slice(0, 5)" :key="page">
                                    <a
                                    :href="createURL(page)"
                                    :style="{ fontWeight: page === currentRefinement ? 'bold' : '' }"
                                    @click.prevent="refine(page)"
                                    >
                                    {{ page + 1 }}
                                    </a>
                                </li>
                                <li v-if="pages.length > 5">...</li>
                                <li v-if="pages.length > 5">
                                    <a :href="createURL(nbPages)">
                                        {{ nbPages }}
                                    </a>
                                </li>
                                <li v-if="currentRefinement + 1 < nbPages">
                                    <a
                                    :href="createURL(currentRefinement + 1)"
                                    @click.prevent="refine(currentRefinement + 1)"
                                    :style="{ fontWeight: nbPages === currentRefinement + 1 ? 'bold' : '' }"
                                    >
                                    ›
                                    </a>
                                </li>
                            </ul>
                            <div v-else></div>
                        </template>

                    </ais-pagination>
                </nav>
            </section> 
        </div>
    </ais-instant-search>    
</template>


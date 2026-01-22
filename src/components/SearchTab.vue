<script setup>
import { useTemplateRef, ref, defineEmits } from 'vue'
import _ from 'lodash';
import {
    AisClearRefinements,
    AisCurrentRefinements,
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
import VueDatePicker from '@vuepic/vue-datepicker'
import { useDebounceFn } from "@vueuse/core"

import slugify from '../composables/slugify'
import PAccordion from './PAccordion.vue'
import formatDate from '../composables/formatDate'
import formatSearchTitle from '../composables/formatSearchTitle'
 
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
        default: "works, season, venue, event_types, notes, event_title, ensembles, conductors"
    },
    includeFields: {
        type: String,
        default:  "works, season, venue, event_types, notes, event_title, orchestras, conductors"
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

const sortView = ref('Most Recent')
const showNumHits = ref(false)
const showByWorks = ref(false)
const workFilters = ref(null)
const currentQuery = ref(null)
const filtersClosed = ref(false)
const mobileFiltersClosed = ref(true)

const updateNow = ref(0)

const emit = defineEmits(['push'])

const routing = ref({
    router: historyRouter({
        // Disable scroll restoration to prevent erratic behavior
        writeDelay: 0,
        parseURL({ qsModule, location }) {
            const uiState = qsModule.parse(location.search.slice(1))

            updateStateRefs(uiState)
            
            return uiState
        },
        createURL({ qsModule, location, routeState }) {
            const { origin, pathname, hash } = location;
            const indexState = routeState["instant_search"] || {};
            const queryString = qsModule.stringify(routeState);

            const uiState = qsModule.parse(location.search.slice(1))
            sessionStorage.setItem('previousPageUrl', window.location.href)
            
            updateSearchHistory(uiState)

            // if (!indexState.query) {
            //     return `${origin}${pathname}${hash}`;
            // }

            return `${origin}${pathname}?${queryString}${hash}`;
        },
    }),
    
    stateMapping: simpleStateMapping()
})

const mainRefinementList = ref({})
const refinementSearchBoxes = ref([])

const server = {
    connectionTimeoutSeconds: 20,
    apiKey:  props.searchKey, 
    nodes: [
    {
        host: props.searchHost,
        path: '', 
        port: '443',
        protocol: 'https',
    },
    ],
    cacheSearchResultsForSeconds: 0,
}
const adapter = new TypesenseInstantSearchAdapter({
    server: server,
    additionalSearchParameters: {
        query_by: props.queryByFields,
        sort_by: `${props.sortField}:desc`,
        include_fields: props.includeFields,
        highlight_fields: 'none'
    },
})

const searchClient = adapter.searchClient

const toggleFilters = () => {
    filtersClosed.value = !filtersClosed.value
    const wrapper = document.getElementById(`${props.indexName}_filterRail`)
    const allNestedElements = wrapper.querySelectorAll("*")
    if (wrapper && wrapper.classList.contains('closed')) {
        allNestedElements.forEach((el) => {
            el.setAttribute("tabindex", -1)
        })
    } else {
        allNestedElements.forEach((el) => {
            el.removeAttribute("tabindex")
        })
    }
    
}

const toggleFiltersMobile = () => {
    mobileFiltersClosed.value = !mobileFiltersClosed.value
    const wrapper = document.getElementById(`${props.indexName}_filterRail`)
    const leftPane = document.getElementById(`${props.indexName}_eventsSearch__results`)
    const containers = document.querySelectorAll('.container')
    const otherHiddenEls = document.querySelectorAll('.mobileHide')
    wrapper.classList.remove('closed')
    wrapper.classList.toggle('openMobile')
    leftPane.classList.toggle('openMobile')
    containers.forEach((el) => {
        if (el.style.display != "none") {
            el.style.display = "none"
        } else {
            el.style.display = "grid"
        }
        
    })
    otherHiddenEls.forEach((el) => {
        if (el.style.display != "none") {
            el.style.display = "none"
        } else {
            el.style.display = "grid"
        }
        
    })
    const detailsEls = document.querySelectorAll('details')
    detailsEls.forEach((el) => {
        const summary = el.querySelector('summary:first-of-type')
        const summaryHeight = summary?.clientHeight
        el.classList.add('-closing')
        el.style.setProperty('--accordion-height-closed', `${summaryHeight}px`)

        setTimeout(() => {
            el.open = false
            el.classList.remove('-closing')
            el.style.setProperty('--accordion-height-closed', 'auto')
        }, 0)
    })
}

const updateStateRefs = (uiState) => {
    if (uiState && uiState[props.indexName]) {
        currentQuery.value = uiState[props.indexName].query
        if (currentQuery.value) {
            if (sortView.value != 'Most Relevant') {
                sortView.value = 'Most Relevant'
            }
        } else {
            if (sortView.value != 'Most Recent') {
                sortView.value = 'Most Recent'
            }
        }
        setView()
        showNumHits.value = currentQuery.value || uiState[props.indexName].refinementList || uiState[props.indexName].range || uiState[props.indexName].menu
        workFilters.value =  uiState[props.indexName].refinementList && Object.keys(uiState[props.indexName].refinementList).length !== 0 ? getWorkFilters(uiState[props.indexName].refinementList) : []
        showByWorks.value = Object.keys(workFilters.value).length !== 0

        // update search history
        
        
        updateTitle(uiState[props.indexName])
        
    }
}

const updateSearchHistory = (uiState) => {
    let searchHistory = sessionStorage.getItem('searchHistory') ? JSON.parse(sessionStorage.getItem('searchHistory')) : []
    // if only pagination, don't add to search history
    if (!uiState[props.indexName]) {
        return
    }
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
        if (_.isEqual(item.uiState[props.indexName], uiState[props.indexName])) {
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
    
    sessionStorage.setItem('searchHistory', JSON.stringify(searchHistory))
}

const getWorkFilters = (refinementList) => {
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

const onStateChange = ({ uiState, setUiState }) => {
    updateStateRefs(uiState)
    setUiState(uiState)
}

const updateTitle = (state) => {
    document.title = `BSO Performance History${formatSearchTitle(state) ? " | " + formatSearchTitle(state) : "" }`
}

const setView = () => {
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

const formatRefinement = (refinement) => {
    const attributeMap = {
        "works.composers" : "Composer",
        "works.title" : "Work",
        "works.conductors" : "Conductor",
        "ensembles" : "Orchestra",
        "works.ensembles" : "Orchestra",
        "works.artists.name" : "Artist",
        "query" : "Keyword",
        'works.artists.role': 'Instrument/Role',
        'works.additional_creators.name': 'Additional Creator',
        'works.additional_creators.role': 'Creator Role',
        'season': 'Season',
        'event_title': 'Event Title',
        'event_types': 'Series',
        'venue': 'Venue',
        'works.commission': 'Commission',
        'works.premiere': 'Premiere',
        'location.city': 'City',
        'location.country': 'Country',
        'location.state': 'State',
        'artist_name': 'Artist',
        'artist_role': 'Instrument/Role',
        'title': 'Work Title',
        'composers': 'Composer',
        'composer': 'Composer',
        'media': 'Media',
        'creators.name': 'Additional Creator',
        'creators.role': 'Creator Role'
    }
    if (refinement.attribute == 'performance_date' || refinement.attribute == 'last_performance_date') {
        return 'Date: ' + refinement.label[0] + ' ' + formatDate(refinement.value) + ' ×'
    }
    if (attributeMap[refinement.attribute]) {
        return attributeMap[refinement.attribute] + ': ' + refinement.value + ' <span="activeFilters__removeIcon">×</span>'
    } else {
        return refinement.attribute + ': ' + refinement.value + ' ×'
    }
    
}

    const intersect = (filters, work) => {
    let intersectKeys = Object.keys(filters).filter(k => Object.hasOwn(work, k))
    let intersectArray = []
    intersectKeys.forEach((key) => {
        if (typeof filters[key] == 'object' && typeof work[key] == 'object') {
            if (Array.isArray(work[key]) && Array.isArray(filters[key])) {
                work[key].forEach((w) => {
                    filters[key].forEach((f) => {
                        if (w == f) {
                            intersectArray.push(w)
                        }
                    })
                })
            } else if (Array.isArray(work[key])) {
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

const filterItems = (items) => {
    if (!items.length) {
        emitNoResults()
    }
    if (showByWorks.value && props.indexName == "dev_henry_perfs") {
        
        let returnItems = items
        let itemIndex = 0
        returnItems.forEach((item) => {
            let shownWorks = []
            item?.works?.forEach((work) => {
                let workAdded = false
                if (intersect(workFilters.value, work)?.length) {
                    shownWorks.push(work)
                    workAdded = true
                }
                if (!workAdded && currentQuery.value && JSON.stringify(work).includes(currentQuery.value)) {
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

const refineAndScroll = (refine, params, scrollId) => {
    refine(params)
    document.getElementById(scrollId).scrollIntoView()
}

const toMinValue = (value, range) => {
    return typeof value.min === "number" && value.min != 0 ? value.min * 1000 : range.min * 1000
}

const toMaxValue = (value, range) => {
    return typeof value.max === "number" && value.max != 0 ? value.max * 1000 : range.max * 1000
}

const formatMinValue = (minValue, minRange) => {
    return typeof minValue === "number" && minValue !== null && minValue !== minRange ? minValue : minRange
}

const formatMaxValue = (maxValue, maxRange) => {
    return typeof maxValue === "number" &&  maxValue !== null && maxValue !== maxRange ? maxValue : maxRange
}


const getHeadingStyle = (attribute) => {       
    if (mainRefinementList.value && typeof(mainRefinementList.value[attribute]) !== 'undefined' && mainRefinementList.value[attribute]) {
        try {
            if (mainRefinementList.value[attribute] && typeof(mainRefinementList.value[attribute].items) !== 'undefined' && mainRefinementList.value[attribute].items.length) {
                return ''
            } else {
                return '-gray'
            }
        } catch (e) {
            return ''
        }
    }
    return  ''
}

const clearRefinementSearches = () => {
    if (refinementSearchBoxes.value && refinementSearchBoxes.value.length) {
        refinementSearchBoxes.value.forEach((el) => {
            if (el) {
                el.value = ""
            }
        })
    }
}

const emitQuery = useDebounceFn(() => {
    if (currentQuery.value) {
        emit('push', {event: 'search_form', data: currentQuery.value})
    }
}, 1000)

const emitNoResults = useDebounceFn(() => {
    if (currentQuery.value) {
        emit('push', {event: 'no_results', data: currentQuery.value})
    }
}, 1000)

const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href)
    const htmlHolder = document.querySelector('#copy_link').innerHTML
    document.querySelector('#copy_link').innerHTML = "URL Copied!"
    setTimeout(() => {
        document.querySelector('#copy_link').innerHTML = htmlHolder
    }, 1000)
}

</script>

<template>
    <ais-instant-search
        :search-client="searchClient"
        :index-name="props.indexName"
        :routing="routing"
        :on-state-change="onStateChange"
    >
            <div :class="`tabs__content ${ filtersClosed ? 'closed' : 'open'}`" :id="`${props.indexName}_tabs__content`">
            <!-- Header and Search Section -->
            <div class="eventsSearch__topSection">
                <!-- Search Filters Section -->
                <section class="filters">
                    <div class="filters__row">
                        <!-- Search Box -->
                        <div class="filters__filterGroup filters__search">
                            <ais-search-box class="searchBox" >
                                <template v-slot="{ currentRefinement, isSearchStalled, refine }">
                                    <label for="searchbox" class="label__hidden">{{ props.searchPlaceholder }}</label>
                                    <button type="submit" title="Submit the search query" class="ais-SearchBox-submit"><svg aria-hidden="true" width="10" height="10" viewBox="0 0 40 40" class="ais-SearchBox-submitIcon"><path d="M26.804 29.01c-2.832 2.34-6.465 3.746-10.426 3.746C7.333 32.756 0 25.424 0 16.378 0 7.333 7.333 0 16.378 0c9.046 0 16.378 7.333 16.378 16.378 0 3.96-1.406 7.594-3.746 10.426l10.534 10.534c.607.607.61 1.59-.004 2.202-.61.61-1.597.61-2.202.004L26.804 29.01zm-10.426.627c7.323 0 13.26-5.936 13.26-13.26 0-7.32-5.937-13.257-13.26-13.257C9.056 3.12 3.12 9.056 3.12 16.378c0 7.323 5.936 13.26 13.258 13.26z"></path></svg>
                                    </button>
                                    <input
                                        class="ais-SearchBox-input input"
                                        id="searchbox"
                                        type="search"
                                        :value="currentRefinement"
                                        @input="refine($event.currentTarget.value);emitQuery()"
                                        :placeholder="props.searchPlaceholder"
                                        >
                                    
                                    <span :hidden="!isSearchStalled">Loading...</span>
                                </template>
                            </ais-search-box>
                        </div>
                        <div class="filters__filterGroup dateRange">
                            <ais-range-input :attribute="props.sortField">
                                <template v-slot="{ currentRefinement, range, refine }" >
                                    <label for="start" class="label__hidden">Start Date</label>
                                    <vue-date-picker
                                        :aria-labels="{ input: 'Start Date'}"
                                        :model-value="toMinValue(currentRefinement, range)"
                                        @update:model-value="(modelValue) => {
                                            refine({
                                                min: formatMinValue(modelValue/1000, range.min),
                                                max: formatMaxValue(currentRefinement.max, range.max),
                                            });
                                            
                                        }"
                                        :auto-apply="true"
                                        :year-range="[1850,2050]"
                                        :teleport="true"
                                        :clearable="false"
                                        :multi-calendars="false"
                                        :enable-time-picker="false"
                                        :enter-submit="true"
                                        :tab-submit="true"
                                        :text-input="false"
                                        placeholder="Start"
                                        id="start"
                                    />
                                    <label for="end" class="label__hidden">End Date</label>
                                    <vue-date-picker
                                        :aria-labels="{ input: 'End Date'}"
                                        :model-value="toMaxValue(currentRefinement, range)"
                                        @update:model-value="(modelValue) => { refine({
                                            min: formatMinValue(currentRefinement.min, range.min),
                                            max: formatMaxValue(modelValue/1000, range.max),
                                        })}"
                                        :auto-apply="true"
                                        :year-range="[1850,2050]"
                                        :teleport="true"
                                        :clearable="false"
                                        :text-input="false"
                                        :enter-submit="true"
                                        :tab-submit="true"
                                        :multi-calendars="false"
                                        :enable-time-picker="false"
                                        placeholder="End"
                                        id="end"
                                    />
                                </template>
                            </ais-range-input>
                        </div>
                        <div class="filters__button">
                            <button class="button info">
                                <svg width="32" height="32" viewBox="-9 -9 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="mobileSearch">
                                    <path d="M6.00037 11.2504C8.90007 11.2504 11.2507 8.89978 11.2507 6.00018C11.2507 3.10059 8.90007 0.75 6.00037 0.75C3.10067 0.75 0.75 3.10059 0.75 6.00018C0.75 8.89978 3.10067 11.2504 6.00037 11.2504Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                                    <path d="M9.7124 9.71265L12.7502 12.7503" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                                </svg>
                                <span class="filters__searchButton">Search</span>
                            </button>
                        </div>
                    </div>
                </section>
            </div>

                <!-- View Toggle and Active Filters -->
            <section :class="`filters__filterRail ${filtersClosed ? 'closed' : ''} ${mobileFiltersClosed ? '' : 'openMobile'}`" :id="`${props.indexName}_filterRail`">
                
                <div class="filters__wrapper">
                    <div class="filters__header">
                        <div class="filters__toggle">
                            <svg width="24" height="24" viewBox="0 0 24 24" class="filters__icon">
                                <rect width="24" height="24" rx="4" />
                                <path d="M6 7.25H18.8864" stroke-linecap="round"/>
                                <path d="M6 12.5681H18.8864" stroke-linecap="round"/>
                                <path d="M6 17.75H18.8864"  stroke-linecap="round"/>
                                <circle cx="8.72709" cy="17.9544" r="1.54545" />
                                <circle cx="14.8633" cy="12.5" r="1.54545" />
                                <circle cx="10.7725" cy="7.04545" r="1.54545" />
                            </svg> 
                            <span class="label">Filters</span>
                        </div>
                        <div>
                            <button class="hideButton" :id="`${props.resultsTitle.toLowerCase()}_filterToggle`" @click="toggleFilters()">Hide</button>
                            <a class="hideMobile"  @click="toggleFiltersMobile()">
                                <svg width="18" height="17" viewBox="0 0 18 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <line x1="1.06058" y1="0.353539" x2="17.0606" y2="16.3535" stroke="#686F73"/>
                                    <line x1="0.353478" y1="16.3535" x2="16.3535" y2="0.353539" stroke="#686F73"/>
                                </svg>
                            </a>
                        </div>
                    </div>
                    <p-accordion class="accordion" v-for="refinement in mainRefinements" :start-open="refinement.startOpen">
                        <summary class="accordion__summary">
                            <h6 :class="`accordion__heading ${ getHeadingStyle(refinement.attribute) }`">{{ refinement.title }}</h6>
                            <div class="accordion__iconWrapper">
                                <svg class="accordion__icon icon icon--chevron-right" aria-hidden="true" role="presentation"  viewBox="0 0 18 18" fill="none">
                                    <path d="M7 17L15 9L7 1" stroke="var(--icon-color, currentColor)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </div>
                        </summary>
                        <ais-refinement-list :attribute="refinement.attribute" operator="and" :ref="(el) => {mainRefinementList[refinement.attribute] = el}">
                            <template v-slot="{items, refine, searchForItems, isFromSearch}">
                                
                                <div class="accordion__content" v-if="items.length || isFromSearch">
                                    <div class="ais-SearchBox searchBox -filter">
                                        <label class="label__hidden" :for="refinement.attribute">{{ refinement.placeholder }}</label>
                                        <form class="searchBox__form" @submit="$event.preventDefault()" @reset="searchForItems('')">
                                            <input type="text" :id="refinement.attribute" :ref="(el) => refinementSearchBoxes.push(el)" @input="searchForItems($event.currentTarget.value)" :placeholder="refinement.placeholder" class="ais-SearchBox-input -filter"  v-if="!refinement.hideSearch">
                                            <button v-if="isFromSearch"
                                                class="ais-SearchBox-reset"
                                                type="reset"
                                                title="Clear the search query."
                                                hidden
                                                >
                                                <svg width="9" height="9" viewBox="0 0 9 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M8.5 0.5L0.5 8.5" stroke="#686F73" stroke-linecap="round" stroke-linejoin="round"/>
                                                    <path d="M0.5 0.5L8.5 8.5" stroke="#686F73" stroke-linecap="round" stroke-linejoin="round"/>
                                                </svg>
                                            </button>
                                        </form>
                                    </div>
                                    <div class="checkBoxes">
                                        <span class="checkBoxes__alert" v-if="!items.length"><span class="checkBoxes__alertIcon">!</span>No matches found</span>
                                        <label v-for="item in items" class="checkBoxes__boxLabel" :for="slugify(refinement.title + ' ' + item.value)">
                                            <input :class="`checkbox ${item.isRefined ? '-boxChecked' : ''}`" 
                                                type="checkbox" 
                                                :id="slugify(refinement.title + ' ' + item.value)"  
                                                :value="item.value" 
                                                :checked="item.isRefined" 
                                                @click="refine(item.value);$emit('push', {event: item.isRefined ? 'unfilter' : 'search_filter', filter_category: refinement.title, filter_value : item.value})" />
                                            <label :for="slugify(refinement.title + ' ' + item.value)">{{ item.value }}</label><span class="eventsSearch__refinementCount">{{ item.count }}</span>
                                        </label>
                                    </div>
                                </div>
                            </template>
                        </ais-refinement-list> 
                    </p-accordion>
                    <!-- <template v-else><div></div></template> -->
                       
                    <p-accordion class="ais-RefinementList -sub" v-if="props.addlRefinements" name="more_filters" :start-open="false" open-text="Fewer Filters" closed-text="More Filters">
                        <summary class="accordion__summary">
                            <h6 class="accordion__heading -thin">More Filters</h6>
                        </summary>
                        <div class="accordion__content">
                            <template v-for="refinement in props.addlRefinements">
                                <ais-refinement-list v-if="refinement.type == 'list'" :attribute="refinement.attribute" operator="and">
                                    <template v-slot="{items, refine, searchForItems, isFromSearch}">
                                        <p-accordion :name="refinement.title" class="accordion" :start-open="false">
                                            <summary class="accordion__summary">
                                                <h6 :class="`accordion__heading ${ !(items.length || isFromSearch) ? '-gray' : ''}`">{{ refinement.title }}</h6>
                                                <div class="accordion__iconWrapper" v-if="items.length">
                                                    <svg class="accordion__icon icon icon--chevron-right" aria-hidden="true" role="presentation"  viewBox="0 0 18 18" fill="none">
                                                        <path d="M7 17L15 9L7 1" stroke="var(--icon-color, currentColor)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                                    </svg>
                                                </div>
                                            </summary>
                                            <div class="accordion__content" v-if="items.length || isFromSearch">
                                                <div class="ais-SearchBox searchBox -filter" v-if="!refinement.hideSearch">
                                                    <label class="label__hidden" :for="refinement.attribute">{{ refinement.placeholder }}</label>
                                                    <form class="searchBox__form" @submit="$event.preventDefault()" @reset="searchForItems('')">
                                                        <input type="text" :id="refinement.attribute" @input="searchForItems($event.currentTarget.value)" :placeholder="refinement.placeholder" class="ais-SearchBox-input -filter"  v-if="!refinement.hideSearch">
                                                        <button v-if="isFromSearch"
                                                            class="ais-SearchBox-reset"
                                                            type="reset"
                                                            title="Clear the search query."
                                                            hidden
                                                            >
                                                            <svg width="9" height="9" viewBox="0 0 9 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M8.5 0.5L0.5 8.5" stroke="#686F73" stroke-linecap="round" stroke-linejoin="round"/>
                                                                <path d="M0.5 0.5L8.5 8.5" stroke="#686F73" stroke-linecap="round" stroke-linejoin="round"/>
                                                            </svg>
                                                        </button>
                                                    </form>
                                                </div>
                                                <div class="checkBoxes">
                                                    <span class="checkBoxes__alert" v-if="!items.length"><span class="checkBoxes__alertIcon">!</span>No matches found</span>
                                                    <label v-for="item in items" class="checkBoxes__boxLabel" :for="slugify(refinement.title + ' ' + item.value)">
                                                        <input :class="`checkbox ${item.isRefined ? '-boxChecked' : ''}`" type="checkbox" :id="slugify(refinement.title + ' ' + item.value)"  :value="item.value" :checked="item.isRefined" @click="refine(item.value);$emit('push', {event: item.isRefined ? 'unfilter' : 'filter', type: refinement.title, data: item.value})">
                                                        <label :for="slugify(refinement.title + ' ' + item.value)">{{ item.value }}</label><span class="eventsSearch__refinementCount">{{ item.count }}</span>
                                                    </label>
                                                </div>
                                            </div> 
                                        </p-accordion>
                                    </template>
                                </ais-refinement-list>
                                <p-accordion v-if="refinement.type == 'location'" name="location" class="accordion location" :start-open="false">
                                    <summary class="accordion__summary">
                                        <h6 class="accordion__heading">Location</h6>
                                        <div class="accordion__iconWrapper">
                                            <svg class="accordion__icon icon icon--chevron-right" aria-hidden="true" role="presentation"  viewBox="0 0 18 18" fill="none">
                                                <path d="M7 17L15 9L7 1" stroke="var(--icon-color, currentColor)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                            </svg>
                                        </div>
                                    </summary>
                                    <div class="accordion__content">
                                        <ais-menu-select v-if="refinement.type == 'location'" :attribute="'location.country'" operator="and" :limit="100" >
                                            <template v-slot="{ items, refine }">
                                                <select @change="refine($event.currentTarget.value);$emit('push', {event: 'filter', type: 'location.country', data: $event.currentTarget.value})">
                                                    <option value="">Select Country</option>
                                                    <option v-for="item in items" :selected="item.isRefined" :key="item.value" :value="item.value">{{ item.label }}</option>
                                                </select>
                                            </template>
                                        </ais-menu-select>
                                        <ais-menu-select v-if="refinement.type == 'location'" :attribute="'location.state'" operator="and" :limit="100">
                                           <template v-slot="{ items, refine }">
                                                <select @change="refine($event.currentTarget.value);$emit('push', {event: 'filter', type: 'location.state', data: $event.currentTarget.value})">
                                                    <option value="">Select State</option>
                                                    <option v-for="item in items" :selected="item.isRefined" :key="item.value" :value="item.value">{{ item.label }}</option>
                                                </select>
                                            </template>
                                        </ais-menu-select>
                                        <ais-menu-select placeholder="Select City" v-if="refinement.type == 'location'" :attribute="'location.city'" operator="and"  :limit="100">
                                            <template v-slot="{ items, refine }">
                                                <select @change="refine($event.currentTarget.value);$emit('push', {event: 'filter', type: 'location.city', data: $event.currentTarget.value})">
                                                    <option value="">Select City</option>
                                                    <option v-for="item in items" :selected="item.isRefined" :key="item.value" :value="item.value">{{ item.label }}</option>
                                                </select>
                                            </template>
                                        </ais-menu-select>
                                    </div>
                                </p-accordion>                                
                               
                            </template>                            
                        </div>
                    </p-accordion>
                </div>
                <div class="clearRefinements">
                    <ais-clear-refinements :excluded-attributes="[]">
                        <template v-slot="{ refine, createURL }">
                            <a
                                :href="createURL()"
                                @click.prevent="refine();clearRefinementSearches()"
                            >
                                <button @click="toggleFiltersMobile()" class="filterClear">Clear</button>
                                
                            </a>
                            <button @click="toggleFiltersMobile()" class="filterApply">Apply</button>
                        </template>
                    </ais-clear-refinements>
                    
                </div>
            </section>

            <!-- Search Results Section -->
            <section :class="`eventsSearch__results ${ filtersClosed ? 'closed' : ''}  ${mobileFiltersClosed ? '' : 'openMobile'}`" :id="`${props.indexName}_eventsSearch__results`">
                
                <ais-hits :key="updateNow" class="eventsSearch__hits" :transform-items="filterItems">
                    <template v-slot="{ items }">
                        <div class="eventsSearch__resultsHeader -mobile">
                            <div class="filters__toggle">
                                <button class="filterButton" @click="toggleFiltersMobile()">
                                    <svg width="24" height="24" viewBox="0 0 24 24" >
                                        <rect width="24" height="24" rx="4"/>
                                        <path d="M6 7.25H18.8864" stroke="white" stroke-linecap="round"/>
                                        <path d="M6 12.5681H18.8864" stroke="white" stroke-linecap="round"/>
                                        <path d="M6 17.75H18.8864" stroke="white" stroke-linecap="round"/>
                                        <circle cx="8.72709" cy="17.9544" r="1.54545" fill="#01ABE6" stroke="white"/>
                                        <circle cx="14.8633" cy="12.5" r="1.54545" fill="#01ABE6" stroke="white"/>
                                        <circle cx="10.7725" cy="7.04545" r="1.54545" fill="#01ABE6" stroke="white"/>
                                    </svg> 
                                    Filters
                                </button>
                                <div class="eventsSearch__resultsSort">Sort by: 
                                    <select name="Sort Order" v-model="sortView" @change="setView">
                                    <option value="Most Recent">Most Recent</option>
                                    <option value="Most Relevant">Most Relevant</option>
                                    <option value="Oldest First">Oldest First!</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div class="eventsSearch__resultsHeader">
                            <div class="eventsSearch__resultsTitle -title" id="resultsTitle">
                                <svg width="24" height="24" viewBox="0 0 24 24" :id="`${props.indexName}_filterToggleOn`" :class="`filters__toggleOn ${filtersClosed ? 'closed' : ''}`" @click="toggleFilters()">
                                    <rect width="24" height="24" rx="4" />
                                    <path d="M6 7.25H18.8864" stroke-linecap="round"/>
                                    <path d="M6 12.5681H18.8864" stroke-linecap="round"/>
                                    <path d="M6 17.75H18.8864"  stroke-linecap="round"/>
                                    <circle cx="8.72709" cy="17.9544" r="1.54545" />
                                    <circle cx="14.8633" cy="12.5" r="1.54545" />
                                    <circle cx="10.7725" cy="7.04545" r="1.54545" />
                                </svg> 
                                <h2 v-if="showNumHits">
                                    <ais-stats>
                                        <template v-slot="{ nbHits }">
                                            {{ nbHits }} {{ nbHits > 1 ? 'Results' : 'Result' }}
                                        </template>
                                    </ais-stats>
                                </h2>
                                <h2 v-else>{{ props.resultsTitle }}</h2>

                            </div>
                            <div class="resultActions">
                                <div class="resultActions__sort">
                                    <label class="resultActions__sortText">Sort by: </label>
                                    <select name="sort_order" v-model="sortView" @change="setView">
                                    <option value="Most Recent">Most Recent</option>
                                    <option value="Most Relevant">Most Relevant</option>
                                    <option value="Oldest First">Oldest First</option>
                                    </select>
                                </div>
                                <div v-if="showNumHits" class="resultActions__buttons">
                                    <div class="toolTip" id="copy_tooltip">
                                        <a @click="copyUrl()" id="shareActions__icon">
                                            <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"  class="resultActions__icon" outline="black">
                                                <!-- <circle cx="12" cy="12" stroke="none" r="12"/> -->
                                                <path d="M11.3334 12.5068C11.5012 12.7435 11.7153 12.9393 11.9611 13.081C12.2069 13.2227 12.4788 13.307 12.7582 13.3281C13.0376 13.3492 13.3181 13.3066 13.5806 13.2034C13.8431 13.1001 14.0814 12.9384 14.2795 12.7294L15.4516 11.4928C15.8075 11.1041 16.0044 10.5835 16 10.0431C15.9955 9.50271 15.7901 8.98578 15.4278 8.60365C15.0656 8.22153 14.5756 8.00477 14.0634 8.00008C13.5511 7.99538 13.0577 8.20312 12.6892 8.57855L12.0171 9.28341" stroke-linecap="round" stroke-linejoin="round"/>
                                                <path d="M13.3333 11.4932C13.1416 11.2565 12.8969 11.0607 12.6159 10.919C12.335 10.7773 12.0243 10.6931 11.7049 10.672C11.3856 10.6508 11.0651 10.6934 10.7651 10.7967C10.4651 10.9 10.1927 11.0616 9.96639 11.2706L8.62675 12.5072C8.22004 12.8959 7.995 13.4165 8.00008 13.9569C8.00517 14.4973 8.23998 15.0142 8.65395 15.3964C9.06791 15.7785 9.62791 15.9952 10.2133 15.9999C10.7987 16.0046 11.3627 15.7969 11.7838 15.4215L12.5474 14.7166" stroke-linecap="round" stroke-linejoin="round"/>
                                            </svg>
                                        </a>
                                        <span class="toolTip__text" id="copy_link">Copy Link</span>
                                    </div>
                                    <div class="toolTip">
                                        <a :href="`/actions/csvexport/csv-export${ routing.router.getLocation().search }`" id="downloadActions__icon">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="resultActions__icon">
                                                <!-- <circle cx="12" cy="12" r="12" stroke="none "/> -->
                                                <path d="M15.9785 17.41L9.00049 17.41" stroke-linecap="round" stroke-linejoin="round"/>
                                                <path d="M9.25317 11.4406L12.425 14.6124L15.5969 11.4406" stroke-linecap="round" stroke-linejoin="round"/>
                                                <path d="M12.425 14.6124V7" stroke-linecap="round" stroke-linejoin="round"/>
                                            </svg>

                                        </a>
                                        <span class="toolTip__text">Export CSV</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <ais-current-refinements :excluded-attributes="[]">
                            <template v-slot="{ items, createURL }">
                                <div class="activeFilters">
                                    <div class="activeFilters__title" v-if="items.length">Applied Filters</div>
                                    <ais-clear-refinements v-if="items.length" :excluded-attributes="[]">
                                        <template v-slot="{ canRefine, refine, createURL }">
                                        <a
                                            :href="createURL()"
                                            @click.prevent="refine();clearRefinementSearches()"
                                            v-if="canRefine"
                                            class="activeFilters__clearFilters"
                                        >
                                            Clear
                                        </a>
                                        <span v-else></span>
                                        </template>
                                    </ais-clear-refinements>
                                    <ul class="activeFilters__filtersList">
                                        <template v-for="item in items" :key="item.attribute">
                                            <li
                                            v-for="refinement in item.refinements"
                                            :key="[
                                                refinement.attribute,
                                                refinement.type,
                                                refinement.value,
                                                refinement.operator
                                            ].join(':')"
                                            class="activeFilters__item"
                                            >
                                            <a
                                                :href="createURL(refinement)"
                                                @click.prevent="item.refine(refinement)"
                                                v-html="formatRefinement(refinement)"
                                                class="activeFilters__remove"
                                            ></a>
                                            </li>
                                        </template>
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
                <nav class="resultsPagination">
                    <ais-stats>
                        <template v-slot="{ hitsPerPage, nbHits, page }">
                            {{ nbHits == 0 ? nbHits : page * hitsPerPage + 1 }} - {{ (((page + 1) * hitsPerPage)) < nbHits ? (((page + 1) * hitsPerPage)) : nbHits }} of {{ nbHits }} Results
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
                            <ul class="resultsPagination__paginationComponent" v-if="pages.length > 1">
                                <li v-if="!isFirstPage && nbPages > 5" class="arrow">
                                    <a :href="createURL(0)" @click.prevent="refineAndScroll(refine, 0, 'resultsTitle')">
                                    ‹‹
                                    </a>
                                </li>
                                <li v-if="!isFirstPage && nbPages > 5" class="arrow">
                                    <a
                                    :href="createURL(currentRefinement - 1)"
                                    @click.prevent="refineAndScroll(refine, currentRefinement - 1, 'resultsTitle')"
                                    >
                                    ‹
                                    </a>
                                </li>
                                <template v-if="nbPages - 5 > currentRefinement">
                                    <li v-for="page in pages.slice(0, 5)" :key="page">
                                        <a
                                        :href="createURL(page)"
                                        :class="`${page === currentRefinement ? 'resultsPagination__currentPage' : '' }`"
                                        @click.prevent="refineAndScroll(refine, page, 'resultsTitle')"
                                        >
                                        {{ page + 1 }}
                                        </a>
                                    </li>
                                    <li v-if="pages.length > 5">...</li>
                                    <li v-if="pages.length > 5">
                                        <a :href="createURL(nbPages - 1)" @click.prevent="refineAndScroll(refine, nbPages - 1, 'resultsTitle')">
                                            {{ nbPages }}
                                        </a>
                                    </li>
                                </template>
                                <template v-else>
                                    <li>
                                        <a :href="createURL(0)" @click.prevent="refineAndScroll(refine, 0, 'resultsTitle')" :style="{ fontWeight: currentRefinement === 0 ? 'bold' : '' }">
                                        1
                                        </a>
                                    </li>
                                    <li v-if="pages.length > 5">...</li>
                                    <li  v-for="page in 5" :key="page" v-if="nbPages > 5">
                                        <a :href="createURL(nbPages - (5 - page) - 1)" @click.prevent="refineAndScroll(refine, nbPages - (5 - page) - 1, 'resultsTitle')" 
                                         :class="`${nbPages - (5 - page) - 1 === currentRefinement ? 'resultsPagination__currentPage' : '' }`">
                                            {{ nbPages - (5 - page) }}
                                        </a>
                                    </li>
                                    <li v-for="page in nbPages - 1" v-if="nbPages <= 5">
                                        <a :href="createURL(page)" @click.prevent="refineAndScroll(refine, page, 'resultsTitle')" :style="{ fontWeight: page === currentRefinement ? 'bold' : '' }">
                                            {{ page + 1 }}
                                        </a>
                                    </li>
                                </template>
                                <li v-if="!isLastPage && nbPages > 5" class="arrow">
                                    <a
                                    :href="createURL(currentRefinement + 1)"
                                    @click.prevent="refineAndScroll(refine, currentRefinement + 1, 'resultsTitle')"
                                    >
                                    ›
                                    </a>
                                </li>
                                <li v-if="!isLastPage && nbPages > 5" class="arrow">
                                    <a :href="createURL(nbPages)" @click.prevent="refineAndScroll(refine, currentRefinement + 1, 'resultsTitle')">
                                    ››
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


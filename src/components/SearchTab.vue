<script setup>
    import { ref } from 'vue'
    import {
        AisAutocomplete,
        AisClearRefinements,
        AisCurrentRefinements,
        AisHighlight,
        AisHits,
        AisInstantSearch,
        AisPagination,
        AisRangeInput,
        AisRefinementList,
        AisSearchBox
    } from 'vue-instantsearch/vue3/es'
    import TypesenseInstantSearchAdapter from 'typesense-instantsearch-adapter'
    import { history as historyRouter } from 'instantsearch.js/es/lib/routers'
    import { simple as simpleStateMapping } from 'instantsearch.js/es/lib/stateMappings'
    import PAccordion from './PAccordion.vue'
    import VueDatePicker from '@vuepic/vue-datepicker'
    import '@vuepic/vue-datepicker/dist/main.css'
    import slugify from '../composables/slugify'

    const props = defineProps({
        indexName: {
            type: String,
            default: "archived_performances"
        },
        mainRefinements: {
            type: Object,
            require: true
        },
        queryByFields: {
            type: String,
            default: "work, season, orchestra, venue, event_types, notes, event_title"
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
    const currentQuery = ref(null)
    const showNumHits = ref(false)

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

    function updateStateRefs(uiState) {
        if (uiState && uiState[props.indexName]) {
            currentQuery.value = uiState[props.indexName].query
            console.log('currentQuery', uiState[props.indexName].query, currentQuery.value ? 'true' : 'false')
            if (currentQuery.value) {
                if (sortView.value != 'Most Relevant') {
                    sortView.value = 'Most Relevant'
                }
            } else {
                if (sortView.value != 'Most Recent') {
                    sortView.value = 'Most Recent'
                }
                
            }
            console.log(' uiState[props.indexName]', uiState[props.indexName])
            if (currentQuery.value || uiState[props.indexName].refinementList || uiState[props.indexName].range) {
                showNumHits.value = true
            } else {
                showNumHits.value = false
            }
        }
    }

    function onStateChange({ uiState, setUiState }) {
        console.log('uiState', uiState)
        updateStateRefs(uiState)
        setUiState(uiState)
    }

    function setView() {
        console.log(sortView.value)
        if (sortView.value == 'Oldest First') {
            console.log('changeing to oldest first')
            adapter.updateConfiguration({...props.adapter.configuration, additionalSearchParameters: {
                query_by: props.queryByFields,
                sort_by: `${props.sortField}:asc`
            }})
            console.log(props.adapter.configuration)
        } else if (sortView.value == 'Most Relevant') {
            props.adapter.updateConfiguration({...props.adapter.configuration, additionalSearchParameters: {
                query_by: props.queryByFields,
                sort_by: `_text_match:desc,${props.sortField}:desc`
            }})
        } else {
            props.adapter.updateConfiguration({...props.adapter.configuration, additionalSearchParameters: {
                query_by: props.queryByFields,
                sort_by: `${props.sortField}:desc`
            }})
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
        return typeof value.min === "number" ? value.min * 1000 : range.min * 1000
    }

    function toMaxValue(value, range) {
        return typeof value.max === "number" ? value.max * 1000 : range.max * 1000
    }

    function formatMinValue(minValue, minRange) {
        console.log('minValue', minValue, minValue * 1000)
      return typeof minValue === "number" && minValue !== null && minValue !== minRange ? minValue : minRange
    }
    
    function formatMaxValue(maxValue, maxRange) {
        console.log('maxValue', maxValue, maxValue * 1000)
      return typeof maxValue === "number" &&  maxValue !== null && maxValue !== maxRange ? maxValue : maxValue
    }

</script>

<template>
    <ais-instant-search
        :search-client="searchClient"
        :index-name="props.indexName"
        :routing="routing"
        :on-state-change="onStateChange"
        :key="sortView"
    >
        <div class="tabs__content">
            <!-- Header and Search Section -->
            <div class="eventsSearch__topSection">
                <!-- Search Filters Section -->
                <section class="eventsSearch__filters">
                    <header class="eventsSearch__header">
                        <h1 class="eventsSearch__title">Find Concerts & Events</h1>
                    </header>
                    <div class="eventsSearch__filtersRow">
                        <!-- Search Box -->
                        <div class="eventsSearch__filterGroup eventsSearch__filterGroup--search">
                            <ais-search-box
                                :placeholder="props.searchPlaceholder"
                                class="eventsSearch__searchBox"
                            />
                        </div>
                        <div class="eventsSearch__filterGroup eventsSearch__filterGroup--date">
                            <ais-range-input :attribute="props.sortField">
                                <template v-slot="{ currentRefinement, range, canRefine, refine, sendEvent }" >
                                    <vue-date-picker
                                        :model-value="toMinValue(currentRefinement, range)"
                                        @update:model-value="(modelValue) => {
                                            console.log('range', range);
                                            console.log('currentRefinement', currentRefinement);
                                            refine({
                                                min: formatMinValue(modelValue/1000, range.min),
                                                max: formatMaxValue(currentRefinement.max, range.max),
                                            })
                                        }"
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
                                        :multi-calendars="false"
                                        :enable-time-picker="false"
                                        placeholder="End"
                                        class="eventsSearch__datePicker"
                                        id="end"
                                    />
                                </template>
                            </ais-range-input>
                        </div>
                    </div>
                </section>
            </div>

                <!-- View Toggle and Active Filters -->
            <section class="eventsSearch__filterRail">
                <div style="display: grid;">
                <ais-refinement-list v-for="refinement in mainRefinements" :attribute="refinement.attribute" operator="and">
                    <template v-slot="{items, refine, searchForItems}">
                        <p-accordion :name="refinement.title" class="accordion">
                            <summary class="accordion__summary">
                                <h6 class="accordion__heading">{{ refinement.title }}</h6>
                                <div class="accordion__iconWrapper">
                                <svg class="accordion__icon icon icon--chevron-right" aria-hidden="true" role="presentation">
                                    <use href="../assets/main-icons-sprite.svg#chevron-right" />
                                </svg>
                                </div>
                            </summary>
                            <div class="accordion__content">
                                <div class="ais-SearchBox eventsSearch__searchBox -filter">
                                    <input @input="searchForItems($event.currentTarget.value)" :placeholder="refinement.placeholder" class="ais-SearchBox-input -filter">
                                </div>
                                <div class="eventsSearch__checkBoxes">
                                <label v-for="item in items" class="eventsSearch__boxLabel" :for="slugify(refinement.title + ' ' + item.value)">
                                    <input class="checkbox" type="checkbox" :id="slugify(refinement.title + ' ' + item.value)"  :value="item.value" :checked="item.isRefined" @click="refine(item.value)">
                                    <span>{{ item.value }}</span><span>{{ item.count }}</span>
                                </label>
                                </div>
                            </div> 
                        </p-accordion>
                    </template>
                </ais-refinement-list>
                </div>
            </section>

            <!-- Search Results Section -->
            <section class="eventsSearch__results">
                
                <ais-hits class="eventsSearch__hits">
                    <template v-slot="{ items }">
                        <div class="eventsSearch__resultsHeader">
                        <h2 v-if="showNumHits">{{ items.length }} Results</h2>
                        <h2 v-else>{{ props.resultsTitle }}</h2>
                        <div class="eventsSearch__resultsSort">Sort By 
                            <select v-model="sortView" @change="setView">
                            <option value="Most Recent">Most Recent</option>
                            <option value="Most Relevant">Most Relevant</option>
                            <option value="Oldest First">Oldest First</option>
                            </select>
                        </div>
                        </div>
                        <ais-current-refinements>
                        <template v-slot="{ items, createURL }">
                            <div class="eventsSearch__activeFilters">
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
                                        v-html="refinement.label + ' ×'"
                                        class="eventsSearch__activeFilterRemove"
                                    ></a>
                                    </li>
                                </ul>
                                </li>
                            </ul>
                            <ais-clear-refinements>
                                <template v-slot="{ canRefine, refine, createURL }">
                                <a
                                    :href="createURL()"
                                    @click.prevent="refine"
                                    v-if="canRefine"
                                    class="eventsSearch__clearFilters"
                                >
                                    Clear all filters
                                </a>
                                <span v-else></span>
                                </template>
                            </ais-clear-refinements>
                            </div>
                        </template>
                        </ais-current-refinements>
                        <slot :items="items">
                            <div v-for="item in items">
                                {{ JSON.stringify(item) }}<br/><br/>
                            </div>
                        </slot>
                    </template>
                </ais-hits>


                <!-- Pagination -->
                <nav class="eventsSearch__pagination">
                <ais-pagination
                    :show-first="true"
                    :show-previous="true"
                    :show-next="true"
                    :show-last="true"
                    class="eventsSearch__paginationComponent"
                />
                </nav>
            </section> 
        </div>
    </ais-instant-search>    
</template>


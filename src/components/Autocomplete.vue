<script lang="jsx">
    // recommended auto complete setup per https://www.algolia.com/doc/ui-libraries/autocomplete/integrations/with-vue-instantsearch

    import { h as createElement, Fragment, render } from "vue"
    
    import { createWidgetMixin } from "vue-instantsearch/vue3/es"
    import { connectSearchBox } from "instantsearch.js/es/connectors"
    import { autocomplete } from "@algolia/autocomplete-js"
    import Typesense from 'typesense'

    import "@algolia/autocomplete-theme-classic"

    import { INSTANT_SEARCH_INDEX_NAME } from "./constants"

    export default  {
        mixins: [createWidgetMixin({ connector: connectSearchBox })],
        mounted() {
            if (this.autocompleteInstance) {
                this.autocompleteInstance.destroy()
            }
            const { instantSearchInstance } = this
            function setInstantSearchUiState({ query }) {
                instantSearchInstance.setUiState((uiState) => ({
                    ...uiState,
                    [INSTANT_SEARCH_INDEX_NAME]: {
                        ...uiState[INSTANT_SEARCH_INDEX_NAME],
                        page: 1,
                        query,
                    }
                }))
            }

            const initialState = instantSearchInstance.mainIndex.getHelper()?.state || {}

            let client = new Typesense.Client({
                'nodes': [{
                'host': 'go8f04wi19tuvlyrp-1.a1.typesense.net',
                'port': '443',      
                'protocol': 'https'   
                }],
                'apiKey': 'EBKGVrW6FHYnuSvdav8q9ABBjeuThaKU',
                'connectionTimeoutSeconds': 2
            })

            this.autocompleteInstance = autocomplete( {
                container: this.$refs.autocompleteContainer,
                placeholder: "Search for performances",
                detachedMediaQuery: "none",
                async getSources({ query }) {
                    const results = await client.collections('archived_performances').documents().search({
                        q: query,
                        query_by: 'conductor',
                        highlight_full_fields: 'conductor'
                    })

                    return [
                        {
                            sourceId: 'predictions',
                            getItems() {
                                return results.hits
                            },
                            getItemInputValue({ item }) {
                                return item.document.name
                            },
                            templates: {
                                header() {
                                    return 'Is this a thing?'
                                },
                                item({ item, createElement, Fragment }) {

                                    let html_fragment = ""
                                    item?.highlights?.forEach((highlight) => {
                                        console.log('highlight.field', highlight.field)
                                        if (highlight.field === 'conductor') {
                                            console.log('highlight.values', highlight.values[0])
                                            html_fragment = `${highlight.values[0]}`
                                        }
                                    })
                                    return (
                                            <div class="aa-ItemWrapper">
                                                <div class="aa-ItemContent">
                                                    <div class="aa-ItemContentBody">
                                                        <div class="aa-ItemContentTitle">
                                                            { html_fragment}
                                                        </div>
                                                    </div>
                                                    <div class="aa-ItemActions">
                                                        <button
                                                            class="aa-ItemActionButton aa-DesktopOnly aa-ActiveOnly"
                                                            type="button"
                                                            title="Select">
                                                            <svg
                                                                viewBox="0 0 24 24"
                                                                width="20"
                                                                height="20"
                                                                fill="currentColor">
                                                                <path
                                                                    d="M18.984 6.984h2.016v6h-15.188l3.609 3.609-1.406 1.406-6-6 6-6 1.406 1.406-3.609 3.609h13.172v-4.031z"
                                                                />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                    )
                                    
                                },
                                noResults() {
                                    return 'No results found'
                                }
                            }
                        }
                    ]
                },
                renderer: { createElement, Fragment, render }
                // initialState: { query: initialState.query || "" },
                // onSubmit({ state }) {
                //     setInstantSearchUiState({ query: state. query })
                // },
                // onReset() {
                //     setInstantSearchUiState({ query: "" })
                // },
                // onStateChange({ prevState, state }) {
                //     if (prevState.query !== state.query ) {
                //         setInstantSearchUiState({ query: state.query })
                //     }
                // },
                // renderer: { createElement, Fragment, render },
            })
        },
        beforeUnmount() {
            this.autocompleteInstance?.destroy()
        }
    }

</script>

<template>
    <h2>TEMPLATE HERE</h2>
  <div ref="autocompleteContainer"></div>
</template>
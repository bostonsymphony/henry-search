<script>
    // recommended auto complete setup per https://www.algolia.com/doc/ui-libraries/autocomplete/integrations/with-vue-instantsearch
    
    import { createWidgetMixin } from "vue-instantsearch/vue3/es"
    import { connectSearchBox } from "instantsearch.js/es/connectors"

    export default  {
        mixins: [createWidgetMixin({ connector: connectSearchBox })]
    }

</script>

<template>
  <div ref="autocompleteContainer"></div>
</template>
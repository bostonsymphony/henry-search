import { createApp } from 'vue'
// import './style.css'
// import App from './App.vue'

// createApp(App).mount('#app')

import Search from './components/Search.vue'
import SearchDetail from './components/SearchDetail.vue'
import SearchHistory from './components/SearchHistory.vue'

export default {

    install: (app) => {

        app.component('henry-search', Search)

    },

}

export { Search, SearchDetail, SearchHistory }

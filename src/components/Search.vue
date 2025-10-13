<script setup>

  import { ref, onMounted, onUnmounted, computed } from 'vue'
  import {
    AisClearRefinements,
    AisConfigure,
    AisCurrentRefinements,
    AisHighlight,
    AisHits,
    AisInstantSearch,
    AisPagination,
    AisRangeInput,
    AisRefinementList,
    AisSearchBox,
    AisStats
  } from 'vue-instantsearch/vue3/es'
  import TypesenseInstantSearchAdapter from 'typesense-instantsearch-adapter'
  import VueDatePicker from '@vuepic/vue-datepicker';
  import '@vuepic/vue-datepicker/dist/main.css'
  import VueSelect from 'vue-select'
  import { history as historyRouter } from 'instantsearch.js/es/lib/routers'
  import { simple as simpleStateMapping } from 'instantsearch.js/es/lib/stateMappings'
  import Typesense from 'typesense'

  import PAccordion from './PAccordion.vue'

  const props = defineProps({
    indexName: {
      type: String,
      default: "archived_performances"
    }
  })
  
  const mainRefinements = [
    {attribute: 'work.composer', title: 'Composer', placeholder: 'Search Composers'},
    {attribute: 'work.title', title: 'Work', placeholder: 'Search Works'},
    {attribute: 'conductor', title: 'Conductor', placeholder: 'Search Conductors'},
    {attribute: 'orchestra', title: 'Orchestra/Ensemble', placeholder: 'Search Orchestras/Ensembles'},
    {attribute: 'work.artist.artist_name', title: 'Artist', placeholder: 'Search Artists'}
  ]

  const routing = ref({
    router: historyRouter({
      // Disable scroll restoration to prevent erratic behavior
      writeDelay: 0
    }),
    stateMapping: simpleStateMapping()
  })
  const byDate = ref(true)
  const displayDate = ref(null)
  const datepicker = ref(null)
  const rangeInput = ref(null)
  const venueOptions = ref([])
  const ensembleOptions = ref([])

  const today = Date.now()
  const date = ref([today, today])

  // Modal state management
  let isCreatingModal = false
  let modalCreated = false

  function slugify(str) {
    return String(str)
      .normalize('NFKD') // split accented characters into their base characters and diacritical marks
      .replace(/[\u0300-\u036f]/g, '') // remove all the accents, which happen to be all in the \u03xx UNICODE block.
      .trim() // trim leading or trailing whitespace
      .toLowerCase() // convert to lowercase
      .replace(/[^a-z0-9 -]/g, '') // remove non-alphanumeric characters
      .replace(/\s+/g, '-') // replace spaces with hyphens
      .replace(/-+/g, '-'); // remove consecutive hyphens
  }

  // Reusable multi-select modal template function
  function createMultiSelectModalHTML(options = {}) {
    const {
      modalId = 'multi-select-modal',
      title = 'Make Selection',
      description = 'Choose your options',
      cancelText = 'Cancel',
      selectText = 'Select',
      cancelButtonClass = 'js-modal-cancel',
      selectButtonClass = 'js-modal-select',
      contentContainerClass = 'eventsModal__contentContainer'
    } = options

    return `
      <div class="modal-container">
        <div class="eventsModal js--modal -full menu-is-open ${modalId}" aria-hidden="false">
          <div class="eventsModal__headerGrid">
            <div class="event__performance-wrapper">
              <span class="event__performance-name">${title}</span>
            </div>
            <button class="js--modal-close" aria-label="Close modal">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="17" fill="none">
                <path stroke="#686F73" d="m1.354.646 16 16m-16.708 0 16-16"/>
              </svg>
            </button>
          </div>

          <div class="eventsModal__content -full">
            <div class="eventsModal__dropdown -isMultiSelect">
              <span class="eventsModal__numberOfPerformances">${description}</span>
              <div class="${contentContainerClass}">
                <!-- Dynamic content will be inserted here -->
              </div>
            </div>
          </div>

          <div class="eventsModal__actions-container js-performance-actions" data-performance-id="${modalId}">
            <div class="performance__buttons">
              <div class="event__buttons">
                <div class="event__buy-button-wrapper js-event-buttons" data-where="modal" data-performance-id="${modalId}" style="display: flex; gap: 1rem; justify-content: center; width: 100%;">
                  <button type="button" class="event__buy-button event__buy-button--secondary ${cancelButtonClass}" style="background: #F5F5F5; color: #333; border: 1px solid #ddd;">
                    <strong>${cancelText}</strong>
                  </button>
                  <button type="button" class="event__buy-button ${selectButtonClass}">
                    <strong>${selectText}</strong>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  }

  // Handle date picker opened event
  function onDatePickerOpened() {
    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1024
    // Only create modal on mobile and if not already created or in progress
    if (windowWidth <= 767 && !modalCreated && !isCreatingModal) {
      isCreatingModal = true
      setTimeout(() => {
        createMobileDatePickerModal()
        isCreatingModal = false
      }, 150) // Timeout to ensure menu is fully rendered
    }
  }

  // Handle date picker closed event
  function onDatePickerClosed(value) {
    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1024

    // Process the date selection
    if (value && Array.isArray(value) && value.length >= 2) {
      console.log('Processing date selection:', Math.floor(value[0]/1000), Math.floor(value[1]/1000))
    } else {
      console.log('No date selection or incomplete selection:', value)
    }

    // Clean up mobile fullscreen styling
    if (windowWidth <= 767) {
      const menu = document.querySelector('.dp__menu')
      if (menu) {
        // Reset styles
        menu.style.position = ''
        menu.style.top = ''
        menu.style.left = ''
        menu.style.right = ''
        menu.style.bottom = ''
        menu.style.width = ''
        menu.style.height = ''
        menu.style.zIndex = ''
        menu.style.background = ''
        menu.style.padding = ''
      }

      // Remove body class
      document.body.classList.remove('menu-is-open')
    }
  }



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
      query_by: 'work.artist.artist_name',
      sort_by: 'performance_date:asc',
      // group_by: 'work',
      // group_limit: 1
    },
  })

  const searchClient = typesenseInstantsearchAdapter.searchClient

  const perPage = computed(() => byDate.value ? 10 : 8)

  // Check if we're on mobile
  const isMobile = ref(false)

  // Function to check mobile status
  function checkMobile() {
    if (typeof window !== 'undefined') {
      isMobile.value = window.innerWidth <= 767
    }
  }

  onMounted(() => {

    // let client = new Typesense.Client({
    //   'nodes': [{
    //     'host': 'go8f04wi19tuvlyrp-1.a1.typesense.net',
    //     'port': '443',      
    //     'protocol': 'https'   
    //   }],
    //   'apiKey': 'qoWHCTjesGfIaxdXbw9vOgod1VToEXNI',
    //   'connectionTimeoutSeconds': 2
    // })

    // let searchParameters = {
    //   'q'            : 'john williams',
    //   'filter_by'    : 'work.artist.{artist_name:=John Williams}',
    //   'query_by'     : 'work',
    //   'group_by'     : 'work',
    //   'group_limit'  : '1'
    // }

    // client.collections('archived_performances').documents().search(searchParameters).then(function (searchResults) {
    //   console.log('searchResults', searchResults)
    // })
    

    // Disable browser scroll restoration
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual'
    }

    // Listen for clicks on pagination and scroll after a delay
    setupPaginationScrollFix()

    // Check mobile status and add resize listener
    checkMobile()
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkMobile)
    }

    // Fallback: Watch for date picker menu to appear/disappear using MutationObserver
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        // Watch for added nodes (menu opening)
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1 && node.classList) {
            // Only trigger for the main menu, not wrapper elements or our modal
            if (node.classList.contains('dp__menu') &&
                !node.classList.contains('dp__mobile_modal') &&
                !modalCreated && !isCreatingModal) {
              if (typeof window !== 'undefined' && window.innerWidth <= 767) {
                onDatePickerOpened()
              }
            }
          }
        })
      })
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

  })


  onUnmounted(() => {
    // Restore browser scroll restoration
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'auto'
    }

    // Remove resize listener
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', checkMobile)
    }
  })

  function setupPaginationScrollFix() {
    // Use event delegation to catch pagination clicks
    document.addEventListener('click', (event) => {
      const paginationLink = event.target.closest('.ais-Pagination-link')

      if (paginationLink) {
        // Don't prevent default - let InstantSearch handle navigation normally
        // Schedule a scroll after InstantSearch updates
        setTimeout(() => {
          scrollToResults()
        }, 200)
      }
    })
  }

  function scrollToResults() {
    const resultsSection = document.querySelector('.eventsCalendar__results')
    if (resultsSection) {
      const rect = resultsSection.getBoundingClientRect()
      const scrollTop = window.pageYOffset + rect.top - 20 // 20px offset from top

      window.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      })
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

  function formatDate(unix_timestamp, display = true) {
        // multiplied by 1000 so that the argument is in milliseconds, not seconds
    const date = new Date(unix_timestamp * 1000)
    const days = ["Sun", "Mon", "Tues", "Weds", "Thurs", "Fri", "Sat"]
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
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

  function setView(viewType) {
    byDate.value = viewType === 'date'
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

  const setDate = (value) => {
    date.value = value
    displayDate.value = value

    // Note: Modal closing is now handled by the Select button click handler
  }

  // Generic mobile filter modal function
  function createMobileFilterModal(filterType, displayName, items, refineFunction) {
    const modalHTML = createMultiSelectModalHTML({
      modalId: `${filterType}__mobile_modal`,
      title: `Select ${displayName}`,
      description: `Choose your ${displayName.toLowerCase()}`,
      cancelText: 'Cancel',
      selectText: 'Apply',
      cancelButtonClass: `js-${filterType}-cancel`,
      selectButtonClass: `js-${filterType}-select`,
      contentContainerClass: `eventsModal__${filterType}Container`
    })

    // Insert modal into body
    document.body.insertAdjacentHTML('beforeend', modalHTML)

    const modal = document.querySelector(`.${filterType}__mobile_modal`)
    const container = modal.querySelector(`.eventsModal__${filterType}Container`)

    if (modal && container) {
      // Generate filter options HTML
      let optionsHTML = '<div class="filterModal__items">'

      items.forEach((item) => {
        const isChecked = item.isRefined ? 'checked' : ''
        const cleanLabel = item.value.replace(/<[^>]*>/g, '') // Remove HTML tags

        // For venue, split venue name from city
        let itemTextHTML = `<span class="filterModal__itemText">${cleanLabel}</span>`
        if (filterType === 'venue') {
          // Split on common patterns: ", City" or " | City" or similar
          const parts = cleanLabel.split(/,\s*(?=[A-Z])|(?:\s*\|\s*[^|]*,\s*)/);
          if (parts.length >= 2) {
            const venueName = parts[0].trim();
            const cityInfo = parts.slice(1).join(', ').trim();
            itemTextHTML = `
              <span class="filterModal__itemText">
                <span class="filterModal__venueName">${venueName}</span>
                <span class="filterModal__venueCity">${cityInfo}</span>
              </span>
            `
          }
        }

        optionsHTML += `
          <div class="filterModal__item">
            <label class="filterModal__itemLabel">
              <input type="checkbox"
                     class="${filterType}-checkbox"
                     value="${item.value.replace(/"/g, '&quot;')}"
                     ${isChecked}
                     data-count="${item.count}"
                     style="display: block !important; width: 20px !important; height: 20px !important; margin: 0 !important; opacity: 1 !important; visibility: visible !important;">
              ${itemTextHTML}
            </label>
          </div>
        `
      })

      optionsHTML += '</div>'
      container.innerHTML = optionsHTML

      // Add body class for modal
      document.body.classList.add('menu-is-open')

      // Add close functionality
      const closeBtn = modal.querySelector('.js--modal-close')
      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
          e.preventDefault()
          closeMobileFilterModal(filterType)
        })
      }

      // Add escape key handler
      const escapeHandler = (evt) => {
        if (evt.keyCode === 27) { // ESC key
          closeMobileFilterModal(filterType)
        }
      }
      document.addEventListener('keydown', escapeHandler)

      // Add click listeners to buttons
      const selectBtn = modal.querySelector(`.js-${filterType}-select`)
      const cancelBtn = modal.querySelector(`.js-${filterType}-cancel`)

      if (selectBtn) {
        selectBtn.addEventListener('click', () => {
          // Get all checkboxes
          const checkboxes = modal.querySelectorAll(`.${filterType}-checkbox`)

          // Get currently selected values from checkboxes
          const selectedValues = []
          checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
              selectedValues.push(checkbox.value)
            }
          })

          // First, clear all existing refinements
          items.forEach(item => {
            if (item.isRefined) {
              refineFunction(item.value)
            }
          })

          // Then apply new selections
          selectedValues.forEach(value => {
            refineFunction(value)
          })

          closeMobileFilterModal(filterType)
        })
      }

      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          closeMobileFilterModal(filterType)
        })

        // Add hover effects for secondary button
        cancelBtn.addEventListener('mouseenter', () => {
          cancelBtn.style.background = '#e5e5e5'
        })

        cancelBtn.addEventListener('mouseleave', () => {
          cancelBtn.style.background = '#F5F5F5'
        })
      }
    }
  }

  function closeMobileFilterModal(filterType) {
    const modal = document.querySelector(`.${filterType}__mobile_modal`)
    if (modal) {
      modal.remove()
      document.body.classList.remove('menu-is-open')
    }
  }

  // Generic click handler for filter dropdowns
  function handleFilterDropdownClick(event, filterType, displayName, items, refine) {
    let windowWidth = 1024; // Default to desktop

    try {
      if (typeof window !== 'undefined' && window) {
        windowWidth = window.innerWidth || 1024;
      }
    } catch (e) {
      // Window not available, use default
    }

    // Show modal on mobile only
    const shouldShowModal = windowWidth <= 767;

    if (shouldShowModal) {
      event.preventDefault();
      event.stopPropagation();
      createMobileFilterModal(filterType, displayName, items, refine);
      return false;
    } else {
      // console.log('Desktop - allowing normal dropdown');
    }
  }

  function createMobileDatePickerModal() {
    const menu = document.querySelector('.dp__menu')
    if (!menu) {
      setTimeout(() => {
        const retryMenu = document.querySelector('.dp__menu')
        if (retryMenu) {
          createMobileDatePickerModal()
        }
      }, 50)
      return
    }

    // Create modal structure using reusable template function
    const modalHTML = createMultiSelectModalHTML({
      modalId: 'dp__mobile_modal',
      title: 'Select Date Range',
      description: 'Choose your date range',
      cancelText: 'Cancel',
      selectText: 'Select',
      cancelButtonClass: 'js-datepicker-cancel',
      selectButtonClass: 'js-datepicker-select',
      contentContainerClass: 'eventsModal__datePickerContainer'
    })

    // Insert modal into body
    document.body.insertAdjacentHTML('beforeend', modalHTML)

    // Move the date picker menu into the modal
    const modal = document.querySelector('.dp__mobile_modal')
    const datePickerContainer = modal.querySelector('.eventsModal__datePickerContainer')

    if (modal && datePickerContainer && menu) {
      datePickerContainer.appendChild(menu)

      // Hide the original VueDatePicker buttons since we have modal buttons
      const originalActionRow = menu.querySelector('.dp__action_row')
      if (originalActionRow) {
        originalActionRow.style.display = 'none'
      }

      // Add body class for modal
      document.body.classList.add('menu-is-open')

      // Track selected range manually
      let selectedRange = null

      // Add close functionality
      const closeBtn = modal.querySelector('.js--modal-close')
      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
          e.preventDefault()
          closeMobileDatePickerModal()
        })
      }

      // Add escape key handler
      document.addEventListener('keydown', handleModalEscape)

      // Add click listeners to our custom buttons
      const selectBtn = modal.querySelector('.js-datepicker-select')
      const cancelBtn = modal.querySelector('.js-datepicker-cancel')

      if (selectBtn) {
        selectBtn.addEventListener('click', () => {

          // Get currently selected dates from the calendar
          const selectedDates = menu.querySelectorAll('.dp__calendar_item[aria-selected="true"]')

          if (selectedDates.length >= 2) {
            const dateRange = []
            selectedDates.forEach((dateEl) => {
              const dateId = dateEl.id // Format: "2025-11-01"
              if (dateId) {
                const dateObj = new Date(dateId + 'T00:00:00')
                dateRange.push(dateObj)
              }
            })

            // Sort dates to ensure proper range
            dateRange.sort((a, b) => a - b)

            // Set the date range
            setDate(dateRange)
            displayDate.value = [...dateRange]

          } else if (selectedDates.length === 1) {
            // Single date selected - create a single day range
            const dateId = selectedDates[0].id
            const singleDate = new Date(dateId + 'T00:00:00')
            const endDate = new Date(singleDate)
            endDate.setDate(endDate.getDate() + 1)

            const range = [singleDate, endDate]
            setDate(range)
            displayDate.value = [...range]

          } else {
            console.log('No dates selected')
          }

          // Close modal
          setTimeout(() => {
            closeMobileDatePickerModal()
          }, 100)
        })
      }

      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          closeMobileDatePickerModal()
        })

        // Add hover effects for secondary button
        cancelBtn.addEventListener('mouseenter', () => {
          cancelBtn.style.background = '#e5e5e5'
        })

        cancelBtn.addEventListener('mouseleave', () => {
          cancelBtn.style.background = '#F5F5F5'
        })
      }

      modalCreated = true
    } else {
      console.error('Failed to find modal elements after creation')
    }
  }

  function closeMobileDatePickerModal() {

    // Close the VueDatePicker directly
    if (datepicker.value && datepicker.value.closeMenu) {
      datepicker.value.closeMenu()
    }

    const modal = document.querySelector('.dp__mobile_modal')
    if (modal) {
      modal.remove()
      document.body.classList.remove('menu-is-open')
      document.removeEventListener('keydown', handleModalEscape)
      modalCreated = false // Reset the flag
    } else {
      console.log('No modal found to remove')
    }
    // Always reset the flag, even if no modal was found
    modalCreated = false
  }

  function handleModalEscape(evt) {
    if (evt.keyCode === 27) { // ESC key
      closeMobileDatePickerModal()
      if (datepicker.value && datepicker.value.closeMenu) {
        datepicker.value.closeMenu()
      }
    }
  }
</script>

<template>
  <div class="eventsCalendar">

    <ais-instant-search
      :search-client="searchClient"
      :index-name="props.indexName"
      :routing="routing"
      class="eventsCalendar__search"
    >
      <ais-configure
        :hits-per-page.camel="perPage"
      />

      <!-- Header and Search Section -->
      <div class="eventsCalendar__topSection">
        <!-- Search Filters Section -->
        <section class="eventsCalendar__filters">
            <header class="eventsCalendar__header">
              <h1 class="eventsCalendar__title">Find Concerts & Events</h1>
            </header>
            <div class="eventsCalendar__filtersRow">
            <!-- Search Box -->
              <div class="eventsCalendar__filterGroup eventsCalendar__filterGroup--search">
                  <ais-search-box
                  placeholder="Performance name, artist, work, or category"
                  class="eventsCalendar__searchBox"
                  />
              </div>
            </div>
        </section>
    </div>

        <!-- View Toggle and Active Filters -->
      <section class="eventsCalendar__filterRail">
        <div style="display: grid;">
          <ais-refinement-list v-for="refinement in mainRefinements" :attribute="refinement.attribute" operator="and">
            <template v-slot="{items, refine, searchForItems}">
              <p-accordion name="example" class="accordion">
                  <summary class="accordion__summary">
                      <h6 class="accordion__heading">{{ refinement.title }}</h6>
                      <div class="accordion__iconWrapper">
                      <svg class="accordion__icon icon icon--chevron-right" aria-hidden="true" role="presentation">
                          <use href="../assets/main-icons-sprite.svg#chevron-right" />
                      </svg>
                      </div>
                  </summary>
                  <div class="accordion__content">
                      <div class="ais-SearchBox eventsCalendar__searchBox -filter">
                        <input @input="searchForItems($event.currentTarget.value)" :placeholder="refinement.placeholder" class="ais-SearchBox-input -filter">
                      </div>
                      <div class="eventsCalendar__checkBoxes">
                      <label v-for="item in items" class="eventsCalendar__boxLabel" :for="slugify(refinement.title + ' ' + item.value)">
                          <input class="checkbox" type="checkbox" :id="slugify(refinement.title + ' ' + item.value)"  :value="item.value" :checked="item.isRefined" @click="refine(item.value)">
                          <span>{{ item.isRefined + ' ' + item.value }}</span><span>{{ item.count }}</span>
                      </label>
                      </div>
                  </div> 
              </p-accordion>
            </template>
          </ais-refinement-list>
        </div>
      </section>

      <!-- Search Results Section -->
      <section class="eventsCalendar__results">
        <ais-current-refinements></ais-current-refinements>
        <ais-hits class="eventsCalendar__hits">
          <template v-slot="{ items }">
            <h2>Hits: {{ items.length }}</h2>
            <div v-for="item in items">{{ JSON.stringify(item) }}</div>
          </template>
        </ais-hits>

        <!-- Pagination -->
        <nav class="eventsCalendar__pagination">
          <ais-pagination
            :show-first="true"
            :show-previous="true"
            :show-next="true"
            :show-last="true"
            class="eventsCalendar__paginationComponent"
          />
        </nav>
      </section>
    </ais-instant-search>
  </div>
  


</template>



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

  const props = defineProps({
    indexName: {
      type: String,
      default: "performances"
    }
  })


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
      query_by: 'title, excerpt, subhead, content_keywords',
      sort_by: 'performance_date:asc',
      // group_by: 'event_id',
      group_limit: 1
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
    // const startDate = new Date();
    // const endDate = new Date(new Date().setDate(startDate.getDate() + 7));
    // date.value = [startDate, endDate];
    //datepicker.value.clearValue()
    console.log("index name", props.indexName)

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

  // Function to determine event status
  function getEventStatus(item) {
    // First check if backend provides real status data
    if (item.event_status && item.event_status.length > 0) {
      const status = item.event_status[0]; // Assuming first status is primary
      return getStatusMapping(status);
    }

    // Fallback logic until backend provides data
    if (item.performance_categories && item.performance_categories.includes('Free')) {
      return { status: 'Free Event', class: '-free' };
    }

    // Check if past date
    const eventDate = new Date(item.performance_date * 1000);
    const now = new Date();
    if (eventDate < now) {
      return { status: 'Past Event', class: '-past-date' };
    }

    // Default status
    return { status: 'On Sale', class: '-status' };
  }

  // Status mapping function to match Dropdown.vue status
  function getStatusMapping(status) {
    const statusMap = {
      'Cancelled': { status: 'Cancelled', class: '-cancelled' },
      'Rescheduled': { status: 'Rescheduled', class: '-rescheduled' },
      'Postponed': { status: 'Postponed', class: '-postponed' },
      'Sold Out': { status: 'Sold Out', class: '-sold-out' },
      'Best Availability': { status: 'Best Availability', class: '-best-availability' },
      'Limited Availability': { status: 'Limited Availability', class: '-limited-availability' },
      'Coming Soon': { status: 'Coming Soon', class: '-coming-soon' },
      'Past Event': { status: 'Past Event', class: '-past-date' },
      'Free': { status: 'Free Event', class: '-free' },
      'On Sale': { status: 'On Sale', class: '-status' },
      // Add fallback for unknown statuses
      'default': { status: 'Status', class: '-status' }
    };

    return statusMap[status] || statusMap['default'];
  }

  // Get brand-specific CSS custom properties
  function getBrandColors(eventBrand) {
    // Map event_brand values to brand identifiers
    const brandMap = {
      'bso': 'bso',
      'boston symphony orchestra': 'bso',
      'pops': 'pops',
      'boston pops': 'pops',
      'tanglewood': 'tw',
      'tanglewood learning institute': 'tw',
      'symphonyhall': 'sh',
      'symphony hall': 'sh'
    };

    const brand = brandMap[eventBrand?.toLowerCase()] || 'bso';

    return {
      '--brand-200': `var(--c-brand-${brand}-200)`,
      '--brand-400': `var(--c-brand-${brand}-400)`,
      '--brand-600': `var(--c-brand-${brand}-600)`,
      '--brand-800': `var(--c-brand-${brand}-800)`
    };
  }

  // Check if notice should be displayed
  function hasNotice(item) {
    return item.notice && item.notice.trim().length > 0;
  }

  // Render notice icon using SVG symbol reference
  function renderNoticeIcon(iconName) {
    if (!iconName) return '';

    // Clean the icon name - remove any 'icon-' prefix if it exists
    const cleanIconName = iconName.replace(/^icon-/, '');

    return `<svg class="eventsCalendar__noticeIconSvg">
      <use xlink:href="#icon-${cleanIconName}"></use>
    </svg>`;
  }

  // Generate venue placeholder with count
  function getVenuePlaceholder(items) {
    const selectedCount = items.filter(item => item.isRefined).length;
    return selectedCount > 0 ? `Venue (${selectedCount})` : 'Venue';
  }

  // Generate ensemble placeholder with count
  function getEnsemblePlaceholder(items) {
    const selectedCount = items.filter(item => item.isRefined).length;
    return selectedCount > 0 ? `Ensemble (${selectedCount})` : 'Ensemble';
  }

  // Helper functions to split venue name from city
  function getVenueName(venueLabel) {
    const cleanLabel = venueLabel.replace(/<[^>]*>/g, ''); // Remove HTML tags
    const parts = cleanLabel.split(/,\s*(?=[A-Z])|(?:\s*\|\s*[^|]*,\s*)/);
    return parts[0]?.trim() || cleanLabel;
  }

  function getVenueCity(venueLabel) {
    const cleanLabel = venueLabel.replace(/<[^>]*>/g, ''); // Remove HTML tags
    const parts = cleanLabel.split(/,\s*(?=[A-Z])|(?:\s*\|\s*[^|]*,\s*)/);
    return parts.length >= 2 ? parts.slice(1).join(', ').trim() : '';
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

          <!-- Date Filter -->
          <div class="eventsCalendar__filterGroup eventsCalendar__filterGroup--date">
            <ais-range-input attribute="performance_date" ref="rangeInput" :min="date && date[0] ? Math.floor(date[0]/1000) : Math.floor(today/1000)">
              <template v-slot="{ currentRefinement, range, refine }">
                <vue-date-picker
                  ref="datepicker"
                  :format="format"
                  :model-value="displayDate"
                  @update:model-value="setDate"
                  range
                  :multi-calendars="false"
                  :enable-time-picker="false"
                  @open="onDatePickerOpened"
                  @close="onDatePickerClosed"
                  placeholder="Date"
                  class="eventsCalendar__datePicker"
                />
              </template>
            </ais-range-input>
          </div>

          <!-- Venue Filter -->
          <div class="eventsCalendar__filterGroup eventsCalendar__filterGroup--venue">
            <ais-refinement-list attribute="performance_venue.display_name" show-more>
              <template
                v-slot="{
                  items,
                  refine
                }"
                >
                  <div
                    class="eventsCalendar__vueSelectWrapper"
                    @click="(event) => handleFilterDropdownClick(event, 'venue', 'Venue', items, refine)"
                  >
                    <vue-select
                     :options="items"
                     :model-value="items.filter(item => item.isRefined).map(item => ({ ...item, label: item.value}))"
                      label="label"
                      placeholder="Venue"
                      multiple
                      :searchable="!isMobile"
                      :filterable="!isMobile"
                      :disabled="isMobile"
                      class="eventsCalendar__vueSelect"
                      @update:modelValue="(selected) => {
                        // Clear previous refinements first
                        items.forEach(item => {
                          if (item.isRefined) refine(item.value);
                        });
                        // Apply new refinements
                        selected.forEach(venue => refine(venue.value));
                      }"
                    >
                    <template #search="{ attributes, events }">
                      <div class="eventsCalendar__searchWithIcon">
                        <svg width="18" height="19" fill="none" class="eventsCalendar__venueIcon">
                          <g stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" clip-path="url(#a)">
                            <path d="M9 10.063a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z"/>
                            <path d="M14.625 7.813c0 5.062-5.625 9-5.625 9s-5.625-3.938-5.625-9a5.625 5.625 0 0 1 11.25 0v0Z"/>
                          </g>
                          <defs>
                            <clipPath id="a">
                              <path fill="#fff" d="M0 .5h18v18H0z"/>
                            </clipPath>
                          </defs>
                        </svg>
                  <input
                    class="vs__search"
                    v-bind="attributes"
                    v-on="events"
                    :placeholder="getVenuePlaceholder(items)"
                   />
                </div>
                    </template>
                    <template #option="{ label, count }">
                      <div class="eventsCalendar__selectOption eventsCalendar__selectOption--venue">
                        <input
                          type="checkbox"
                          class="venue-checkbox eventsCalendar__checkbox"
                          :checked="items.find(item => item.value === label)?.isRefined || false"
                        />
                        <div class="eventsCalendar__venueInfo">
                          <span class="eventsCalendar__venueName">{{ getVenueName(label) }}</span>
                          <span class="eventsCalendar__venueCity">{{ getVenueCity(label) }}</span>
                        </div>
                        <!-- <span class="eventsCalendar__selectCount">({{ count }})</span> -->
                      </div>
                    </template>
                    </vue-select>
                  </div>
              </template>
            </ais-refinement-list>
          </div>

          <!-- Ensemble Filter -->
          <div class="eventsCalendar__filterGroup eventsCalendar__filterGroup--ensemble">
            <ais-refinement-list attribute="ensembles" show-more>
              <template
                v-slot="{
                  items,
                  refine
                }"
                >
                  <div
                    class="eventsCalendar__vueSelectWrapper"
                    @click="(event) => handleFilterDropdownClick(event, 'ensemble', 'Ensemble', items, refine)"
                  >
                    <vue-select
                      :model-value="items.filter(item => item.isRefined).map(item => ({ ...item, label: item.value.replace(/<\/[^>]*>/g, ' ').replace(/<[^>]*>/g, '') }))"
                      :options="items.map(item => ({ ...item, label: item.value.replace(/<\/[^>]*>/g, ' ').replace(/<[^>]*>/g, '') }))"
                      label="label"
                      placeholder="Ensemble"
                      multiple
                      :searchable="!isMobile"
                      :filterable="!isMobile"
                      :disabled="isMobile"
                      class="eventsCalendar__vueSelect"
                      @update:modelValue="(selected) => {
                        // Clear previous refinements first
                        items.forEach(item => {
                          if (item.isRefined) refine(item.value);
                        });
                        // Apply new refinements
                        selected.forEach(ensemble => refine(ensemble.value));
                      }"
                    >
                    <template #search="{ attributes, events }">
                      <div class="eventsCalendar__searchWithIcon">
                        <svg width="19" height="18" viewBox="0 0 19 18" fill="none" class="eventsCalendar__ensembleIcon">
                          <path d="M7 14.3333V2.77778L17.6667 1V12.5556" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M4.33317 17.0001C5.80593 17.0001 6.99984 15.8062 6.99984 14.3334C6.99984 12.8607 5.80593 11.6667 4.33317 11.6667C2.86041 11.6667 1.6665 12.8607 1.6665 14.3334C1.6665 15.8062 2.86041 17.0001 4.33317 17.0001Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M14.9997 15.2222C16.4724 15.2222 17.6663 14.0283 17.6663 12.5556C17.6663 11.0828 16.4724 9.88892 14.9997 9.88892C13.5269 9.88892 12.333 11.0828 12.333 12.5556C12.333 14.0283 13.5269 15.2222 14.9997 15.2222Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                  <input
                          class="vs__search"
                          v-bind="attributes"
                          v-on="events"
                    :placeholder="getEnsemblePlaceholder(items)"
                        />
                </div>
                    </template>
                    <template #option="{ label, count }">
                      <div class="eventsCalendar__selectOption eventsCalendar__selectOption--ensemble">
                        <input
                          type="checkbox"
                          class="ensemble-checkbox eventsCalendar__checkbox"
                          :checked="items.find(item => item.value === label)?.isRefined || false"
                        />
                        <span v-html="label"></span>
                        <!-- <span class="eventsCalendar__selectCount">({{ count }})</span> -->
                      </div>
                    </template>
                    </vue-select>
                  </div>
              </template>
            </ais-refinement-list>
          </div>
          </div>
        </section>
        </div>

        <!-- View Toggle and Active Filters -->
        <div class="eventsCalendar__filtersControls">
          <div class="eventsCalendar__filtersControlsInner" :class="{ '-eventView': !byDate }">
            <div class="eventsCalendar__filtersTitle">Calendar</div>
             <div class="eventsCalendar__filtersActions">
          <button
                  @click="window.print()"
                  class="eventsCalendar__printButton"
                  title="Print Calendar"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 7V1H14V7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M3.2 14H2.6C2.17565 14 1.76869 13.8361 1.46863 13.5444C1.16857 13.2527 1 12.857 1 12.4444V8.55556C1 8.143 1.16857 7.74734 1.46863 7.45561C1.76869 7.16389 2.17565 7 2.6 7H15.4C15.8243 7 16.2313 7.16389 16.5314 7.45561C16.8314 7.74734 17 8.143 17 8.55556V12.4444C17 12.857 16.8314 13.2527 16.5314 13.5444C16.2313 13.8361 15.8243 14 15.4 14H14.8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M14 11H4V17H14V11Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <span>Print</span>
                </button>
                <div class="eventsCalendar__viewToggle">
                  <label class="eventsCalendar__radioOption" :class="{ '-selected': byDate }">
                    <input
                      type="radio"
                      name="viewType"
                      value="date"
                      :checked="byDate"
                      @change="setView('date')"
                      class="eventsCalendar__radioInput"
                    />
                    <span class="eventsCalendar__radioLabel">Date View</span>
                  </label>
                  <label class="eventsCalendar__radioOption" :class="{ '-selected': !byDate }">
                    <input
                      type="radio"
                      name="viewType"
                      value="event"
                      :checked="!byDate"
                      @change="setView('event')"
                      class="eventsCalendar__radioInput"
                    />
                    <span class="eventsCalendar__radioLabel">Event View</span>
                  </label>
                </div>
             </div>
          <!-- Current Refinements -->
              <ais-current-refinements :excluded-attributes="['performance_date']">
              <template v-slot="{ items, createURL }">
                <div class="eventsCalendar__filtersArea" v-if="items.length">
                  <!-- Results Count -->
                  <ais-stats>
                    <template v-slot="{ nbHits, query }">
                      <span v-if="query != '*'" class="eventsCalendar__resultsCount">{{ nbHits }} Results</span>
                      <span v-else class=""></span>
                    </template>
                  </ais-stats>

                  <div class="eventsCalendar__activeFilters">
                    <ul class="eventsCalendar__activeFiltersList">
                      <li v-for="item in items" :key="item.attribute" class="eventsCalendar__activeFiltersGroup">
                        <ul class="eventsCalendar__activeFiltersItems">
                          <li
                            v-for="refinement in item.refinements"
                            :key="[
                              refinement.attribute,
                              refinement.type,
                              refinement.value,
                              refinement.operator
                            ].join(':')"
                            class="eventsCalendar__activeFilterItem"
                          >
                            <a
                              :href="createURL(refinement)"
                              @click.prevent="item.refine(refinement)"
                              v-html="refinement.label + ' ×'"
                              class="eventsCalendar__activeFilterRemove"
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
                  class="eventsCalendar__clearFilters"
                >
                  Clear all filters
                </a>
                <span v-else></span>
              </template>
            </ais-clear-refinements>

          </div>
                </div>
                </template>
              </ais-current-refinements>
        </div>
        </div>

      <!-- Search Results Section -->
      <section class="eventsCalendar__results">
        <ais-hits class="eventsCalendar__hits">
          <template v-slot="{ items }">

            <!-- Results by Date View -->
            <div v-if="byDate" class="eventsCalendar__resultsByDate">
              <div v-for="month, key in groupItemsByMonth(items)" :key="key" class="eventsCalendar__monthGroup">
                <h2 class="eventsCalendar__monthTitle">{{ key }}</h2>
                <div class="eventsCalendar__monthEvents">
                  <article v-for="item in month" :key="item.objectId" class="eventsCalendar__eventCard">
                      <div class="eventsCalendar__eventMeta">
                      <div class="eventsCalendar__eventStatus" :class="getEventStatus(item).class">
                        {{ getEventStatus(item).status }}
                      </div>
                      </div>
                    <div class="eventsCalendar__eventContent">
                    <div class="eventsCalendar__categories" v-if="item.performance_categories && item.performance_categories.length">
                      <span
                        class="eventsCalendar__category"
                        v-for="category in item.performance_categories"
                        :key="category"
                        :style="getBrandColors(item.event_brand)"
                      >{{ category }}</span>
                    </div>
                      <h3 class="eventsCalendar__eventTitle" v-html="item.title"></h3>
                      <p v-if="item.subhead" class="eventsCalendar__eventSubhead">{{ item.subhead }}</p>

                      <div class="eventsCalendar__eventDetails">
                        <time class="eventsCalendar__eventDate">
                          <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" fill="none"><g stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" clip-path="url(#a)"><path d="M15.438 2.969H3.562a.594.594 0 0 0-.593.594v11.874c0 .328.266.594.594.594h11.874a.594.594 0 0 0 .594-.593V3.562a.594.594 0 0 0-.593-.593Zm-2.375-1.188v2.375M5.938 1.781v2.375M2.969 6.531H16.03"/></g><defs><clipPath id="a"><path fill="#fff" d="M0 0h19v19H0z"/></clipPath></defs></svg>
                          {{ formatDate(item.performance_date) }}
                        </time>
                        <div class="eventsCalendar__eventVenue">
                          <svg width="18" height="19" fill="none"><g stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" clip-path="url(#a)"><path d="M9 10.063a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z"/><path d="M14.625 7.813c0 5.062-5.625 9-5.625 9s-5.625-3.938-5.625-9a5.625 5.625 0 0 1 11.25 0v0Z"/></g><defs><clipPath id="a"><path fill="#fff" d="M0 .5h18v18H0z"/></clipPath></defs></svg>
                          <div class="eventsCalendar__eventVenueInner">
                            <a :href="item.performance_venue.link" class="eventsCalendar__venueLink">
                              {{ item.performance_venue.name }}
                            </a>
                            <span class="eventsCalendar__venueLocation">, {{ item.performance_venue.location }}</span>
                          </div>
                        </div>
                        <p v-if="item.performance_note" class="eventsCalendar__eventNote">
                          {{ item.performance_note }}</p>
                        <!-- Notice Display -->
                        <div v-if="hasNotice(item)" class="eventsCalendar__eventNotice" :style="{ color: item.notice_color }">
                          <span v-if="item.notice_icon" class="eventsCalendar__noticeIcon" v-html="renderNoticeIcon(item.notice_icon)" :style="{ color: item.notice_color }"></span>
                          <span class="eventsCalendar__noticeText">{{ item.notice }}</span>
                        </div>
                      </div>

                      <div class="eventsCalendar__eventActions">
                        <a :href="item.performance_link" class="eventsCalendar__eventLink">Learn more</a>
                        <a
                          :href="item.ticket_link"
                          class="eventsCalendar__ticketLink"
                          :style="getBrandColors(item.event_brand)"
                        >
                          {{ item.ticket_text ? item.ticket_text : 'Buy Tickets' }}
                          <svg width="14" height="15" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M0 7.5H12" stroke="#686F73" stroke-width="1.5"/>
                            <path d="M6 1.5L12 7.5L6 13.5" stroke="#686F73" stroke-width="1.5"/>
                          </svg>
                        </a>
                      </div>
                    </div>
                    <div class="eventsCalendar__eventImage">
                      <img :src="item.image_src" :alt="item.image_alt" class="eventsCalendar__eventImg" />
                    </div>
                  </article>
                </div>
              </div>
            </div>

            <!-- Results by Event View -->
            <div v-else class="eventsCalendar__resultsByEvent">
              <div class="eventsCalendar__eventsList">
                <article v-for="item in items" :key="item.objectId" class="eventsCalendar__eventCard">
                    <div class="eventsCalendar__eventMeta">
                    <div class="eventsCalendar__eventStatus" :class="getEventStatus(item).class">
                      {{ getEventStatus(item).status }}
                    </div>
                    </div>
                  <div class="eventsCalendar__eventContent">
                    <div class="eventsCalendar__categories" v-if="item.performance_categories && item.performance_categories.length">
                      <span
                        class="eventsCalendar__category"
                        v-for="category in item.performance_categories"
                        :key="category"
                        :style="getBrandColors(item.event_brand)"
                      >{{ category }}</span>
                    </div>
                    <h3 class="eventsCalendar__eventTitle" v-html="item.title"></h3>
                    <p v-if="item.subhead" class="eventsCalendar__eventSubhead">{{ item.subhead }}</p>

                    <div class="eventsCalendar__eventDetails">
                      <time v-if="item.num_performances == 1" class="eventsCalendar__eventDate">
                        <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" fill="none"><g stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" clip-path="url(#a)"><path d="M15.438 2.969H3.562a.594.594 0 0 0-.593.594v11.874c0 .328.266.594.594.594h11.874a.594.594 0 0 0 .594-.593V3.562a.594.594 0 0 0-.593-.593Zm-2.375-1.188v2.375M5.938 1.781v2.375M2.969 6.531H16.03"/></g><defs><clipPath id="a"><path fill="#fff" d="M0 0h19v19H0z"/></clipPath></defs></svg>
                        {{ formatDate(item.performance_date) }}
                      </time>
                      <time v-else-if="item.performance_range" class="eventsCalendar__eventDateRange">
                        {{ item.performance_range }}
                      </time>

                      <div class="eventsCalendar__eventVenue">
                        <a :href="item.performance_venue.link" class="eventsCalendar__venueLink">
                          <svg width="18" height="19" fill="none"><g stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" clip-path="url(#a)"><path d="M9 10.063a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z"/><path d="M14.625 7.813c0 5.062-5.625 9-5.625 9s-5.625-3.938-5.625-9a5.625 5.625 0 0 1 11.25 0v0Z"/></g><defs><clipPath id="a"><path fill="#fff" d="M0 .5h18v18H0z"/></clipPath></defs></svg>
                          {{ item.performance_venue.name }}
                        </a>
                        <span class="eventsCalendar__venueLocation">, {{ item.performance_venue.location }}</span>
                      </div>
                      <p v-if="item.performance_note" class="eventsCalendar__eventNote">{{ item.performance_note }}</p>
                      <!-- Notice Display -->
                      <div v-if="hasNotice(item)" class="eventsCalendar__eventNotice" :style="{ color: item.notice_color }">
                        <span v-if="item.notice_icon" class="eventsCalendar__noticeIcon" v-html="renderNoticeIcon(item.notice_icon)" :style="{ color: item.notice_color }"></span>
                        <span class="eventsCalendar__noticeText">{{ item.notice }}</span>
                      </div>
                    </div>

                    <div class="eventsCalendar__eventActions">
                      <a :href="item.performance_link" class="eventsCalendar__eventLink">Learn more</a>
                      <a
                        v-if="item.ticket_link && item.num_performances == 1"
                        :href="item.ticket_link"
                        class="eventsCalendar__ticketLink"
                        :style="getBrandColors(item.event_brand)"
                      >
                        {{ item.ticket_text ? item.ticket_text : 'Buy Tickets' }}
                        <svg width="14" height="15" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M0 7.5H12" stroke="#686F73" stroke-width="1.5"/>
                          <path d="M6 1.5L12 7.5L6 13.5" stroke="#686F73" stroke-width="1.5"/>
                        </svg>
                      </a>
                      <a
                        v-else
                        :href="item.performance_link"
                        class="eventsCalendar__ticketLink"
                        :style="getBrandColors(item.event_brand)"
                      >Get Tickets</a>
                    </div>
                  </div>
                  <div class="eventsCalendar__eventImage">
                    <img :src="item.image_src" :alt="item.image_alt" class="eventsCalendar__eventImg" />
                  </div>
                </article>
              </div>
            </div>
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

<style lang="scss">
.eventsCalendar {
  // Ensure full width in responsive design mode
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  &__topSection {
    background-color: #FBF4EF;
    display: flex;
    align-items: flex-start;
    gap: 2rem;
    padding: 2rem 20px;
    width: 100%;
    box-sizing: border-box;

    @media screen and (min-width: 768px) {
      padding: 2rem 80px;
    }

    @media screen and (max-width: 768px) {
      flex-direction: column;
      gap: 1rem;
    }

    @media screen and (min-width: 1070px) {
      padding: 2rem 80px 2rem 140px;
    }
  }

  &__header {
    flex-shrink: 0;
    min-width: 200px;
    margin-bottom: .5rem;
  }

   &__title {
     font-weight: var(--font-weight-bold);
     font-size: var(--font-size-2);
     line-height: var(--line-height-heading);
     letter-spacing: -0.01em;
     color: var(--c-theme-800);
     margin-bottom: 0;
   }

   &__searchBox {
     border: 1px solid #D7D7D7;
     border-radius: 5px;
     width: 100%;
     background-color: #FDF9F7;
     padding: .5rem;
     height: 40px;
     display: flex;
     align-items: center;
     box-sizing: border-box;

     .ais-SearchBox-form {
       display: flex;
       align-items: center;
       justify-content: start;
       flex-direction: row-reverse;
       gap: .5rem;
       height: 100%;
       width: 100%;
     }

     .ais-SearchBox-input {
       font-size: var(--font-size-2);
       width: 90%;
       height: 100%;
       border: none;
       outline: none;
     }

     .ais-SearchBox-submitIcon {
       width: 16px;
       height: 16px;
     }

     .ais-SearchBox-reset {
       align-self: center !important;
       display: flex;
       align-items: center !important;
       justify-content: center !important;
       line-height: 1 !important;
       vertical-align: middle !important;
     }
  }

  &__filters,
  &__filtersControlsInner {
    flex: 1;
    min-width: 0;
  }

  &__filtersControlsInner {
    display: grid;
    grid-template-columns: 1fr auto;
    grid-template-areas:
      "title actions"
      "filters filters";

    @media screen and (min-width: 1070px) {
      grid-template-columns: 1fr auto;
      grid-template-rows: auto auto;
      grid-template-areas:
        "title actions"
        "filters filters";
    }

    // Add border-bottom when Event view is active
    &.-eventView {
      border-bottom: 1px solid #D3D0CD;
      padding-bottom: 1rem;
      margin-bottom: 1rem;
    }
  }

  &__filtersRow {
    display: grid;
    gap: 1rem;
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-areas:
      "search search search"
      "date venue ensemble";

    @media screen and (min-width: 768px) {
      grid-template-columns: 1fr 1fr;
      grid-template-areas:
      "search search"
      "date date"
      "venue ensemble";
    }

    @media screen and (min-width: 1070px) {
      grid-template-columns: 1fr 200px 200px 200px;
      grid-template-areas:
      "search date venue ensemble";
    }
  }

  &__filterGroup {
    flex: 1;

    &--search {
      grid-area: search;
    }

    &--date {
      grid-area: date;
      .dp__input_wrap {
        height: 40px !important;
      }

      .dp__input {
        height: 40px !important;
        border: 1px solid #D6D6D6 !important;
        border-radius: 5px !important;
        background: #FDF9F7 !important;
        padding: 0 2.5rem !important;
        font-size: 14px !important;
        box-sizing: border-box !important;
        display: flex !important;
        align-items: center !important;

        &::placeholder {
          color: #666;
        }

        @media screen and (min-width: 1070px) {
          font-size: 16px !important;
          padding: 0 2.75rem !important;
        }
      }

      .dp__input_icon {
        margin-left: 8px !important;
        flex-shrink: 0 !important;
      }

      // Mobile fullscreen date picker styles
      @media screen and (max-width: 767px) {
        .dp__menu {
          position: fixed !important;
          top: 60px !important; // Leave space for custom header
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100vw !important;
          height: calc(100vh - 60px) !important; // Adjust for header
          max-width: none !important;
          max-height: none !important;
          border-radius: 0 !important;
          z-index: 9999 !important;
          background: white !important;
          box-shadow: none !important;
          border: none !important;
          margin: 0 !important;
          padding: 0 !important;
          display: flex !important;
          flex-direction: column !important;
        }


        .dp__menu_inner {
          flex: 1 !important;
          display: flex !important;
          flex-direction: column !important;
          padding: 1rem !important;
          height: 100% !important;
          box-sizing: border-box !important;
        }

        .dp__calendar_header {
          padding: 1rem 0 !important;
          border-bottom: 1px solid #e0e0e0 !important;
          margin-bottom: 1rem !important;
        }

        .dp__calendar_header_item {
          font-size: 18px !important;
          font-weight: 600 !important;
        }

        .dp__calendar_wrap {
          flex: 1 !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: flex-start !important;
          overflow: hidden !important;
        }

        .dp__calendar {
          width: 100% !important;
          max-width: none !important;
        }

        // Force single month display
        .dp__instance_calendar {
          width: 100% !important;

          &:not(:first-child) {
            display: none !important;
          }
        }

        // Hide multi-calendar controls if they exist
        .dp__calendar_header_separator,
        .dp__calendar_next,
        .dp__calendar_prev {
          display: none !important;
        }

        .dp__calendar_row {
          margin-bottom: 0.5rem !important;
        }

        .dp__calendar_item {
          height: 48px !important;
          width: 48px !important;
          font-size: 16px !important;
          margin: 2px !important;
        }

        // Essential dp__ button styles for functionality
        .dp__action_button {
          cursor: pointer !important;
          border: none !important;
          padding: 0.75rem 1.5rem !important;
          border-radius: 0.375rem !important;
          font-weight: 500 !important;
          transition: all 0.2s ease !important;
        }

        .dp__action_select,
        .dp__select {
          background: var(--c-brand, #007bff) !important;
          color: white !important;
          border: none !important;

          &:hover {
            background: var(--c-brand-dark, #0056b3) !important;
          }
        }

        .dp__action_cancel {
          background: #f5f5f5 !important;
          color: #333 !important;
          border: 1px solid #ddd !important;

          &:hover {
            background: #e8e8e8 !important;
          }
        }

        // Hide original action row positioning to prevent flash
        .dp__action_row {
          &:not(.dp__action_row--repositioned) {
            opacity: 0 !important;
            transition: opacity 0.1s ease !important;
          }
        }

        // Note: CSS styles don't work for modals inserted outside component scope
        // Using inline styles in JavaScript instead

        // Add overlay backdrop
        .dp__overlay {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          background: rgba(0, 0, 0, 0.5) !important;
          z-index: 9998 !important;
        }
      }
    }

    &--venue {
      grid-area: venue;
    }

    &--ensemble {
      grid-area: ensemble;
    }
  }

  &__filtersControls {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-top: 1rem;
    flex-wrap: wrap;
    font-size: 14px;
    padding: 0 20px;

    @media screen and (min-width: 768px) {
      padding: 0 80px;
    }

    @media screen and (min-width: 1070px) {
      margin-top: 3rem;
      margin-left: 60px;
      padding: 0 80px;
    }
  }

  &__filtersTitle {
    font-size: 32px;
    font-weight: 700;
    color: var(--c-theme-800);
    grid-area: title;
    margin-bottom: .5rem;

    @media screen and (min-width: 1070px) {
      font-size: 50px;
      margin-bottom: 0;
    }
  }

  .ais-CurrentRefinements {
    grid-area: filters;
  }

  &__filtersArea {
    grid-area: filters;
    border-top: 1px solid #D3D0CD;
    margin-top: .5rem;
    padding: .75rem 0;
  }

  &__activeFilters {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 0.5rem;
    align-items: center;
  }

  &__activeFiltersList {
    display: flex;
    flex-direction: column;
    gap: .75rem;
  }

  &__activeFiltersItems {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
  }

  &__activeFilterItem {
    background-color: #f5f5f5;
    border-radius: 4px;
    padding: .25rem .5rem;
  }

  &__activeFilterRemove {
    .eventLocation {
      margin-left: 0.25rem;
    }
  }

   &__filtersActions {
     display: flex;
     align-items: center;
     gap: 1rem;
     grid-area: actions;
   }

   &__printButton {
     background: none;
     border: none;
     cursor: pointer;
     padding: 8px 12px;
     border-radius: 4px;
     display: none;
     color: #686F73;
     font-size: 14px;
     transition: background-color 0.2s, color 0.2s;

     @media screen and (min-width: 1070px) {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
     }

     &:hover {
       background-color: #f0f0f0;
       color: var(--c-theme-800);
     }

     svg {
       display: block;
       flex-shrink: 0;
     }

     span {
       white-space: nowrap;
     }
   }

   &__viewToggle {
     display: flex;
     gap: 0;
     border: 1px solid var(--brand-200, var(--c-theme-200));
     border-radius: 4px;
     overflow: hidden;
     background: white;
   }

   &__radioOption {
     position: relative;
     cursor: pointer;
     display: flex;
     align-items: center;
     justify-content: center;
     padding: 8px 16px;
     background: white;
     color: #686F73;
     font-size: 14px;
     font-weight: 500;
     transition: all 0.2s ease;
     border: none;
     min-width: 80px;

     &:first-child {
       border-right: 1px solid var(--brand-200, var(--c-theme-200));
     }

     &:hover {
       background-color: #f8f8f8;
       color: var(--c-theme-800);
     }

     &.-selected {
      background-color: var(--brand-200, var(--c-theme-200));
      color: var(--brand-800, var(--c-theme-800));

      &:hover {
        background-color: var(--brand-200, var(--c-theme-200));
        color: var(--brand-800, var(--c-theme-800));
      }
     }
   }

   &__radioInput {
     position: absolute;
     opacity: 0;
     width: 0;
     height: 0;
     pointer-events: none;
   }

   &__radioLabel {
     white-space: nowrap;
     user-select: none;
   }

   &__printButton {
     color: #686F73;
   }

  // Dropdown styles
  &__vueSelectWrapper {
    position: relative;

    // On mobile, add pointer cursor to indicate clickability
    @media screen and (max-width: 767px) {
      cursor: pointer;

      // Add a pseudo-element to capture clicks
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10;
        background: transparent;
      }
    }
  }

  &__vueSelect {
    &.v-select {
      min-height: auto;
      border: 0;
      padding: 0;
    }

    // On mobile, style disabled state to look normal and clickable
    @media screen and (max-width: 767px) {
      &.vs--disabled {
        opacity: 1 !important;

        .vs__dropdown-toggle {
          cursor: pointer !important;
          background: #FDF9F7 !important;
          border-color: #D6D6D6 !important;
        }

        .vs__selected {
          display: none !important;
        }

        .vs__search {
          cursor: pointer !important;
        }
      }
    }

    .vs__dropdown-toggle {
      border-radius: 5px !important;
      border: 1px solid #D6D6D6 !important;
      background: #FDF9F7 !important;
      padding: 0 12px 0 12px !important;
      height: 40px !important;
      min-height: 40px !important;
      max-height: 40px !important;
      max-width: 100% !important;
      display: flex !important;
      align-items: center !important;
      box-sizing: border-box !important;
      outline: none !important;
      overflow: hidden !important;
    }

    &.vs--focused .vs__dropdown-toggle {
      border: 1px solid var(--c-brand) !important;  // Keep original border
      outline: none !important;
      box-sizing: border-box !important;
    }

    &.vs--open .vs__dropdown-toggle {
      border: 1px solid var(--c-brand) !important;  // Keep original border
      outline: none !important;
      box-sizing: border-box !important;
    }

    .vs__selected-options {
      padding: 0;
      flex-wrap: wrap;
      gap: 4px;
      max-width: calc(100% - 32px) !important; // Reserve space for dropdown arrow
      overflow: hidden !important;
    }

    .vs__search {
      margin: 0 !important;
      padding: 0 !important;
      border: none !important;
      font-size: 14px !important;
      flex: 1 !important;
      position: relative !important;
      top: 0 !important;
      left: 0 !important;

      @media screen and (min-width: 1070px) {
        font-size: 16px !important;
      }

      &::placeholder {
        color: #666;
        position: relative !important;
        top: 0 !important;
        left: 0 !important;
      }
    }

    &.vs--open {
      border: none !important;
      .vs__search {
        margin: 0 !important;
        padding: 0 !important;
        position: relative !important;
        top: 0 !important;
        left: 0 !important;

        &::placeholder {
          position: relative !important;
          top: 0 !important;
          left: 0 !important;
        }
      }

      .vs__dropdown-toggle {
        padding: 0 12px 0 12px !important;
      }

      .vs__selected-options {
        padding: 0 !important;
      }
    }

    .vs__selected {
      display: none !important;

      .vs__deselect {
        color: white;
        position: absolute !important;
        right: 4px !important;
        top: 50% !important;
        transform: translateY(-50%) !important;
        margin: 0 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 16px !important;
        height: 16px !important;
      }
    }

    .vs__dropdown-menu {
      border: 1px solid #D6D6D6;
      border-radius: 5px;
      box-shadow: 0px 4px 16px 0px rgba(0, 0, 0, 0.12);
      max-height: 200px;
      overflow-y: auto;
      padding: 8px 0;
      display: grid;
      gap: 0.75rem;
    }

    .vs__dropdown-option {
      padding: 12px 16px;
      cursor: pointer;
      font-size: 17px !important;
      margin: 0 16px;
      border-radius: 4px;
      white-space: normal !important;
      word-wrap: break-word !important;
      overflow-wrap: break-word !important;
      line-height: 1.4 !important;

      &:hover,
      &--highlight {
        color: var(--c-theme-400) !important;
      }
    }

    .vs__actions {
      padding: 0 12px 0 8px !important;
      margin: 0 !important;
      display: flex !important;
      position: relative !important;
      align-items: center !important;
      justify-content: center !important;
      height: 38px !important;
      min-width: 32px !important;
      flex-shrink: 0 !important;

      &::after {
        content: '' !important;
        border: 1px solid var(--c-theme-800) !important;
        border-width: 0 1.5px 1.5px 0 !important;
        display: inline-block !important;
        padding: 4px !important;
        transform: rotate(45deg) !important;
        transition: transform 0.3s ease !important;
        position: absolute !important;
        top: 50% !important;
        right: 0 !important;
        margin-top: -6px !important;
        z-index: 10 !important;
        pointer-events: none !important;

        @media screen and (min-width: 768px) {
          right: 12px !important;
        }
      }
    }

    .vs__open-indicator {
      display: none !important;
      opacity: 0 !important;
      visibility: hidden !important;
    }

    &.vs--open .vs__actions::after {
      transform: rotate(-135deg) !important;
    }

  }

  &__selectOption {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    gap: 4px;

    span {
      white-space: normal;
      word-wrap: break-word;
      overflow-wrap: break-word;
      line-height: 1.4;
      min-width: 0; // Important for flex wrapping
      max-width: calc(100% - 30px); // Reserve minimal space for count
    }
  }

  &__selectCount {
    color: #999;
    font-size: 11px;
    margin-left: 2px;
    padding: 0 2px;
    flex-shrink: 0;
    align-self: flex-start;
    min-width: 0;
    width: fit-content;
    white-space: nowrap;
    line-height: 1.2;
  }

  &__searchWithIcon {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 0;
  }

  &__venueIcon,
  &__ensembleIcon {
    flex-shrink: 0;
    color: #666;
    width: 19px;
    height: 18px;
    max-height: 18px;
  }

    // Search Results
    &__resultsByDate,
    &__resultsByEvent {
      padding: 0 20px;

      @media screen and (min-width: 768px) {
        padding: 0 80px;
      }

      @media screen and (min-width: 1070px) {
        margin-left: 60px;
        padding: 0 80px;
      }
    }


    &__resultsCount {
      color: #686F73;
      display: inline-block;
      font-size: var(--font-size-3);
      font-weight: var(--font-weight-bold);
      margin-bottom: .75rem;
    }

  // Results by Date View
  &__resultsByDate {
    .eventsCalendar__eventImage {
      width: 222px;
      height: 139px;
      margin-left: 0;

      @media screen and (min-width: 768px) {
        margin-left: auto;
      }
    }

    .eventsCalendar__eventTitle {
      font-size: 18px;

      @media screen and (min-width: 1070px) {
        font-size: 22px;
      }
    }

    .eventsCalendar__eventDate,
    .eventsCalendar__eventVenue,
    .eventsCalendar__eventActions {
      font-size: var(--font-size-1);

      @media screen and (min-width: 1070px) {
        font-size: var(--font-size-2);
      }
    }

    .eventsCalendar__eventCard {
      @media screen and (min-width: 1070px) {
        grid-template-columns: 1fr 2fr 1fr;
        grid-template-areas: "status content image";
      }
    }

    .eventsCalendar__eventDetails {
      margin-top: .5rem;

      @media screen and (min-width: 1070px) {
        margin-top: 1rem;
      }
    }
  }

  // Results by Event View
  &__resultsByEvent {
    .eventsCalendar__eventImage {
      width: 100%;
      max-width: 100%;
      height: auto;
      margin-left: 0;

      @media screen and (min-width: 768px) {
        max-width: 580px;
        height: 360px;
        margin-left: auto;
      }
    }

    .eventsCalendar__eventImg {
      height: auto;
      aspect-ratio: 16 / 10;

      @media screen and (min-width: 768px) {
        height: 360px;
        aspect-ratio: 580 / 360;
      }
    }

    .eventsCalendar__eventTitle {
      font-size: var(--font-size-3);

      @media screen and (min-width: 1070px) {
        font-size: 40px;
      }
    }

    .eventsCalendar__eventDetails {
      margin-top: 1rem;

      @media screen and (min-width: 1070px) {
        margin-top: 1.5rem;
      }
    }

    .eventsCalendar__eventDate,
    .eventsCalendar__eventVenue,
    .eventsCalendar__eventActions {
      font-size: var(--font-size-2);

      @media screen and (min-width: 1070px) {
        font-size: 22px;
      }
    }

    .eventsCalendar__eventCard {
      .eventsCalendar__eventMeta {
        display: none;
      }

      @media screen and (min-width: 1070px) {
        grid-template-columns: 1fr 1fr;
        grid-template-areas: "content image";
      }
    }
  }

  &__eventDetails {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__eventActions {
    margin-top: 1rem;
    display: flex;
    gap: 1rem;

    @media screen and (min-width: 1070px) {
      margin-top: 1.5rem;
    }
  }

  &__ticketLink {
    color: var(--brand-600, var(--c-theme-600));
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: color 0.2s, text-decoration 0.2s;

    &:hover {
      color: var(--brand-800, var(--c-theme-800));
      text-decoration: underline;
    }
  }

  &__eventLink {
    color: #686F73;
    transition: color 0.2s, text-decoration 0.2s;

    &:hover {
      color: var(--c-theme-800);
      text-decoration: underline;
    }
  }

  &__monthTitle {
    font-size: var(--font-size-3);
    font-weight: 700;
    border-bottom: 1px solid #D3D0CD;
    border-top: 1px solid #D3D0CD;
    padding-top: .5rem;
    padding-bottom: .5rem;
    margin-bottom: .5rem;
  }

  &__eventCard {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
    margin-top: 1rem;
    border-bottom: 1px solid #D3D0CD;
    padding-bottom: 1rem;
    margin-bottom: 1rem;

    @media screen and (min-width: 1070px) {
      gap: 2rem;
      align-items: start;
      margin-top: 1.5rem;
      padding-bottom: 1.5rem;
      margin-bottom: 1.5rem;
    }

    &:last-child {
      border-bottom: none;
      margin-bottom: 0;
    }
  }

  &__eventMeta {
    justify-self: start;

    @media screen and (min-width: 1070px) {
      grid-area: status;
    }
  }

  &__eventStatus {
    font-size: var(--font-size-1);
    padding: 9px 12px;
    border-radius: 5px;
    border: 1px solid var(--status-border-default);
    background-color: transparent;
    color: var(--status-color-default);

    // Import status styles from Dropdown component
    &.-status {
      background-color: var(--status-border-default);
      color: var(--status-color-default);
    }

    &.-cancelled {
      background-color: transparent;
      border: 1px solid var(--status-border-cancelled);
      color: var(--status-color-cancelled);
    }

    &.-rescheduled {
      background-color: transparent;
      border: 1px solid var(--status-border-rescheduled);
      color: var(--status-color-rescheduled);
    }

    &.-postponed {
      background-color: transparent;
      border: 1px solid var(--status-border-postponed);
      color: var(--status-color-postponed);
    }

    &.-sold-out {
      background-color: transparent;
      border: 1px solid var(--status-border-sold-out);
      color: var(--status-color-sold-out);
    }

    &.-best-availability {
      background-color: transparent;
      border-color: var(--status-border-best-availability);
      color: var(--status-color-best-availability);
    }

    &.-limited-availability {
      background-color: transparent;
      border: 1px solid var(--status-border-limited-availability);
      color: var(--status-color-limited-availability);
    }

    &.-coming-soon {
      background-color: transparent;
      border: 1px solid var(--status-border-coming-soon);
      color: var(--status-color-coming-soon);
    }

    &.-past-date {
      background-color: transparent;
      border: 1px solid var(--status-border-default);
      color: var(--status-color-default);
    }

    &.-free {
      background-color: transparent;
      border: 1px solid var(--c-theme-400);
      color: var(--c-theme-600);
    }
  }

  &__eventContent {
    @media screen and (min-width: 1070px) {
      grid-area: content;
    }
  }

  &__eventImage {
    width: 222px;
    height: 139px;
    overflow: hidden;
    border-radius: 4px;
    flex-shrink: 0;

    @media screen and (min-width: 1070px) {
      grid-area: image;
    }

    @media screen and (max-width: 767px) {
      width: 100%;
      max-width: 222px;
      height: 139px;
    }
  }

  &__eventImg {
    border-radius: 4px;
    width: 100%;
    height: 139px;
    object-fit: cover;
    object-position: center;
    aspect-ratio: 222 / 139;
  }

  &__eventTitle {
    font-weight: 700;
  }

  &__eventNotice {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.75rem;
    font-weight: 500;
  }

  &__eventNote {
    margin-top: 0.75rem;
  }

  &__noticeIcon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 16px;
    height: 16px;
  }

  &__noticeIconSvg {
    width: 100%;
    height: 100%;
    display: block;
    fill: currentColor;
    stroke: currentColor;

    use {
      fill: inherit;
      stroke: inherit;
    }
  }

  &__eventNote,
  &__noticeText {
    font-size: var(--font-size-1);
    font-weight: var(--font-weight-bold);
    line-height: 1.4;
  }

  &__noticeText {
    flex: 1;
  }

  &__categories {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  }

  &__category {
    background-color: var(--brand-600, var(--c-theme-600));
    color: white;
    padding: .5rem .75rem;
    border-radius: 3px;
    font-size: var(--font-size-1);
    font-weight: 500;

    // Second sibling and beyond get lighter styling
    &:nth-child(n+2) {
      background-color: var(--brand-200, var(--c-theme-200));
      color: var(--brand-800, var(--c-theme-800));
    }
  }

  &__eventDate {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: var(--font-size-1);

    @media screen and (min-width: 1070px) {
      font-size: var(--font-size-2);
    }
  }

  &__eventVenue {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: var(--font-size-1);

    @media screen and (min-width: 1070px) {
      font-size: var(--font-size-2);
    }
  }

  &__venueLink {
    text-decoration: underline;
    transition: text-decoration 0.2s, color 0.2s;

    &:hover {
      color: var(--c-brand);
      text-decoration: underline;
    }
  }

  // Pagination styles
  &__pagination {
    margin-top: 2rem;
    display: flex;
    justify-content: center;
    padding: 0 20px;

    @media screen and (min-width: 768px) {
      padding: 0 80px;
    }

    @media screen and (min-width: 1070px) {
      margin-left: 60px;
      padding: 0 80px;
    }
  }

  &__paginationComponent {
    .ais-Pagination {
      &-list {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        list-style: none;
        margin: 0;
        padding: 0;
      }

      &-item {
        &--firstPage,
        &--previousPage,
        &--page,
        &--nextPage,
        &--lastPage {
          .ais-Pagination-link {
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 40px;
            height: 40px;
            padding: 0 12px;
            border: 1px solid #D6D6D6;
            border-radius: 4px;
            background: white;
            color: #333;
            text-decoration: none;
            font-size: var(--font-size-1);
            transition: all 0.2s;

            &:hover {
              background: #f5f5f5;
              border-color: #999;
            }
          }
        }

        &--selected {
          .ais-Pagination-link {
            background: var(--c-brand, #007bff);
            color: white;
            border-color: var(--c-brand, #007bff);
          }
        }

        &--disabled {
          .ais-Pagination-link {
            opacity: 0.5;
            cursor: not-allowed;

            &:hover {
              background: white;
              border-color: #D6D6D6;
            }
          }
        }
      }
    }
  }

  // Mobile date picker modal styles
  .dp__mobile_modal {
    .dp__menu {
      position: static !important;
      top: auto !important;
      left: auto !important;
      right: auto !important;
      bottom: auto !important;
      width: 100% !important;
      height: auto !important;
      max-width: none !important;
      max-height: none !important;
      border-radius: 0 !important;
      z-index: auto !important;
      background: transparent !important;
      box-shadow: none !important;
      border: none !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    .dp__modal_body {
      padding: 1rem !important;
      flex: 1 !important;
      display: flex !important;
      flex-direction: column !important;
    }
  }

  // Filter modal styles (venue and ensemble)
  .venue__mobile_modal,
  .ensemble__mobile_modal {
    .eventsModal__venueContainer,
    .eventsModal__ensembleContainer {
      padding: 1rem;
      max-height: 60vh;
      overflow-y: auto;
    }

    // Ensure checkboxes are visible in modals
    input[type="checkbox"] {
      display: block !important;
      opacity: 1 !important;
      visibility: visible !important;
      width: 20px !important;
      height: 20px !important;
      margin: 0 !important;
      padding: 0 !important;
      border: 2px solid #ccc !important;
      border-radius: 3px !important;
      background: white !important;
      appearance: checkbox !important;
      -webkit-appearance: checkbox !important;
      -moz-appearance: checkbox !important;

      &:checked {
        background: var(--c-brand, #007bff) !important;
        border-color: var(--c-brand, #007bff) !important;
      }
    }
  }

  // Desktop dropdown checkbox styles (matching mobile modal)
  .eventsCalendar__checkbox {
    margin: 0 12px 0 0 !important;
    flex-shrink: 0;
    width: 20px !important;
    height: 20px !important;
    min-width: 20px !important;
    min-height: 20px !important;
    accent-color: var(--c-brand, #007bff) !important;
    appearance: checkbox !important;
    -webkit-appearance: checkbox !important;
    -moz-appearance: checkbox !important;
    display: block !important;
    opacity: 1 !important;
    visibility: visible !important;
    position: relative !important;
    z-index: 1 !important;
    background: white !important;
    border: 2px solid #ccc !important;
    border-radius: 3px !important;
    cursor: pointer;

    &:checked {
      background: var(--c-brand, #007bff) !important;
      border-color: var(--c-brand, #007bff) !important;
    }
  }

  // Desktop venue dropdown styles
  .eventsCalendar__selectOption--venue {
    display: flex;
    align-items: center;
    gap: 12px;

    .eventsCalendar__venueInfo {
      flex: 1;
    }

    .eventsCalendar__venueName {
      display: block;
      font-weight: 500;
    }

    .eventsCalendar__venueCity {
      display: block;
      font-size: 14px;
      color: #686F73;
      font-weight: 400;
    }
  }

  // Desktop ensemble dropdown styles
  .eventsCalendar__selectOption--ensemble {
    display: flex;
    align-items: center;
    gap: 12px;

    span:not(.eventsCalendar__selectCount) {
      flex: 1;
    }
  }

  // Make dropdown menus span across both venue and ensemble filters
  .eventsCalendar__filtersRow {
    position: relative;
  }

  .eventsCalendar__filterGroup--venue,
  .eventsCalendar__filterGroup--ensemble {
    .vs__dropdown-menu {
      position: absolute;
      left: 0;
      right: 0;
      width: auto !important;
      min-width: 100%;
      z-index: 1000;

      // Calculate width to span both filter groups plus gap
      // Assuming the filters row has the two filter groups side by side
      @media (min-width: 768px) {
        width: calc(200% + 1rem) !important; // 200% for both filters + gap between them
      }
    }
  }

  // Ensure the ensemble dropdown menu aligns to the left edge of the filters row
  .eventsCalendar__filterGroup--ensemble {
    .vs__dropdown-menu {
      // Position the ensemble dropdown to start from the venue filter position
      left: calc(-100% - 1rem); // Move left by the width of venue filter + gap
    }
  }

  // Modal styles moved outside .eventsCalendar scope

  // Ensure modal button styles are applied globally
  .event__buy-button-wrapper {
    display: flex !important;
    gap: 1rem !important;
    justify-content: center !important;
    width: 100% !important;
  }

  .event__buy-button--secondary {
    background: #F5F5F5 !important;
    color: #333 !important;
    border: 1px solid #ddd !important;

    &:hover {
      background: #e5e5e5 !important;
    }
  }
}

/* Filter modal styles - outside eventsCalendar scope since modals are in document.body */
.eventsModal .filterModal__items {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.eventsModal .filterModal__item:has(input:checked) {
  border-color: var(--c-brand, #007bff);
  background-color: #f0f8ff;
}

.eventsModal .filterModal__itemLabel {
  display: flex;
  align-items: center;
  cursor: pointer;
  gap: 0.75rem;
  width: 100%;
  margin: 0;
}

.eventsModal .filterModal__itemLabel input[type="checkbox"] {
  margin: 0 !important;
  flex-shrink: 0;
  width: 20px !important;
  height: 20px !important;
  min-width: 20px !important;
  min-height: 20px !important;
  accent-color: var(--c-brand, #007bff) !important;
  appearance: checkbox !important;
  -webkit-appearance: checkbox !important;
  -moz-appearance: checkbox !important;
  display: block !important;
  opacity: 1 !important;
  visibility: visible !important;
  position: relative !important;
  z-index: 1 !important;
  background: white !important;
  border: 2px solid #ccc !important;
  border-radius: 3px !important;
}

.eventsModal .filterModal__itemLabel input[type="checkbox"]:checked {
  background: var(--c-brand, #007bff) !important;
  border-color: var(--c-brand, #007bff) !important;
}

.eventsModal .filterModal__itemText {
  flex: 1;
  font-size: 16px;
  line-height: 1.4;
  color: var(--c-theme-800, #333);
}

.eventsModal .filterModal__venueName {
  display: block;
}

.eventsModal .filterModal__venueCity {
  display: block;
  font-size: 14px;
  color: #686F73;
  font-weight: 400;
}

// Calendar styles
.dp__menu {
  @media (max-width: 768px) {
    border: none !important;
  }
}

// Desktop positioning for date picker to span across Date and Venue inputs
.eventsCalendar__filterGroup--date {
  @media (min-width: 769px) {
    position: relative;
  }

  .dp__outer_menu_wrap {
    @media (min-width: 769px) {
      position: absolute !important;
      left: 0 !important;
      top: calc(100% + .5rem)  !important;
      width: calc(200% + 1rem) !important;
      z-index: 1000 !important;
    }

    .dp__menu {
      @media (min-width: 769px) {
        width: 100% !important;
        left: 0 !important;
      }
    }
  }
}

.dp__menu_inner {
  --dp-menu-padding: 16px 8px;
  @media (max-width: 769px) {
    --dp-menu-padding: 0 !important;
  }
}

.dp__cell_inner.dp__today {
  border-radius: 50% !important;
  border-color: var(--c-brand) !important;
  color: var(--c-brand) !important;
}

.dp__cell_inner {
  --dp-cell-border-radius: 16px !important;
  --dp-font-size: 14px !important;
  --dp-cell-size: 48px;
  font-size: var(--dp-font-size);
}

.dp__range_start,
.dp__range_end {
  --dp-cell-border-radius: 32px !important;
  --dp-primary-color: var(--c-brand) !important;
}

.dp__range_between {
  --dp-range-between-dates-background-color: var(--c-theme-200) !important;
  --dp-range-between-dates-text-color: var(--c-theme-400) !important;
  border: none !important;
}

.dp__calendar_item,
.dp__calendar_header_item {
  flex-grow: 0 !important;
  --dp-cell-size: 48px;
}

.dp--year-select, .dp__month_year_select {
  font-size: 22px !important;
  font-weight: 800 !important;
  --dp-text-color: var(--c-theme-800) !important;
}

.dp__calendar_header_item {
  color: #686F73 !important;
}

// Date picker action buttons to match mobile modal buttons
.dp__action_buttons {
  gap: 12px !important;
}

.dp__action_button {
  padding: 16px 24px !important;
  border-radius: 8px !important;
  font-weight: 600 !important;
  font-size: 17px !important;
  border: none !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;

  &.dp__action_select {
    background: var(--c-brand, #007bff) !important;
    color: white !important;

    &:hover {
      background: var(--c-brand-dark, #0056b3) !important;
    }
  }

  &.dp__action_cancel {
    background: #F5F5F5 !important;
    color: #333 !important;
    border: none !important;
    font-weight: 400 !important;

    &:hover {
      background: #e8e8e8 !important;
    }
  }
}
.dp__calendar_header_separator{
  height: 0 !important;
}

.dp__month_year_wrap {
  margin-bottom: .5rem !important;
}

.dp__action_row {
  border-top: 1px solid #D6D6D6 !important;
}
</style>

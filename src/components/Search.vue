<script setup>

  import { ref, onMounted, onUnmounted, computed } from 'vue'
  
  import VueDatePicker from '@vuepic/vue-datepicker';
  import '@vuepic/vue-datepicker/dist/main.css'
  import VueSelect from 'vue-select'

  import Typesense from 'typesense'

  
  import PTabs from './PTabs.vue'
  import SearchTab from "./SearchTab.vue"

  import formatDate from '../composables/formatDate'

  const props = defineProps({
    indexName: {
      type: String,
      default: "archived_performances"
    }
  })
  
  
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

  const mainRefinements = [
    {attribute: 'work.composer', title: 'Composer', placeholder: 'Search Composers'},
    {attribute: 'work.title', title: 'Work', placeholder: 'Search Works'},
    {attribute: 'conductor', title: 'Conductor', placeholder: 'Search Conductors'},
    {attribute: 'orchestra', title: 'Orchestra/Ensemble', placeholder: 'Search Orchestras/Ensembles'},
    {attribute: 'work.artist.artist_name', title: 'Artist', placeholder: 'Search Artists'},
  ]

  const addlRefinements = [
    {attribute: 'work.artist.artist_role', title: 'Instrument', placeholder: 'Search Instruments', type: 'list'},
    {attribute: 'work.creator.creator_name', title: 'Additional Creator', placeholder: 'Search Creators', type: 'list'},
    {attribute: 'work.creator.creator_role', title: 'Additional Creator Role', placeholder: 'Search Creator Roles', type: 'list'},
    {attribute: 'season', title: 'Season', placeholder: 'Search Seasons', type: 'list'},
    {attribute: 'event_title', title: 'Event Title', placeholder: 'Search Event Titles', type: 'list'},
    {attribute: 'event_types', title: 'Series', placeholder: 'Search Event Types', type: 'list'},
    {attribute: 'venue', title: 'Venue', placeholder: 'Search Venues', type: 'list'},
    {attribute: 'location', title: 'Location', type: 'location'},
    {attribute: 'media', title: 'Media', placeholder: 'Select Media', type: 'list', hideSearch: 'false'},
    {attribute: 'premiere', title: 'Premiere', placeholder: 'Select Premiere', type: 'list', hideSearch: 'false'},
    {attribute: 'work.commission', title: 'Commission', placeholder: 'Select Premiere', type: 'list', hideSearch: 'false'}
  ]

  const artistRefinements = [
    {attribute: 'artist_name', title: 'Artist/Ensemble', placeholder: 'Search Artists/Ensembles'},
    {attribute: 'artist_role', title: 'Instrument/Role', placeholder: 'Instruments/Roles'}
  ]

  

  // Check if we're on mobile
  const isMobile = ref(false)

  // Function to check mobile status
  function checkMobile() {
    if (typeof window !== 'undefined') {
      isMobile.value = window.innerWidth <= 767
    }
  }

  onMounted(() => {  

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





  function artistView(items) {
    let artistItems = {}
    items.forEach((item) => {
      item.work.forEach((work) => {
        work.artist.forEach((artist) => {
          let artistFound = true
          if (currentQuery.value) {
            if (!artist.artist_name.toLowerCase().includes(currentQuery.value.toLowerCase())) {
              console.log(artist.artist_name.toLowerCase(), currentQuery.value.toLowerCase(), artist.artist_name.toLowerCase().includes(currentQuery.value.toLowerCase()))
              artistFound = false
            }
          }
          if (artistFound) {
            const workRoleArtist = slugify(`${artist.artist_name} ${artist.artist_role} ${work.composer} ${work.title}`)
            if (workRoleArtist in artistItems) {
              artistItems[workRoleArtist]['numPerformances']++
            } else {
              artistItems[workRoleArtist] = {}
              artistItems[workRoleArtist]['artist'] = artist.artist_name
              artistItems[workRoleArtist]['role'] = artist.artist_role
              artistItems[workRoleArtist]['work'] = `${work.composer} / ${work.title}`
              artistItems[workRoleArtist]['numPerformances'] = 1
            }
          }
        })
      })
    })
    return artistItems
  }

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
    const resultsSection = document.querySelector('.eventsSearch__results')
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

  
  function toValue(value, range) {
      return [
        typeof value.min === "number" ? value.min * 1000 : range.min * 1000,
        typeof value.max === "number" ? value.max * 1000 : range.max * 1000,
      ];
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
  <div class="eventsSearch">
    <p-tabs :titles="['Performances', 'Artists', 'Works']">
      <template #tabpanel-1>
        <search-tab
          :index-name="'archived_performances'"
          :main-refinements="mainRefinements"
          :addl-refinements="addlRefinements"
          :sort-field="'performance_date'"
          :query-by-fields="'work, season, orchestra, venue, event_types, notes, event_title'"
          search-placeholder="Search by composer, work, conductor, orchestra, and more"
          results-title="Performances"
        >
          <template v-slot="{ items, showByWorks }">
            <div class="eventsSearch__resultsGrid">
              <template v-for="item, index in items">
                <template v-for="w, i in item.work.slice(0, 6)">
                  <!-- Header Row -->
                  <template v-if="index == 0 && i == 0">                  
                    <div class="eventsSearch__resultCell -header -first">Date/Season/Title</div>
                    <div class="eventsSearch__resultCell -header">Venue</div>
                    <div class="eventsSearch__resultCell -header">Orchestra</div>
                    <div class="eventsSearch__resultCell -header">Conductor</div>
                    <div class="eventsSearch__resultCell -header">Composer/Work</div>
                    <div class="eventsSearch__resultCell -header">Artist/Role</div>
                    <div class="eventsSearch__resultCell -header">View</div>
                  </template>
                  <!-- First row of an event -->
                  <template v-if="i == 0">
                    <div :class="`eventsSearch__resultCell -first ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length && (i + 1 == item.work.length || i == 5)) ? '-last' : ''}`">{{ formatDate(item.performance_date) }} / {{ item.season + (item.event_title ? " / " + item.event_title : "")}}</div>
                    <div :class="`eventsSearch__resultCell ${index % 2 == 0 ? '-even' : '-odd'} ${((index + 1 == items.length && (i + 1 == item.work.length || i == 5)) && (i + 1 == item.work.length || i == 5)) ? '-last' : ''}`">{{ item.venue }} {{ item.location.city }}, {{  item.location.state }}, {{ item.location.country }}</div>
                    <div :class="`eventsSearch__resultCell ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length && (i + 1 == item.work.length || i == 5)) ? '-last' : ''}`">{{ item.orchestra.join('; ')}}</div>
                    <div :class="`eventsSearch__resultCell ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length && (i + 1 == item.work.length || i == 5)) ? '-last' : ''}`">{{ w.artist.filter((artist) => artist.artist_role == 'Conductor').map((artist) => artist.artist_name).join('; ') }}</div>
                    <div :class="`eventsSearch__resultCell ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length && (i + 1 == item.work.length || i == 5)) ? '-last' : ''}`">{{ w.composer }} / {{ w.title }}</div>
                    <div :class="`eventsSearch__resultCell ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length && (i + 1 == item.work.length || i == 5)) ? '-last' : ''}`">{{ w.artist.filter((artist) => artist.artist_role != 'Conductor').map((artist) => artist.artist_name + '/' + artist.artist_role).join('; ') }}</div>
                    <div :class="`eventsSearch__resultCell ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length && (i + 1 == item.work.length || i == 5)) ? '-last' : ''}`">
                      <a :href="`/details?performanceId=${item.id}`">Details</a>
                      <a v-if="item.program_link" :href="item.program_link">Program</a>
                      <a v-if="item.media && item.media.includes('Audio')">Audio</a>
                    </div>
                  </template>
                  <!-- Additional event rows -->
                  <template v-else-if="i > 0 && i <= 4">
                    <div :class="`eventsSearch__resultCell -first ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length && (i + 1 == item.work.length || i == 5)) ? '-last' : ''}`"></div>
                    <div :class="`eventsSearch__resultCell ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length && (i + 1 == item.work.length || i == 5)) ? '-last' : ''}`"></div>
                    <div :class="`eventsSearch__resultCell ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length && (i + 1 == item.work.length || i == 5)) ? '-last' : ''}`"></div>
                    <div :class="`eventsSearch__resultCell ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length && (i + 1 == item.work.length || i == 5)) ? '-last' : ''}`">{{ w.artist.filter((artist) => artist.artist_role == 'Conductor').map((artist) => artist.artist_name).join('; ') }}</div>
                    <div :class="`eventsSearch__resultCell ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length && (i + 1 == item.work.length || i == 5)) ? '-last' : ''}`">{{ w.composer }} / {{ w.title }}</div>
                    <div :class="`eventsSearch__resultCell ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length && (i + 1 == item.work.length || i == 5)) ? '-last' : ''}`" v-if="w.artist.filter((artist) => artist.artist_role != 'Conductor').length < 3">{{ w.artist.filter((artist) => artist.artist_role != 'Conductor').map((artist) => artist.artist_name + '/' + artist.artist_role).join('; ') }}
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" v-if="w.has_recording">
                        <path d="M9.81086 5L6.92983 7.30483H4.625V10.7621H6.92983L9.81086 13.0669V5Z" stroke="#01ABE6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M12.4268 6.99365C12.9669 7.53393 13.2703 8.2666 13.2703 9.03054C13.2703 9.79449 12.9669 10.5272 12.4268 11.0674" stroke="#01ABE6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </div>
                    <div :class="`eventsSearch__resultCell ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length && (i + 1 == item.work.length || i == 5)) ? '-last' : ''}`" v-else>{{ w.artist.filter((artist) => artist.artist_role != 'Conductor').map((artist) => artist.artist_name + '/' + artist.artist_role).slice(0, 2).join('; ') }}
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" v-if="w.has_recording">
                        <path d="M9.81086 5L6.92983 7.30483H4.625V10.7621H6.92983L9.81086 13.0669V5Z" stroke="#01ABE6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M12.4268 6.99365C12.9669 7.53393 13.2703 8.2666 13.2703 9.03054C13.2703 9.79449 12.9669 10.5272 12.4268 11.0674" stroke="#01ABE6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                      <br/><a :href="`/details?performanceId=${item.id}`">More...</a></div>
                    <div :class="`eventsSearch__resultCell ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length && (i + 1 == item.work.length || i == 5)) ? '-last' : ''}`"></div>
                  </template>
                  <template v-else-if="i > 4">
                    <div :class="`eventsSearch__resultCell -first ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length && (i + 1 == item.work.length || i == 5)) ? '-last' : ''}`"></div>
                    <div :class="`eventsSearch__resultCell ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length && (i + 1 == item.work.length || i == 5)) ? '-last' : ''}`"></div>
                    <div :class="`eventsSearch__resultCell ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length && (i + 1 == item.work.length || i == 5)) ? '-last' : ''}`"></div>
                    <div :class="`eventsSearch__resultCell ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length && (i + 1 == item.work.length || i == 5)) ? '-last' : ''}`"></div>
                    <div :class="`eventsSearch__resultCell ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length && (i + 1 == item.work.length || i == 5)) ? '-last' : ''}`"><a :href="`/details?performanceId=${item.id}`">More...</a></div>
                    <div :class="`eventsSearch__resultCell ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length && (i + 1 == item.work.length || i == 5)) ? '-last' : ''}`"></div>
                    <div :class="`eventsSearch__resultCell ${index % 2 == 0 ? '-even' : '-odd'} ${(index + 1 == items.length && (i + 1 == item.work.length || i == 5)) ? '-last' : ''}`"></div>
                  </template>
                </template>
            </template>
            </div>
          </template>
        </search-tab>  
      </template>
      <template #tabpanel-2>
        <!-- <search-tab
          :index-name="'archived_artists'"
          :main-refinements="artistRefinements"
          :sort-field="'last_performance_date'"
          :query-by-fields="'artist_name, artist_role, work_title'"
          search-placeholder="Search by conductor, soloist, ensemble, instruument, or role"
          results-title="Artists"
        >
          <template v-slot="{ items }">
            <div class="eventsSearch__artistGrid">
                <div>Artist</div>
                <div>Instrument/Role</div>
                <div>Composer/Work</div>
                <div># of Performances</div>
              </div>
              <div v-for="item, index in items">
                <div :class="`eventsSearch__artistGrid ${index % 2 == 0 ? '-even' : '-odd'}`">
                  <div>{{ item.artist_name }}</div>
                  <div>{{ item.artist_role }}</div>
                  <div>{{ item.work_title }}</div>
                  <div>{{ item.num_performances }}</div>
                </div>
              </div>
          </template>
        </search-tab>   -->
      </template>

      <template #tabpanel-3>
        <h3>Consectetur odit distinctio beatae!</h3>
        <p>Ipsum eaque ipsam asperiores consequatur est libero. Incidunt distinctio non quae veniam illum Laborum est harum sapiente vel suscipit maiores? Dicta quo velit eos ab distinctio, delectus! Autem sunt aperiam!</p>
      </template>
    </p-tabs>
  </div>


</template>



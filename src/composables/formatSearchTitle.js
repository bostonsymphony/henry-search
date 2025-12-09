export default function formatSearchTitle(state) {
    let searchName = state.query ? '"' + state.query + '"' : ""
    if (state.refinementList) {
        Object.entries(state.refinementList).forEach(([k1, v1]) => {
            if (searchName != "") {
                searchName += "; "
            }
            if (Array.isArray(v1)) {
                searchName += " " + v1.join(", ") 
            } else {
                searchName += " " + v1;
            }
            
        })
    }
    if (state.menu) {
        Object.entries(state.menu).forEach(([k1, v1]) => {
            if (searchName != "") {
                searchName += "; "
            }
            if (Array.isArray(v1)) {
                searchName += " " + v1.join(", ") 
            } else {
                searchName += " " + v1;
            }
        })
    }
    if (state.range) {
        Object.entries(state.range).forEach(([k1, v1]) => {
            const dateRange = v1.split(':');
            if (searchName != "") {
                searchName += "; "
            }
            searchName += " " + formatDate(dateRange[0]) + " to " + ( dateRange[1].length ? formatDate(dateRange[0]) : "Present" );
        })
    }
    
    return searchName.trim()
}
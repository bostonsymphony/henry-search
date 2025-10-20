export default function formatDate(unix_timestamp, detail = false) {
    // multiplied by 1000 so that the argument is in milliseconds, not seconds
    const date = new Date(unix_timestamp * 1000)
    const days = ["Sun", "Mon", "Tues", "Weds", "Thurs", "Fri", "Sat"]
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    const hour = date.getHours() + 1 > 12 ? date.getHours() - 11 : date.getHours() + 1
    const amPm = date.getHours() + 1 > 12 ? "pm" : "am"
    const minutes = "0" + date.getMinutes()

    if (detail) {
        return `${days[date.getDay()]}, ${(months[date.getMonth()]).substring(0, 3)} ${date.getDate()}, ${hour}:${minutes.substr(-2)}${amPm} EDT`
    } else {
        return `${date.getMonth() + 1}-${date.getDay() + 1}-${date.getFullYear()}`
    }
}
// // currently unused/unfinished
// function crawl() {
//   const interestedLocations = [
//     // 'Centre Hospitalier Universitaire  Dupuytren 1',
//     'Polyclinique de Limoges  - Site Chenieux',
//     // 'Polyclinique de Limoges - Emailleurs',
//   ]

//   // 1. Open locations dialogue
//   const button = document.querySelector('.Tappable-inactive.dl-button-info-link.dl-button.dl-button-size-normal') as
//     | HTMLElement
//     | undefined
//   button?.click()

//   // 2. Select a location
//   const locations = document.querySelectorAll(
//     '.booking-places-modal-left.dl-layout-item.dl-layout-size-xs-12 > *'
//   ) as NodeListOf<HTMLElement>
//   for (const location of locations) {
//     const name = location.querySelector('.dl-text.dl-text-body.dl-text-bold.dl-text-s')?.textContent ?? ''
//     if (interestedLocations.indexOf(name) !== -1) location.click()
//   }

//   // 3. Select consultation if needed
//   const motives = document.getElementById('booking_motive') as HTMLSelectElement | null
//   if (motives !== null) {
//     for (let i = 0; i < motives.options.length; ++i) {
//       console.log(motives.options[i].textContent)
//       if (motives.options[i].textContent === '1ère injection vaccin COVID-19 (Pfizer-BioNTech)') {
//         motives.selectedIndex = i
//         console.log(motives.selectedIndex)
//         break
//       }
//     }
//   }
// }

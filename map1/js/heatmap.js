// Basic map setup---------------------------------------------------------------------
let map = L.map('map').setView([58.373523, 26.716045], 12)

// Raster tile layer-------------------------------------------------------------------
const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: 'OpenStreetMap contributors',
})

osm.addTo(map)

// other functions--------------------------------------------------------------

// default map settings
function defaultMapSettings() {
  map.setView([58.373523, 26.716045], 12)
}


// Vector layer for Tartu city cell towers---------------------------------------------
function createCircle(feature, latlng) {
  let options = {
    radius: 5,
    fillColor: 'red',
    fillOpacity: 0.5,
    color: 'red',
    weight: 1,
    opacity: 1,
  }
  return L.circleMarker(latlng, options)
}

// add geoJSON layer
async function addCelltowersGeoJson(url) {
  const response = await fetch(url)
  const data = await response.json()
  const markers = L.geoJson(data,{
    pointToLayer: createCircle,
  })  
  const clusters = L.markerClusterGroup()
  clusters.addLayer(markers)
  clusters.addTo(map)
}
addCelltowersGeoJson('geojson/tartu_city_celltowers_edu.geojson')

//------------------------------------------------------------------------------
// add geoJSON layer
// async function addGeoJson(url) {
//   const response = await fetch(url)
//   const data = await response.json()
// //   console.log(data.features[0])
//   console.log(data.features[0].geometry.coordinates)
//   console.log(data.features[0].properties.area)
// }

async function addGeoJson(url) {
  const response = await fetch(url)
  const data = await response.json()
  const heatData = data.features.map(heatDataConvert)
//   console.log(heatData)
  const heatMap = L.heatLayer(heatData, { radius: 10 })
  heatMap.addTo(map)
}

function heatDataConvert(feature) {
  return [
    feature.geometry.coordinates[1],
    feature.geometry.coordinates[0],
    feature.properties.area,
  ]
}

addGeoJson('geojson/tartu_city_celltowers_edu.geojson')

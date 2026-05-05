//------------------------------------------------------------------------------------------------
// Import all functions from turfPractice
import * as turfPractice from "./turfPractice.js"

// import layers.js
import * as layers from "./layers.js"

//-----------------------------------------------------------------------------------------
let map = L.map('map', {
  center: [58.373523, 26.716045],//Tartu
        //[58.374, 26.715], //Vanemuise 46
  zoom: 12, //18, 
  zoomControl: true // Disable default zoom control
})
map.createPane('customDistrictsPane')
map.getPane('customDistrictsPane').style.zIndex = 390

map.zoomControl.setPosition('topright')

// Default map settings
function defaultMapSettings() {
  map.setView(
    [58.373523, 26.716045], 12)
}

//-----------------------------------------------------------------------------------------
// add Hurda park points, lines and polygons
turfPractice.turfFunctions(map)
//-----------------------------------------------------------------------------------------

// define base layers------------------------------------------------------------------------------------------------
const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: 'OpenStreetMap contributors'
})

osmLayer.addTo(map)

const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  attribution: 'Esri, Maxar, Earthstar Geographics, and the GIS community',
  maxZoom: 19
})

const topoLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
  maxZoom: 17,
  attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)'
})


let districtsLayer
let choroplethLayer
let heatMapLayer
let markersLayer

//------------------------------------------------------------------------------------------------
// Districts GeoJSON with styling ----------------------------------------------------------------
async function loadDistrictsLayer() {
  try {
    const response = await fetch('geojson/tartu_city_districts_edu.geojson')
    const data = await response.json()
    
    districtsLayer = L.geoJson(data, {
      style: function(feature) {
        return {
          fillColor: getDistrictColor(feature.properties.OBJECTID),
          fillOpacity: 0.5,
          weight: 1,
          opacity: 1,
          color: 'grey'
        }
      },
      onEachFeature: function(feature, layer) {
        layer.bindPopup(feature.properties.NIMI || 'District ' + feature.properties.OBJECTID)
      },
      pane: 'customDistrictsPane'
    })
  } catch (error) {
    console.error("Error loading districts data:", error)
  }
}

// function to color the layer 
function getDistrictColor(id) {
  switch (id) {
    case 1: return '#ff0000'
    case 13: return '#009933'
    case 6: return '#0000ff'
    case 7: return '#ff0066'
    default: return '#ffffff'
  }
}

//------------------------------------------------------------------------------------------------
// Choropleth layer
async function loadChoroplethLayer() {
  try {
    const response = await fetch('geojson/tartu_city_districts_edu.geojson')
    const data = await response.json()
    
    choroplethLayer = L.choropleth(data, {
      valueProperty: 'OBJECTID',
      scale: ['#e6ffe6', '#004d00'],
      steps: 11,
      mode: 'q',
      style: {
        color: '#fff',
        weight: 2,
        fillOpacity: 0.8,
      },
      onEachFeature: function(feature, layer) {
        layer.bindPopup('Value: ' + feature.properties.OBJECTID)
      },
      pane: 'customDistrictsPane'
    })
  } catch (error) {
    console.error("Error loading choropleth data:", error)
  }
}

//------------------------------------------------------------------------------------------------
// Heat Map Layer
async function loadHeatMapLayer() {
  try {
    const response = await fetch('geojson/tartu_city_celltowers_edu.geojson')
    const data = await response.json()
    
    const heatData = data.features.map(function(feature) {
      return [
        feature.geometry.coordinates[1],
        feature.geometry.coordinates[0],
        feature.properties.area || 1
      ]
    })
    
    heatMapLayer = L.heatLayer(heatData, {
      radius: 20,
      blur: 15,
      maxZoom: 17,
    })

  } catch (error) {
    console.error("Error loading heatmap data:", error)
  }
}

//------------------------------------------------------------------------------------------------
// Cell Towers - Markers with Clusters
async function loadMarkersLayer() {
  try {
    const response = await fetch('geojson/tartu_city_celltowers_edu.geojson')
    const data = await response.json()
    
    const geoJsonLayer = L.geoJson(data, {
      pointToLayer: function(feature, latlng) {
        return L.circleMarker(latlng, {
          radius: 5,
          fillColor: 'red',
          fillOpacity: 0.5,
          color: 'red',
          weight: 1,
          opacity: 1
        })
      },
      onEachFeature: function(feature, layer) {
        if (feature.properties) {
          layer.bindPopup('Cell Tower<br>Area: ' + (feature.properties.area || 'Unknown'))
        }
      }
    })
    
    markersLayer = L.markerClusterGroup()
    markersLayer.addLayer(geoJsonLayer)
  } catch (error) {
    console.error("Error loading markers data:", error)
  }
}

//------------------------------------------------------------------------------------------------
//a function to load WMS layers
function loadWmsLayers(layersList, overlayLayers, activeWmsLayers ) {

  layersList.forEach(layer => {
    let paneName = `${layer.layers}-pane`
    map.createPane(paneName)
    map.getPane(paneName).style.zIndex = layer.zIndex

    let newLayer = L.tileLayer.wms(layer.url, {
      version: layer.version,
      layers: layer.layers,
      format: layer.format,
      transparent: layer.transparent,
      zIndex: layer.zIndex,
      pane: paneName,
    })

    // add each layer to overlayLayers object to display them in layers list menu
    overlayLayers[layer.title.en] = newLayer
    
    // add each layer to an object of WMS layers
    activeWmsLayers[layer.layers] = false

  })
  
  // console.log(activeWmsLayers)
  
}

// layers list panel ------------------------------------------------------------------------------------------------
const baseLayers = {
  "OpenStreetMap": osmLayer,
  "Satellite": satelliteLayer,
  "Topographic": topoLayer
}


//------------------------------------------------------------------------------------------------
async function initializeLayers() {

    await Promise.all([
    loadDistrictsLayer(),
    loadChoroplethLayer(),
    loadHeatMapLayer(),
    loadMarkersLayer()
    ])

  const overlayLayers = {
    "Tartu districts": districtsLayer,
    "Choropleth layer": choroplethLayer,
    "Heatmap": heatMapLayer,
    "Markers": markersLayer
  }
  
  loadWmsLayers(layers.wmsLayers, overlayLayers, activeWmsLayers)
  

  //define the options for layers control
  const layerControlOptions = {
    collapsed: false,
    position: 'topleft'
  }


  const layerControl = L.control.layers(baseLayers, overlayLayers, layerControlOptions)
  layerControl.addTo(map)
  osmLayer.addTo(map)
//   heatMapLayer.addTo(map)
//   console.log(map)
}

// then call the function to execute it
initializeLayers()

// districtsLayer.addTo(map)



// ------------------------------------------------------------------------------------------------
//  track, which WMS layers are currently active
function toggleActiveState(layerId, boolean) {
  // check if layer name's value is of type boolean, then we know this layer is present in the list
  if (typeof(activeWmsLayers[layerId]) == "boolean") {
    activeWmsLayers[layerId] = boolean // update the value to new one
  }
}


let activeWmsLayers = {}

map.on('overlayadd', (event) => {
  // layerId: event.layer.options.layers;
  toggleActiveState(event.layer.options.layers, true);
  // console.log(activeWmsLayers)
  // console.log('overlayadd event fired')
  // console.log(event)
})

// another event handler
map.on('overlayremove', (event) => {
  // layerId: event.layer.options.layers;
  toggleActiveState(event.layer.options.layers, false);
  // console.log(activeWmsLayers)
})


// query an active WMS layer by clicking on it
map.on('click', function(event) {
  Object.entries(activeWmsLayers).forEach(([key, value]) => {
    // console.log(value)
    if (value == true) {
      const url = buildRequestUrl(event,'https://landscape-geoinformatics.ut.ee/geoserver/pa2023/wms?', key)
      fetchWmsData(url, key)

      document.getElementById('info-box').style.display = 'block'

      document.getElementById('info-close').addEventListener('click', () => {
        document.getElementById('info-box').style.display = 'none'
      })

      // reset info window text on each click
      const infoWindowContent = document.getElementById('info-content')
      infoWindowContent.innerHTML = ""
    }
  })
})


// a function that will build the full request url
function buildRequestUrl(e, baseUrl, layerName) {
  // build a bounding box for the current map view
  const bounds = map.getBounds()
  const bbox = [
    bounds.getWest(),
    bounds.getSouth(),
    bounds.getEast(),
    bounds.getNorth()
  ].join(',')

  // get size values from map object
  const size = map.getSize()
  const sizeX = size.x
  const sizeY = size.y

  // get x and y points and round them to avoid strange errors
  const xPoint = Math.floor(e.containerPoint.x)
  const yPoint = Math.floor(e.containerPoint.y)

  // WMS endpoint and request parameters
  const wmsUrl = baseUrl
  const params = new URLSearchParams({
    service: 'WMS',
    version: '1.1.1',
    request: 'GetFeatureInfo',
    query_layers: layerName,
    layers: layerName,
    info_format: 'application/json',
    x: xPoint,
    y: yPoint,
    srs: 'EPSG:4326',
    width: sizeX,
    height: sizeY,
    bbox: `${bbox}`
  })

  return wmsUrl + params
}


// a fn that will fetch the data:
function fetchWmsData(fullUrl, layerName) {
  fetch(fullUrl)
  .then(response => response.json())
  .then(data => {
    // console.log('fetched data')
    // console.log(data)

    // fetch the element that will hold the request data
    const content = document.getElementById('info-content')

    // condition that runs the code only if there is at least one feature in the results
    if (data.features && data.features.length > 0) {
      const feature = data.features[0]
      const props = feature.properties

      // show the title of the layer
      let html = `<h4>${getLayerName(layers.wmsLayers, layerName)}</h4><ul>`

      // show each entry in properties by looping through them
      for (const key in props) {
        // display properties as a list
        html += `<li><strong>${key}:</strong> ${props[key]}</li>`
      }
      // close the unordered list
      html += '</ul>'
      // update the content of the element by adding the new html
      content.innerHTML += html
    } else {
      // fallback message to show
      content.innerHTML += `<em>No features found for ${getLayerName(data, layerName)}</em><br>`
    }

  })
  .catch(error => {
    console.error('Request failed:', error)
  })
}


// fn to get layer title name
function getLayerName(layersData, layerName){
    const layer = layersData.filter((entry => entry.layers == layerName))
    console.log(layer[0])
    console.log(layer[0].title.en)
    // console.log(layer)
    return layer[0].title.en
}

//------------------------------------------------------------------------------------------------

export { defaultMapSettings }

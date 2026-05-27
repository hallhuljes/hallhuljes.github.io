import { pointsCollection } from "../js/points.js"

// -------------------------------------------------------------
function turfFunctions(map){

    // define point coordinates
    const pointCoords = [26.71552, 58.37393]
    const myPoint = turf.point(pointCoords) // define a point
    const geoJSON_point = L.geoJSON(myPoint) // convert the point to geoJSON object
    geoJSON_point.addTo(map) // add the geoJSON object to the map

    //another point next to the pond
    const pointCoords2 = [26.71489, 58.37439]
    const myPoint2 = turf.point(pointCoords2)
    const geoJSON_point2 = L.geoJSON(myPoint2)
    geoJSON_point2.addTo(map)

    //another point (for envelope exercise)
    const pointCoords3 = [26.71216, 58.37428]
    const myPoint3 = turf.point(pointCoords3)
    const geoJSON_point3 = L.geoJSON(myPoint3)
    // geoJSON_point3.addTo(map)

//-----------------------------------------------
    // define line coordinates
    const lineCoords = [
    [26.71379, 58.37476],
    [26.71554, 58.37349],
    [26.71553, 58.37434],
    [26.71630, 58.37378],
    [26.71473, 58.37407]
    ]

    // define the line object
    const myLine = turf.lineString(lineCoords)
    const geoJSON_line = L.geoJSON(myLine)
    geoJSON_line.addTo(map)

//-----------------------------------------------

    // define polygon coordinates
    const polygonCoords = [[
    [26.71355, 58.37468],
    [26.71404, 58.37430],
    [26.71433, 58.37429],
    [26.71550, 58.37345],
    [26.71660, 58.37388],
    [26.71615, 58.37420],
    [26.71589, 58.37431],
    [26.71552, 58.37461],
    [26.71521, 58.37496],
    [26.71480, 58.37481],
    [26.71449, 58.37502],
    [26.71355, 58.37468]
    ]]

    // define polygon object
    const myPolygon = turf.polygon(polygonCoords)
    const geoJSON_polygon = L.geoJSON(myPolygon)
    geoJSON_polygon.addTo(map)


//-----------------------------------------------
    // object that contains measurement units
    const options = { units: 'meters' }

    // calvulate distance between the two points
    // replace point1 and point2 with the actual names you used to define your Turf points
    const distance = turf.distance(myPoint, myPoint2, options)
    const roundedToTwoDecimals = Math.round(distance*100)/100
    console.log(`distance is ${roundedToTwoDecimals} meters`)

    // polygon area
    const areaMeasurement = turf.area(myPolygon)
    const areaRounded = Math.round(areaMeasurement)
    console.log(`Area without rounding: ${areaMeasurement}`)
    console.log(`Rounded area is ${areaRounded} square meters`)


    // buffers -----------------------------------------------------------------
    // buffer for Statue point
    const statueBuffer = turf.buffer(myPoint, 20, {units: 'meters'})
    // L.geoJSON(statueBuffer).addTo(map)

    // buffer for line
    const lineBuffer = turf.buffer(myLine, 20, {units: 'meters'})
    // L.geoJSON(lineBuffer).addTo(map)
    
    // buffer for polygon
    const polyBuffer = turf.buffer(myPolygon, 20, {units: 'meters'})
    // L.geoJSON(polyBuffer).addTo(map)    

    // negative buffer for polygon
    const parkBufferNegative = turf.buffer(myPolygon, -10, {units: 'meters'})
    // L.geoJSON(parkBufferNegative).addTo(map)  

    
    // ENVELOPE //-----------------------------------------------------------------------------
    // create a feature collection
    const features = turf.featureCollection([myPoint, myPoint3, myLine, myPolygon])
    // create the envelope
    const enveloped = turf.envelope(features)
    // add to map
    // L.geoJSON(enveloped).addTo(map)

    //------------------------------------------------------------------------------------------
    // points from imported points collections
    const points = turf.points(pointsCollection)
    // L.geoJSON(points).addTo(map)


    //------------------------------------------------------------------------------------------
    // points within polygon
    const pointsWithinBorders = turf.pointsWithinPolygon(points, myPolygon)
    // this should log an object that contains all the features within the park polygon
    console.log(pointsWithinBorders)
    // L.geoJSON(pointsWithinBorders).addTo(map)

    //------------------------------------------------------------------------------------------
    // voronoi polygons around public hiding places
    // bounding box:
    const bbox = [26.680,58.365,26.738, 58.379]

    // create 10 random points
    const randomPoints = turf.randomPoint(10, { bbox })

    // show random points on map
    L.geoJSON(randomPoints,{
    pointToLayer: function(feature, latlng) {
        return L.circleMarker(latlng, {
            radius: 6,
            fillColor: 'red',
            color: 'red',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.9})}
        }).addTo(map)

    // create voronoi polygons
    const voronoiPolygons = turf.voronoi(randomPoints, { bbox })

    // add polygons to map
    L.geoJSON(voronoiPolygons, {
        style: {
            color: 'purple',
            weight: 2,
            fillColor: 'violet',
            fillOpacity: 0.2
        }
    }).addTo(map)

    //------------------------------------------------------------------------------------------
    // event listener 
    map.on('click', function(event) { 
        // console.log(event) 
        console.log(`[${event.latlng.lng}, ${event.latlng.lat}]`)
        // console.log('[', event.latlng.lng, ',', event.latlng.lat, ']')

    // add point to the place where clicked
        // // define coordinates of the point
        // let pointCoords = [event.latlng.lng, event.latlng.lat]
        // // create a turf point
        // let turfPoint = turf.point(pointCoords)
        // // convert the point to GeoJSON format and add it to the map
        // L.geoJSON(turfPoint).addTo(map)
    })


}

export { turfFunctions }
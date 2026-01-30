const protocol = new pmtiles.Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);



// Configuration de la carte
var map = new maplibregl.Map({
container: 'map',
style: 'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json', // Fond de carte
customAttribution : '<a href="https://sites-formations.univ-rennes2.fr/mastersigat/"target="_blank">Master SIGAT</a>',  
center: [-1.67, 48.11], // lat/long
zoom: 11.5, // zoom
pitch: 0, // Inclinaison
bearing: 0, // Rotation
minZoom:11.5
});


// Boutons de navigation
var nav = new maplibregl.NavigationControl();
map.addControl(nav, 'top-left');


// Ajout Echelle cartographique
map.addControl(new maplibregl.ScaleControl({
maxWidth: 120,
unit: 'metric'}));

let pitched = false;

map.on('zoom', () => {
  const zoom = map.getZoom();

  if (zoom >= 15 && !pitched) {
    map.easeTo({ pitch: 60, duration: 800 });
    pitched = true;
  }

  if (zoom < 15 && pitched) {
    map.easeTo({ pitch: 0, duration: 800 });
    pitched = false;
  }
});

// Debut de chargement des couches
map.on('load', function () {
  


  
  // Ajout du PLUI via un PMTILES
  
map.addSource("PLUsource", {
type: "vector",
url: "pmtiles://https://raw.githubusercontent.com/ninanoun/datasigat/main/PLUIRM.pmtiles"
});
    
map.addLayer({
id: "PLU",
type: "fill",
source: "PLUsource",
'source-layer': "PLUIRM",
layout: {'visibility': 'none'},
paint: {'fill-color': ['match',['get', 'typezone'],
                                  'U', 'red',
                                  'N', 'green',
                                  'A', 'Yellow',
                                  'Ah', 'orange',
                                  '#ccc'],
        'fill-outline-color': 'white',
        "fill-opacity": 0.8}
});
  

    // AJOUT DU CADASTRE ETALAB
map.addSource('Cadastre', {
type: 'vector',
url: 'https://openmaptiles.geo.data.gouv.fr/data/cadastre.json' });
  
map.addLayer({
'id': 'Cadastre',
'type': 'line',
'source': 'Cadastre',
'source-layer': 'parcelles',  
'layout': {'visibility': 'none'},
'paint': {'line-color': '#000000', 'line-width':0.5},
'minzoom':15, 'maxzoom':19 }); 
  
  
  // Ajout BDTOPO
map.addSource('BDTOPO', {
type: 'vector',
url: 'https://data.geopf.fr/tms/1.0.0/BDTOPO/metadata.json',
minzoom: 12,
maxzoom: 19
});
  
 map.addLayer({
'id': 'vegetation',
'type': 'fill',
'source': 'BDTOPO',
'layout': {'visibility': 'visible'}, 
'source-layer': 'zone_de_vegetation',
'paint': {'fill-color': '#32cd32 ',
'fill-opacity': 0.90},
 'minzoom': 15 
});
  
map.addLayer({
'id': 'batiments',
'type': 'fill-extrusion',
'source': 'BDTOPO',
'source-layer': 'batiment',
'layout': {'visibility': 'visible'},
'paint': {'fill-extrusion-color': '#A9A9A9',
'fill-extrusion-height':{'type': 'identity','property': 'hauteur'},
'fill-extrusion-opacity': 0.90,
'fill-extrusion-base': 0},
'minzoom': 15  
});
  
 
  
    // Ajout ADMINEXPRESS
map.addSource('ADMIN_EXPRESS', {
type: 'vector',
url: 'https://data.geopf.fr/tms/1.0.0/ADMIN_EXPRESS/metadata.json',
minzoom: 1,
maxzoom: 19
});
  
map.addLayer({
'id': 'Commune',
'type': 'line',
'source': 'ADMIN_EXPRESS',
'source-layer': 'commune',  
'layout': {'visibility': 'visible'},
'paint': {'line-color': '#000000', 'line-width':1}});
  
  
  // PLU
  
  map.addLayer({
id: "PLUcontour",
type: "line",
source: "PLUsource",
"source-layer": "PLUIRM",
'layout': {'visibility': 'none'},
paint: {'line-color': 'white',
        "line-width": {'stops': [[12, 0.3], [20, 1]]}}
});
  
  
  
    // Ajout lignes de metros
map.addSource('lignes', {
type: 'geojson',
data: 'https://raw.githubusercontent.com/ninanoun/datasigat/refs/heads/main/tracemetrorennes.geojson'
});
  
map.addLayer({
'id': 'lignesmetros',
'type': 'line',
'source': 'lignes',
'layout': {'visibility': 'visible'},  
'paint': {'line-width': 5,
          'line-color': ['match',['get', 'ligne'],
                                  'a', 'red',
                                  'b', 'green',
                                  '#ccc']}
}); 
  
  
  // Appel des VLS
  
  
  $.getJSON('https://data.explore.star.fr/api/explore/v2.1/catalog/datasets/vls-stations-etat-tr/records?limit=60', 
function(data) {var geojsonDataA = {
type: 'FeatureCollection',
features: data.results.map(function(element) {
return {type: 'Feature',
geometry: {type: 'Point',
coordinates: [element.coordonnees.lon, element.coordonnees.lat]},
properties: { name: element.nom,
              nbvelos: element.nombreemplacementsdisponibles,
              nbsocles: element.nombreemplacementsactuels}};
})
};
map.addLayer({ 'id': 'VLS',
'type':'circle',
'source': {'type': 'geojson',
'data': geojsonDataA},
'layout': {'visibility': 'none'},
'paint': {'circle-color': 'blue', 'circle-radius':4}
});
});
  
  // Ajout des parcs relais
  
  $.getJSON('https://data.rennesmetropole.fr/api/explore/v2.1/catalog/datasets/tco-parcsrelais-star-etat-tr/records?limit=20', 
function(data) {var geojsonData4 = {
type: 'FeatureCollection',
features: data.results.map(function(element) {
return {type: 'Feature',
geometry: {type: 'Point',
coordinates: [element.coordonnees.lon, element.coordonnees.lat]},
properties: { name: element.nom,
              capacity: element.jrdinfosoliste}};
})
};
map.addLayer({ 'id': 'Parcrelais',
'type':'circle',
'source': {'type': 'geojson',
'data': geojsonData4},
'paint': {'circle-color': '#4567ae', 'circle-radius':6, 'circle-stroke-color': 'white', 'circle-stroke-width': 2}
});
});

  
  
  
  // Fin du map ON
});




//Interactivité HOVER
var popup = new maplibregl.Popup({
className: "Mypopup",  
closeButton: false,
closeOnClick: false });
map.on('mousemove', function(e) {
var features = map.queryRenderedFeatures(e.point, { layers: ['Parcrelais'] });
// Change the cursor style as a UI indicator.
map.getCanvas().style.cursor = (features.length) ? 'pointer' : '';
if (!features.length) {
popup.remove();
return; }
var feature = features[0];
popup.setLngLat(feature.geometry.coordinates)
.setHTML(
  '<h4>' + feature.properties.name + '</h4>' +
  '<p><strong>Places disponibles :</strong> ' +
  feature.properties.capacity +
  '</p>'
).addTo(map);
});


map.on('click', (e) => {
  const features = map.queryRenderedFeatures(e.point, {
    layers: ['VLS']
  });

  if (!features.length) return;

  const feature = features[0];

  new maplibregl.Popup({ className: "Mypopup2",  
                         offset: [0, -15] })
    .setLngLat(feature.geometry.coordinates)
    .setHTML('<h2>' + feature.properties.name + '</h2>' +
      feature.properties.nbvelos + 'vélos disponibles' + '<br>' +
      feature.properties.nbsocles + 'socles disponibles')
    .addTo(map);
});



// Fonction switchlayer
        switchlayer = function (lname) {
            if (document.getElementById(lname).checked) {
                map.setLayoutProperty(lname, 'visibility', 'visible');
            } else {
                map.setLayoutProperty(lname, 'visibility', 'none');
           }
        }


    // Configuration onglets géographiques 

document.getElementById('Rennes').addEventListener('click', function () 
{ map.flyTo({zoom: 12,
           center: [-1.672, 48.1043],
	          pitch: 0,
            bearing:0 });
});

document.getElementById('Gare').addEventListener('click', function () 
{ map.flyTo({zoom: 16,
           center: [-1.672, 48.1043],
	          pitch: 20,
            bearing: -197.6 });
});


document.getElementById('Rennes1').addEventListener('click', function () 
{ map.flyTo({zoom: 16,
           center: [-1.6396, 48.1186],
	          pitch: 20,
            bearing: -197.6 });
});

document.getElementById('Rennes2').addEventListener('click', function () 
{ map.flyTo({zoom: 16,
           center: [-1.7023, 48.1194],
	          pitch: 30,
            bearing: -197.6 });
});
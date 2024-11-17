// Create a map object
const map = L.map('map', {
    zoomControl: false
}).setView([48.5, 6.0], 8);
let tileLayer; // Declare tileLayer variable here
let geoJsonLayer; // Declare geoJsonLayer variable here
let currentStep = 0;

// Load GeoJSON data from file
$.ajax({
    type: 'GET',
    url: '/epci_ml.geojson',
    dataType: 'json',
    success: function (data) {
        geoJsonData = data; // Store the GeoJSON data in a variable

        // Add OpenStreetMap layer
        tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
            subdomains: ['a', 'b', 'c'],
            opacity: 0.5
        }).addTo(map);

        // Apply grayscale filter to tile layer
        const tilePane = map.getPane('tilePane');
        tilePane.style.filter = 'grayscale(100%)';

        // Create the geoJsonLayer
        geoJsonLayer = L.geoJSON(geoJsonData, {
            style: getBlackStyle,
            onEachFeature: bindPopup
        }).addTo(map);

        // Initialize buttons
        $('#next-button').on('click', nextStep);
        $('#prev-button').on('click', prevStep);

        // Show initial map
        map.fitBounds(geoJsonLayer.getBounds());
    }
});

// Helper function to get GeoJSON style
function getGeoJsonStyle(feature) {
    let color;
    switch (feature.properties.forme_epci) {
        case 'Rural autonome':
            color = 'lightgreen';
            break;
        case 'Rural p\u00e9riurbain':
            color = 'lightslategray';
            break;
        case 'Urbain':
            color = 'DarkOliveGreen';
            break;
        default:
            color = 'black';
    }
    return {
        weight: 0,
        opacity: 0.5,
        color: 'black',
        fillOpacity: 0.3,
        fillColor: color
    };
}

// Helper function to bind popup to feature
function bindPopup(feature, layer) {
    layer.bindPopup(feature.properties.nom_complet);
}

// Helper function to update tile layer opacity
function updateTileLayerOpacity() {
    const mapBounds = map.getBounds();
    const tileBounds = tileLayer._map.getBounds();
    tileLayer.setOpacity(mapBounds.intersects(tileBounds) ? 0.2 : 0);
}

// Helper function to get black style
function getBlackStyle(feature) {
    return {
        weight: 2,
        opacity: 0.5,
        color: 'black',
        fillOpacity: 0.3,
        fillColor: 'black'
    };
}

// Function to show colored map
function showColoredMap() {
    geoJsonLayer.setStyle(function (feature) {
        return getGeoJsonStyle(feature);
    });
}

// Function to show intro text
function showIntroText() {
    $('#intro-text').fadeIn();
}

// Function to show presentation text
function showPresentationText() {
    $('#presentation-text').fadeIn();
}

// Function to show presentation text
function showHeatmapText() {
    $('#heatmap-text').fadeIn();
}
// Function to hide intro text
function hideIntroText() {
    $('#intro-text').fadeOut();
}

// Function to hide presentation text
function hidePresentationText() {
    $('#presentation-text').fadeOut();
}
// Function to show presentation text
function hideHeatmapText() {
    $('#heatmap-text').fadeOut();
}

// Function to show population percentage dots
function showPopulationDots() {
    geoJsonLayer.eachLayer(function (layer) {
        const feature = layer.feature;
        const percentage = feature.properties.pop_percentage;
        const radius = Math.max(percentage * 5); // adjust the radius based on the percentage
        const dot = L.circleMarker(layer.getBounds().getCenter(), {
            radius: radius,
            color: 'black',
            weight: 1,
            opacity: 0.5,
            fillOpacity: 0.5,
            fillColor: 'black',
            zIndexOffset: 1000 - radius // smaller circles appear on top
        });
        const tooltipText = `${feature.properties.nom_complet} <br> Part de la pop. rég. ${percentage}%`;
        dot.bindTooltip(tooltipText, {
            permanent: false,
            direction: 'center',
            className: 'custom-tooltip'
        });
        dot.addTo(map);
    });
}

// Function to show heatmap
function showHeatmap() {
    geoJsonLayer.setStyle(function (feature) {
        const maxConso = feature.properties.total_conso_2022;
        let color;
        if (maxConso < 421000) {
            color = '#edbb99';
        } else if (maxConso < 665000) {
            color = '#dc7633';
        } else {
            color = '#a04000';
        }
        return {
            weight: 0,
            opacity: 0.5,
            color: 'black',
            fillOpacity: 0.5,
            fillColor: color
        };
    });

    geoJsonLayer.eachLayer(function (layer) {
        const feature = layer.feature;
        const tooltipText = `${feature.properties.nom_complet}<br>Conso. 2022: ${feature.properties.total_conso_2022} MWh <br>Conso. par hab.: ${feature.properties.per_capita_conso_2022} MWh`;
        layer.bindTooltip(tooltipText, {
            permanent: false,
            direction: 'center',
            className: 'custom-tooltip'
        });
    });
}


// Function to show population dots and heatmap
function showPopulationDotsAndHeatmap() {
    showPopulationDots();
    showHeatmap();
}



// Function to show heatmap based on ratioenr
function showRatioenrHeatmap() {
    geoJsonLayer.setStyle(function (feature) {
        const ratioenr = feature.properties.ratioenr_2022;
        let color;
        if (ratioenr < 17) {
            color = '#e8f6f3';
        } else if (ratioenr < 23) {
            color = '#a3e4d7';
        } else if (ratioenr < 37) {
            color = '#45b39d';
        } else if (ratioenr < 100) {
            color = '#229954';
        } else {
            color = '#145a32';
        }
        return {
            weight: 0,
            opacity: 0.5,
            color: 'black',
            fillOpacity: 0.5,
            fillColor: color
        };
    });

    geoJsonLayer.eachLayer(function (layer) {
        const feature = layer.feature;
        const tooltipText = ` ${feature.properties.nom_complet}<br>Ratio enr: ${feature.properties.ratioenr_2022}`;
        layer.bindTooltip(tooltipText, {
            permanent: false,
            direction: 'center',
            className: 'custom-tooltip'
        });
    });
}

// Function to show heatmap based on production
function showProductionHeatmap() {
    const productionMenu = `
        <div class="radiogroup">
            <div class="wrapper">
            <input class="state" type="radio" name="production-type" id="total_prod_2022" value="total_prod_2022" checked>
            <label class="label" for="total_prod_2022">
            <div class="indicator"></div>
            <span class="text">Total produit en 2022</span>
            </label>
        </div>
          <div class="wrapper">
            <input class="state" type="radio" name="production-type" id="prod_bio_2022" value="prod_bio_2022">
            <label class="label" for="prod_bio_2022">
              <div class="indicator"></div>
              <span class="text">Bio</span>
            </label>
          </div>

          <div class="wrapper">
            <input class="state" type="radio" name="production-type" id="prod_eolien_2022" value="prod_eolien_2022">
            <label class="label" for="prod_eolien_2022">
              <div class="indicator"></div>
              <span class="text">Eolien</span>
            </label>
          </div>
          <div class="wrapper">
            <input class="state" type="radio" name="production-type" id="prod_geo_2022" value="prod_geo_2022">
            <label class="label" for="prod_geo_2022">
              <div class="indicator"></div>
              <span class="text">Geothermique</span>
            </label>
          </div>
          <div class="wrapper">
            <input class="state" type="radio" name="production-type" id="prod_hydro_2022" value="prod_hydro_2022">
            <label class="label" for="prod_hydro_2022">
              <div class="indicator"></div>
              <span class="text">Hydraulique</span>
            </label>
          </div>
          <div class="wrapper">
            <input class="state" type="radio" name="production-type" id="prod_solaire_2022" value="prod_solaire_2022">
            <label class="label" for="prod_solaire_2022">
              <div class="indicator"></div>
              <span class="text">Solaire</span>
            </label>
          </div>
          <div class="wrapper">
          <input class="state" type="radio" name="production-type" id="prod_other_2022" value="prod_other_2022">
          <label class="label" for="prod_other_2022">
            <div class="indicator"></div>
            <span class="text">Autres</span>
          </label>
        </div>

        </div>
    `;
    $('.radiogroup').remove();
    $('#map').append(productionMenu);

    const productionType = $('input[name="production-type"]:checked').val();
    geoJsonLayer.setStyle(function (feature) {
        const productionValue = feature.properties[productionType];
        let color;
        if (productionType === 'prod_bio_2022') {
            if (productionValue < 10) {
                color = 'antiquewhite';
            } else if (productionValue < 9904) {
                color = 'lightsalmon';
            } else if (productionValue < 55324) {
                color = 'sienna';
            } else {
                color = 'darkred';
            }
        } else if (productionType === 'prod_eolien_2022') {
            if (productionValue < 10) {
                color = 'antiquewhite';
            } else if (productionValue < 45500) {
                color = 'lightsalmon';
            } else if (productionValue < 55077) {
                color = 'sienna';
            } else {
                color = 'darkred';
            }
        } else if (productionType === 'prod_geo_2022') {
            if (productionValue < 15300) {
                color = 'antiquewhite';
            } else if (productionValue < 23240) {
                color = 'lightsalmon';
            } else if (productionValue < 36170) {
                color = 'sienna';
            } else {
                color = 'darkred';
            }
        } else if (productionType === 'prod_hydro_2022') {
            if (productionValue < 10) {
                color = 'antiquewhite';
            } else if (productionValue < 45) {
                color = 'lightsalmon';
            } else if (productionValue < 2050) {
                color = 'sienna';
            } else {
                color = 'darkred';
            }
        } else if (productionType === 'prod_other_2022') {
            if (productionValue < 4980) {
                color = 'antiquewhite';
            } else if (productionValue < 79350) {
                color = 'lightsalmon';
            } else if (productionValue < 129500) {
                color = 'sienna';
            } else {
                color = 'darkred';
            }
        } else if (productionType === 'prod_solaire_2022') {
            if (productionValue < 1960) {
                color = 'antiquewhite';
            } else if (productionValue < 3730) {
                color = 'lightsalmon';
            } else if (productionValue < 8155) {
                color = 'sienna';
            } else {
                color = 'darkred';
            }
        } else if (productionType === 'total_prod_2022') {
            if (productionValue < 115000) {
                color = 'antiquewhite';
            } else if (productionValue < 175000) {
                color = 'lightsalmon';
            } else if (productionValue < 300000) {
                color = 'sienna';
            } else {
                color = 'darkred';
            }
        }
        return {
            weight: 0,
            opacity: 0.5,
            color: 'black',
            fillOpacity: 0.5,
            fillColor: color
        };
    });

    geoJsonLayer.eachLayer(function (layer) {
        const feature = layer.feature;
        const tooltipText = `${feature.properties.nom_complet}<br>${productionType}: ${feature.properties[productionType]} MWh <br> Pred. totale 2025: ${feature.properties.pred_prod_2025} MWh`;
        layer.bindTooltip(tooltipText, {
            permanent: false,
            direction: 'center',
            className: 'custom-tooltip'
        });
    });

    $('input[name="production-type"]').on('change', function () {
        const productionType = $(this).val();
        geoJsonLayer.setStyle(function (feature) {
            const productionValue = feature.properties[productionType];
            let color;
            if (productionType === 'prod_bio_2022') {
                if (productionValue < 10) {
                    color = 'antiquewhite';
                } else if (productionValue < 9904) {
                    color = 'lightsalmon';
                } else if (productionValue < 55324) {
                    color = 'sienna';
                } else {
                    color = 'darkred';
                }
            } else if (productionType === 'prod_eolien_2022') {
                if (productionValue < 10) {
                    color = 'antiquewhite';
                } else if (productionValue < 45500) {
                    color = 'lightsalmon';
                } else if (productionValue < 55077) {
                    color = 'sienna';
                } else {
                    color = 'darkred';
                }
            } else if (productionType === 'prod_geo_2022') {
                if (productionValue < 15300) {
                    color = 'antiquewhite';
                } else if (productionValue < 23240) {
                    color = 'lightsalmon';
                } else if (productionValue < 36170) {
                    color = 'sienna';
                } else {
                    color = 'darkred';
                }
            } else if (productionType === 'prod_hydro_2022') {
                if (productionValue < 10) {
                    color = 'antiquewhite';
                } else if (productionValue < 45) {
                    color = 'lightsalmon';
                } else if (productionValue < 2050) {
                    color = 'sienna';
                } else {
                    color = 'darkred';
                }
            } else if (productionType === 'prod_other_2022') {
                if (productionValue < 4980) {
                    color = 'antiquewhite';
                } else if (productionValue < 79350) {
                    color = 'lightsalmon';
                } else if (productionValue < 129500) {
                    color = 'sienna';
                } else {
                    color = 'darkred';
                }
            } else if (productionType === 'prod_solaire_2022') {
                if (productionValue < 1960) {
                    color = 'antiquewhite';
                } else if (productionValue < 3730) {
                    color = 'lightsalmon';
                } else if (productionValue < 8155) {
                    color = 'sienna';
                } else {
                    color = 'darkred';
                }
            } else if (productionType === 'total_prod_2022') {
                if (productionValue < 115000) {
                    color = 'antiquewhite';
                } else if (productionValue < 175000) {
                    color = 'lightsalmon';
                } else if (productionValue < 300000) {
                    color = 'sienna';
                } else {
                    color = 'darkred';
                }

            }
            return {
                weight: 0,
                opacity: 0.5,
                color: 'black',
                fillOpacity: 0.5,
                fillColor: color
            };
        });

        geoJsonLayer.eachLayer(function (layer) {
            const feature = layer.feature;
            const tooltipText = `${feature.properties.nom_complet}<br>${productionType}: ${feature.properties[productionType]} MWh <br> Pred. totale 2025: ${feature.properties.pred_prod_2025} MWh`;
            layer.bindTooltip(tooltipText, {
                permanent: false,
                direction: 'center',
                className: 'custom-tooltip'
            });
        });
    });
}

// Update the nextStep function to include the new state
function nextStep() {
    switch (currentStep) {
        case 0:
            showIntroText();
            currentStep++;
            break;
        case 1:
            hideIntroText();
            showColoredMap();
            currentStep++;
            break;
        case 2:
            showPresentationText();
            currentStep++;
            break;
        case 3:
            hidePresentationText();
            showPopulationDots();
            currentStep++;
            break;
        case 4:
            showHeatmap();
            currentStep++;
            break;
        case 5:
            // Remove the population dots
            map.eachLayer(function (layer) {
                if (layer instanceof L.CircleMarker) {
                    map.removeLayer(layer);
                }
            });
            showHeatmapText();
            currentStep++;
            break;
        case 6:
            hideHeatmapText();
            showRatioenrHeatmap();
            showRatioenrText();
            currentStep++;
            break;
        case 7:
            hideRatioenrText();
            showProductionHeatmap();
            showProductionText();
            currentStep++;
            break;
        default:
            break;
    }

    updateButtonState();
}




// Update the prevStep function to include the new state
function prevStep() {
    switch (currentStep) {
        case 1:
            hideIntroText();
            currentStep--;
            geoJsonLayer.setStyle(getBlackStyle);
            break;
        case 2:
            hidePresentationText();
            showIntroText();
            currentStep--;
            geoJsonLayer.setStyle(getBlackStyle);
            break;
        case 3:
            hidePresentationText();
            showColoredMap();
            currentStep--;
            break;
        case 4:
            // Remove the population dots
            map.eachLayer(function (layer) {
                if (layer instanceof L.CircleMarker) {
                    map.removeLayer(layer);
                }
            });
            showPresentationText();
            currentStep--;
            break;
        case 5:
            // Remove the heatmap
            geoJsonLayer.setStyle(getGeoJsonStyle);
            // Remove the population dots
            map.eachLayer(function (layer) {
                if (layer instanceof L.CircleMarker) {
                    map.removeLayer(layer);
                }
            });
            showPopulationDots();
            currentStep--;
            break;
        case 6:
            showPopulationDotsAndHeatmap();
            hideHeatmapText();
            currentStep--;
            break;
        case 7:
            hideRatioenrText();
            showHeatmapText();
            geoJsonLayer.setStyle(function (feature) {
                const maxConso = feature.properties.total_conso_2022;
                let color;
                if (maxConso < 421000) {
                    color = '#edbb99';
                } else if (maxConso < 665000) {
                    color = '#dc7633';
                } else {
                    color = '#a04000';
                }
                return {
                    weight: 0,
                    opacity: 0.5,
                    color: 'black',
                    fillOpacity: 0.5,
                    fillColor: color
                };
            });
            currentStep--;
            break;
        case 8:
            $('#production-menu').remove();
            $('.radiogroup').remove();
            showRatioenrHeatmap();
            showRatioenrText();
            hideProductionText();

            currentStep--;
            break;
        default:
            break;
    }
    updateButtonState();
}

// Update the updateButtonState function to include the new state
function updateButtonState() {
    if (currentStep === 0) {
        $('#prev-button').prop('disabled', true);
    } else {
        $('#prev-button').prop('disabled', false);
    }
    if (currentStep === 8) {
        $('#next-button').prop('disabled', true);
    } else {
        $('#next-button').prop('disabled', false);
    }
}

// Add new functions to show and hide the new div elements
function showRatioenrText() {
    $('#ratioenr-text').fadeIn();
}

function hideRatioenrText() {
    $('#ratioenr-text').fadeOut();
}

function showProductionText() {
    $('#production-text').fadeIn();
}

function hideProductionText() {
    $('#production-text').fadeOut();
}
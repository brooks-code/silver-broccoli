/**
 * ATMO-viz: a narration-oriented visualization state management script
 * ====================================================================
 *
 * This script manages the state of a visualization, handling user interactions,
 * updating the visualization, and displaying relevant information.
 *
 * @author RF 2011-1
 * @version "1.0"
 * @date 2024-11-24
 *
 * @license "CCO-1.0"
 *
 * @description This script is part of a visualization project submission for the DGE 2024 Challenge.
 *              The initial datasets were provided by the ATMO Grand-Est.
 *              This part is responsible for initializing the visualization state,
 *              handling user interactions, and updating the visualization.
 */

/**
 * Asynchronous function to initialize the visualization state.
 * Fetches the configuration file and creates a new instance of the VisualizationState class and initializes the map with the specified settings.
 */
async function init() {
  /**
   * Configuration settings for the visualization.
   * @typedef {object} config
   * @property {string} path - The path to the configuration file.
   * @property {string} type - The type of configuration file ("json").
   * @property {object} MAP_INITIAL - The initial map settings, including the center, zoom, and bounds.
   * @property {object} TILE_LAYER - The tile layer settings, including the URL and options.
   * @property {object} FILE - The file settings for the GeoJSON data, including the path and type.
   * @property {object} SELECTORS - The selector settings for the visualization, including the selectors for the map, layers, and visualization settings.
   * @property {object} COLORS - The color settings for the visualization, including the colors for the map, layers, and visualization settings.
   * @property {object} OPACITY - The opacity settings for the visualization, including the opacity for the map, layers, and visualization settings.
   * @property {object} THRESHOLDS - The threshold settings for the visualization, including the threshold values and colors.
   */
  const config = await (await fetch("./config/config.json")).json();

  /**
   * Represents the state of the visualization.
   *
   * This class encapsulates the state of the visualization, including the map, layers, and current step.
   * It provides methods for initializing the visualization, updating the map, and handling user interactions.
   * @typedef {object} VisualizationState
   * @property {number} currentStep - The current step of the visualization, ranging from 0 to 10.
   * @property {object} map - The map object, created using the Leaflet library.
   * @property {object} geoJsonData - The GeoJSON data object, containing the data for the visualization.
   * @property {object} geoJsonLayer - The GeoJSON layer object, created using the Leaflet library.
   * @property {object} tileLayer - The tile layer object, created using the Leaflet library.
   */
  class VisualizationState {
    /**
     * Constructor for the VisualizationState class.
     * Initializes the state object with default values.
     */
    constructor() {
      this.state = {
        currentStep: 0,
        geoJsonData: null,
        geoJsonLayer: null,
        map: null,
        tileLayer: null,
      };
    }

    // Initialization method

    /**
    * Initializes the map, fetches the GeoJSON data, and sets up layers and event bindings.
    @async
    */
    async initialize() {
      this.state.map = L.map("map", config.MAP_INITIAL);
      try {
        this.state.geoJsonData = await $.ajax({
          type: "GET",
          dataType: "json",
          url: config.FILE.path,
        });
        this.setupLayers();
        this.bindEvents();
      } catch (error) {
        console.error("Error loading GeoJSON data:", error);
      }
    }

    // Layer management

    /**
     * Sets up the layers on the map.
     *
     * Set the tile layer and GeoJSON layer, and adds them to the map.
     */
    setupLayers() {
      this.setupTileLayer();
      this.initializeGeoJsonLayer();
    }

    /**
     * Sets up the tile layer on the map.
     *
     * Set the tile layer with the specified URL and options, and adds it to the map.
     */
    setupTileLayer() {
      this.state.tileLayer = L.tileLayer(
        config.TILE_LAYER.url,
        config.TILE_LAYER.options
      ).addTo(this.state.map);
      this.state.map.getPane("tilePane").style.filter = "grayscale(100%)";
    }

    /**
     * Initializes the GeoJSON layer on the map.
     *
     * Creates the GeoJSON layer with the specified data and options, and adds it to the map.
     */
    initializeGeoJsonLayer() {
      this.state.geoJsonLayer = L.geoJSON(this.state.geoJsonData, {
        style: (feature) => this.generateStyle(feature, "default"),
        // Pop-up marker
        onEachFeature: (feature, layer) =>
          layer.bindPopup(feature.properties.nom_complet),
      }).addTo(this.state.map);
      this.state.map.fitBounds(this.state.geoJsonLayer.getBounds());
    }

    // Event handling

    /**
     * Binds events to the map.
     *
     * Binds events to the next and previous buttons, and updates the visualization state accordingly.
     */
    bindEvents() {
      $(config.SELECTORS.BUTTONS.NEXT).on("click", () =>
        this.handleStepChange(1)
      );
      $(config.SELECTORS.BUTTONS.PREV).on("click", () =>
        this.handleStepChange(-1)
      );
    }

    /**
     * Handles Next/Previous buttons change.
     *
     * Handles the step change when the "Next" or "Previous" button is clicked.
     * @param {number} direction - The direction of the step change (1 for next, -1 for previous).
     */
    handleStepChange(direction) {
      const newStep = this.state.currentStep + direction;
      if (newStep >= 0 && newStep <= 10) {
        this.state.currentStep = newStep;
        this.updateVisualization(newStep);
        this.updateButtonState();
      }
    }

    /**
     * Updates the button state based on the current step.
     *
     * Enables or disables the next and previous buttons based on the current step.
     */
    updateButtonState() {
      const { currentStep } = this.state;
      $(config.SELECTORS.BUTTONS.PREV).prop("disabled", currentStep === 0);
      $(config.SELECTORS.BUTTONS.NEXT).prop("disabled", currentStep === 10);
    }

    // Style utilities

    /**
     * Creates a base style for the GeoJSON layer.
     *
     * Returns a base style object with the specified fill color.
     *
     * @param {string} fillColor - The fill color for the style.
     * @returns {object} The base style object.
     */
    createBaseStyle(fillColor) {
      return {
        weight: 0,
        opacity: config.OPACITY.DEFAULT,
        color: config.COLORS.DEFAULT,
        fillOpacity: config.OPACITY.FILL_OPACITY,
        fillColor,
      };
    }

    /**
     * Generates a style for the GeoJSON layer .
     *
     * Returns a style object based on the specified feature, type and option.
     * @param {object} feature - The feature to generate the style for.
     * @param {string} type - The type of style to generate. (e.g., "default", "zone", "consumption", "production", "ratioEnr").
     * @param {object} options - Optional options for the style.
     * @returns {object} The generated style object.
     */
    generateStyle(feature, type, options = {}) {
      /**
       * A map of style functions for different types of features.
       * @type {object} ("default", "zone", "consumption", "production", and "ratioEnr")
       */
      const styleMap = {
        default: () => ({
          ...this.createBaseStyle(config.COLORS.DEFAULT),
          weight: 2,
          fillOpacity: config.OPACITY.LOWER,
        }),
        zone: () =>
          this.createBaseStyle(
            config.COLORS.ZONE[feature.properties.forme_epci] ||
              config.COLORS.DEFAULT
          ),
        consumption: () => {
          const value = feature.properties[options.consumptionType];
          const thresholds =
            config.THRESHOLDS.CONSUMPTION[
              options.consumptionType.split("_")[1].toUpperCase()
            ];
          return this.createBaseStyle(
            this.getColorByValue(
              value,
              thresholds,
              Object.values(config.COLORS.CONSUMPTION)
            )
          );
        },
        production: () => {
          const value = feature.properties[options.productionType];
          const productionKey = options.productionType // (PROD, BIO, EOLIEN, GEO...)
            .split("_")[1]
            .toUpperCase();
          return this.createBaseStyle(
            this.getColorByValue(
              value,
              config.THRESHOLDS.PRODUCTION[productionKey],
              Object.values(config.COLORS.PRODUCTION)
            )
          );
        },
        ratioEnr: () =>
          this.createBaseStyle(
            this.getColorByValue(
              feature.properties.ratioenr_2022,
              config.THRESHOLDS.RATIO_ENR,
              Object.values(config.COLORS.RATIO_ENR)
            )
          ),
      };

      return (styleMap[type] || styleMap.default)();
    }

    // Tooltip generator

    /**
     * Generates a tooltip for the GeoJSON layer based on the feature and type.
     *
     * This method returns a tooltip string based on the feature and type.
     *
     * @param {object} feature - The feature to generate the tooltip for.
     * @param {string} type - The type of tooltip to generate. (e.g., "consumption", "production", "ratioEnr", "zone").
     * @param {object} options - Optional options for the tooltip.
     * @returns {string} The generated tooltip string.
     */
    generateTooltip(feature, type, options = {}) {
      const baseInfo = `${feature.properties.nom_complet}<br>`;
      const tooltipMap = {
        // Additional State relative informations.
        consumption: () => `${baseInfo}
            Conso. 2022: ${feature.properties.total_conso_2022} MWh<br>
            Conso. par hab.: ${feature.properties.per_capita_conso_2022} MWh`,
        production: () => `${baseInfo}
            ${options.productionType}: ${
          feature.properties[options.productionType]
        } MWh<br>
            Pred. totale 2025: ${feature.properties.pred_prod_2025} MWh`,
        ratioEnr: () =>
          `${baseInfo}Ratio ENR (2022): ${feature.properties.ratioenr_2022}`,
        zone: () => baseInfo,
      };

      return (tooltipMap[type] || tooltipMap.zone)();
    }

    /**
     * Updates the tooltips of the GeoJSON layer based on the specified tooltip type and options.
     * @param {string} tooltipType - The type of tooltip to generate (e.g., "consumption", "production", "ratioEnr", "zone").
     * @param {Object} options - Additional options for generating the tooltips.
     */
    updateTooltips(tooltipType, options = {}) {
      this.state.geoJsonLayer.eachLayer((layer) => {
        const tooltipText = this.generateTooltip(
          layer.feature,
          tooltipType,
          options
        );
        this.updateLayerTooltip(layer, tooltipText);
      });
    }

    /**
     * Updates the tooltip of a GeoJSON Leaflet layer with the specified text.
     * @param {Object} layer - The Leaflet layer object.
     * @param {string} tooltipText - The text to display in the tooltip.
     */
    updateLayerTooltip(layer, tooltipText) {
      layer.unbindTooltip();
      layer.bindTooltip(tooltipText, {
        permanent: false,
        direction: "center",
        className: "custom-tooltip",
      });
    }

    // Layer updates

    /**
     * Updates the visualization based on the specified category and type.
     * @param {string} category - The category of the visualization (e.g., "consumption", "production", "final").
     * @param {string|Object} type - The type of visualization within the category.
     */
    updateVisualizationByType(category, type) {
      /**
       * An object to store options for the style and tooltip generation.
       * @type {object}
       */
      const options = {};
      if (typeof type === "object" && type.option) {
        const typeMap = {
          production: "productionType",
          consumption: "consumptionType",
        };
        options[typeMap[category]] = type.option;
        type = type.id;
      }
      if (category === "final") {
        // Handle the final (recap) State
        const defaultOptions = {
          production: { productionType: "total_prod_2022" },
          consumption: { consumptionType: "total_conso_2022" },
        };
        Object.assign(options, defaultOptions[type] || {});
      } else {
        options[`${category}Type`] = type;
      }
      this.updateGeoJsonStyle(category === "final" ? type : category, options);
      this.updateTooltips(category === "final" ? type : category, options);
    }

    /**
     * Updates the GeoJSON layer style based on the style type and options.
     *
     * This method updates the GeoJSON layer style based on the style type and options.
     *
     * @param {string} styleType - The type of style to update. (e.g., "default", "zone", "consumption", "production", "ratioEnr").
     * @param {object} options - Optional options for the style.
     */
    updateGeoJsonStyle(styleType, options = {}) {
      this.state.geoJsonLayer.setStyle((feature) =>
        this.generateStyle(feature, styleType, options)
      );
    }

    // UI utilities

    /**
     * Creates a menu for the visualization based on the types and name.
     *
     * Creates an HTML string for a radio button menu with the specified types and name.
     * @param {Array} types - An array of objects representing the menu options, each with an id and label.
     * @param {string} name - The name of the menu.
     * @returns {string} The HTML string for the radio button menu.
     */
    createMenu(types, name) {
      return `<div class="radiogroup">
          ${types
            .map(
              (type) => `
            <div class="wrapper">
              <fieldset>
                <legend>${name}</legend>
                <input class="state" type="radio"
                       name="${name}-type"
                       id="${type.id}"
                       value="${type.id}"
                       ${type.id.includes("total") ? "checked" : ""}>
                <label class="label" for="${type.id}">
                  <div class="indicator"></div>
                  <span class="text">${type.label}</span>
                </label>
              </fieldset>
            </div>
          `
            )
            .join("")}
        </div>`;
    }

    /**
     * Shows a radio button menu on the map with the specified types and name.
     * @param {Array} types - An array of objects representing the menu options, each with an id and label.
     * @param {string} name - The name of the menu.
     */
    showMenu(types, name) {
      this.hideMenu();
      $(config.SELECTORS.MAP).append(this.createMenu(types, name));
      $(`input[name="${name}-type"]`).on("change", (e) =>
        this.updateVisualizationByType(name, e.target.value)
      );
    }

    /**
     * Hides any existing radio button menu.
     */
    hideMenu() {
      $(".radiogroup").remove();
    }

    // Population visualization

    /**
     * Adds circle markers to the map representing the population percentage of each GeoJSON feature.
     */
    addPopulationDots() {
      this.state.geoJsonLayer.eachLayer((layer) => {
        const { feature } = layer;
        const radius = Math.max(feature.properties.pop_percentage * 5);
        const dot = L.circleMarker(layer.getBounds().getCenter(), {
          radius,
          color: config.COLORS.DEFAULT,
          weight: 1,
          opacity: config.OPACITY.DEFAULT,
          fillOpacity: config.OPACITY.LOWER,
          fillColor: config.COLORS.DEFAULT,
          zIndexOffset: 1000 - radius,
        }).bindTooltip(
          `${feature.properties.nom_complet}<br>Part de la pop. rég. ${feature.properties.pop_percentage}%`,
          { permanent: false, direction: "center", className: "custom-tooltip" }
        );
        dot.addTo(this.state.map);
      });
    }

    /**
     * Clears all circle markers (population dots) from the map.
     */
    clearCircleMarkers() {
      this.state.map.eachLayer((layer) => {
        if (layer instanceof L.CircleMarker) this.state.map.removeLayer(layer);
      });
    }

    /**
     * Shows a checkbox toggle for displaying the population dots on the map.
     */
    showPopulationToggle() {
      $(config.SELECTORS.MAP).append(`
          <div class="population-toggle">
          <fieldset>
          <legend>Show population</legend>
            <input type="checkbox" id="population-toggle">
            <label for="population-toggle">Afficher la population</label>
            </fieldset>
          </div>
        `);
      $("#population-toggle").on("change", (e) =>
        e.target.checked ? this.addPopulationDots() : this.clearCircleMarkers()
      );
    }

    /**
     * Hides the population toggle checkbox.
     */
    hidePopulationToggle() {
      $(".population-toggle").remove();
    }

    // Utility methods

    /**
     * Gets the color based on a value and a set of thresholds and colors.
     * @param {number} value - The value to evaluate.
     * @param {Array} thresholds - An array of thresholds.
     * @param {Array} colors - An array of colors.
     * @returns {string} The color corresponding to the value based on the thresholds.
     */
    getColorByValue(value, thresholds, colors) {
      const index = thresholds.findIndex((threshold) => value < threshold);
      return index === -1 ? colors[colors.length - 1] : colors[index];
    }

    /**
     * Fades in an element with the specified selector.
     * @param {string} selector - The CSS selector for the element.
     */
    fadeInElement(selector) {
      $(selector).fadeIn();
    }

    /**
     * Fades out an element with the specified selector.
     * @param {string} selector - The CSS selector for the element.
     */
    fadeOutElement(selector) {
      $(selector).fadeOut();
    }

    // Visualization Options Setup

    /**
     * Sets up the visualization state based on the provided options.
     * @param {Object} options - An object containing various options for the visualization state.
     */
    setupVisualizationState(options) {
      /**
       * Options for the visualization state setup.
       * @typedef {object} SetupOptions
       * @property {boolean} clearMarkers - Whether to clear the markers (population dots).
       * @property {boolean} hideMenu - Whether to hide the menu.
       * @property {string|string[]} hideText - The text (selector) to hide.
       * @property {string} showText - The text (selector) to show.
       * @property {object[]} menuTypes - The types of menu items.
       * @property {string} menuName - The name of the menu.
       * @property {string} defaultType - The default type of the menu item.
       * @property {string} styleType - The type of style to apply.
       * @property {string} tooltipType - The type of tooltip to display.
       */
      const {
        clearMarkers,
        hideMenu,
        hideText,
        showText,
        menuTypes,
        menuName,
        defaultType,
        styleType,
        tooltipType,
      } = options;

      // Handle markers and menu
      clearMarkers && this.clearCircleMarkers();
      hideMenu && this.hideMenu();

      // Handle text visibility
      Array.isArray(hideText)
        ? hideText.forEach((text) => this.fadeOutElement(text))
        : hideText && this.fadeOutElement(hideText);
      showText && this.fadeInElement(showText);

      // Handle menu and visualization
      if (menuTypes) {
        this.showMenu(menuTypes, menuName);
        this.updateVisualizationByType(menuName, defaultType);
      }

      // Update styles and tooltips
      styleType && this.updateGeoJsonStyle(styleType);
      tooltipType && this.updateTooltips(tooltipType);
    }

    // State Machine

    /**
     * This is the State machine.
     *
     * Updates the visualization based on the current step.
     * @param {number} step - The current step of the visualization.
     */
    updateVisualization(step) {
      const visualizationSteps = {
        0: () => this.showInitialState(),
        1: () => this.showIntroState(),
        2: () => this.showZoneState(),
        3: () => this.showZonePresentationState(),
        4: () => this.showTransitionState(),
        5: () => this.showPopulationState(),
        6: () => this.showHeatmapState(),
        7: () => this.showConsumptionState(),
        8: () => this.showRatioEnrState(),
        9: () => this.showProductionState(),
        10: () => this.showFinalState(),
      };

      visualizationSteps[step]?.();
    }

    // Visualization States

    showInitialState() {
      this.setupVisualizationState({
        clearMarkers: true,
        hideMenu: true,
        hideText: config.SELECTORS.TEXTS,
        styleType: "default",
      });
    }

    showIntroState() {
      this.setupVisualizationState({
        hideText: "#presentation-text",
        showText: "#intro-text",
        styleType: "default",
      });
    }

    showZoneState() {
      this.setupVisualizationState({
        hideText: ["#intro-text", "#presentation-text"],
        styleType: "zone",
        tooltipType: "zone",
      });
    }

    showZonePresentationState() {
      this.setupVisualizationState({
        hideText: "#transition-text",
        showText: "#presentation-text",
      });
    }

    showTransitionState() {
      this.setupVisualizationState({
        hideText: "#presentation-text",
        showText: "#transition-text",
        clearMarkers: true,
      });
    }

    showPopulationState() {
      this.setupVisualizationState({
        hideText: "#zone-text",
        showText: "#population-text",
      });
      this.addPopulationDots();
    }

    showHeatmapState() {
      this.setupVisualizationState({
        hideMenu: true,
        hideText: ["#transition-text", "#heatmap-text"],
        styleType: "zone",
        tooltipType: "zone",
      });
    }

    showConsumptionState() {
      const consumptionTypes = [
        { id: "total_conso_2022", label: "Total consommé" },
        { id: "per_capita_conso_2022", label: "Conso. par habitant" },
      ];
      this.setupVisualizationState({
        clearMarkers: true,
        hideText: "#ratioenr-text",
        showText: "#heatmap-text",
        menuTypes: consumptionTypes,
        menuName: "consumption",
        defaultType: "total_conso_2022",
      });
    }

    showRatioEnrState() {
      this.setupVisualizationState({
        hideMenu: true,
        hideText: ["#heatmap-text", "#production-text"],
        showText: "#ratioenr-text",
        styleType: "ratioEnr",
        tooltipType: "ratioEnr",
      });
    }

    showProductionState() {
      const productionTypes = [
        { id: "total_prod_2022", label: "Total produit" },
        { id: "prod_bio_2022", label: "Biomasse" },
        { id: "prod_eolien_2022", label: "Éolien" },
        { id: "prod_geo_2022", label: "Géothermique" },
        { id: "prod_hydro_2022", label: "Hydraulique" },
        { id: "prod_solaire_2022", label: "Photovoltaïque" },
        { id: "prod_other_2022", label: "Autres" },
      ];

      this.setupVisualizationState({
        hideText: "#ratioenr-text",
        showText: "#production-text",
        menuTypes: productionTypes,
        menuName: "production",
        defaultType: "total_prod_2022",
        clearMarkers: true,
      });
      this.hidePopulationToggle();
    }

    showFinalState() {
      const finalTypes = [
        { id: "zone", label: "Types d'habitats" },
        {
          id: "consumption",
          option: "total_conso_2022",
          label: "Conso. Totale 2022",
        },
        { id: "ratioEnr", label: "Part d'ENR" },
        {
          id: "production",
          option: "total_prod_2022",
          label: "Prod. totale 2022",
        },
      ];
      this.setupVisualizationState({
        hideText: "#production-text",
        menuTypes: finalTypes,
        menuName: "final",
        defaultType: "zone",
      });
      this.showPopulationToggle();
    }
  }

  // Initialization

  /**
  Creates a new instance of the VisualizationState class and initializes the map.
  This function creates a new instance of the VisualizationState class and initializes the map with the specified settings.
  @async */
  $(() => new VisualizationState().initialize());
}

/**
    Initializes the map and sets up the visualization state.
    This function initializes the map and sets up the visualization state with the specified settings.
    @async */
init();

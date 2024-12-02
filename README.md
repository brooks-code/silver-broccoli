# ATMO-Viz

**Navigate the Narrative**

![Banner Image](/img/boston_bay.jpg "A banner image depicting an ancient map of the Boston Bay.")
*Carte particulière du havre de Boston par Chabert, Des Barres, Sartine, Petit [Paris, 1780] G3762.B65 1780 .C5*

The project is a JS data visualization application built using Leaflet.js and jQuery. It displays a map with various visualization states, each representing different aspects of the data.

>This is a contribution to the **DGE Data Visualization Challenge 2024** organized by the [Data Grand Est](https://www.datagrandest.fr/portail/en) community with data provided by [ATMO Grand-Est](https://www.atmo-grandest.eu/).

### Inspiration

The application is inspired by interactive visualizations seen in various investigations published by some newspapers data-journalism desks (Washington Post, The Guardian, Le Monde..). The main goal is to provide a narrative-friendly experience allowing users to navigate through different visualization states, each showcasing particular aspects of the data with the possibility to explore some of the data more in detail.

## Demo

The live demo is available [here](https://brooks-code.github.io/silver-broccoli/test.html)!

## Features

- Loads GeoJSON data and displays it on a map.
- Allows users to navigate through the different visualization states using buttons.
- Provides different visualization states, such as:
  - Initial state.
  - Transitional states with animations.
  - Presentation states with text boxes.
  - Detailed states with interactive menus.
- Displays customizable tooltips with additional information about the GeoJSON features.
- Provides various styling options for the GeoJSON data, including color-coding based on different properties.
- Population dots (with customizable dot sizes and colors) can be added to the map to visualize the population distribution.

![Image](/img/demo.gif "An animated image depicting different states of the map.")

<details>
<summary> Click to expand - Details about the current visualization states </summary>

    - Initial state: basic map view with administrative boundaries (county-level).
    - Zone state: display of geographical areas (urban, rural and rural–urban fringe).
    - Population state: population distribution.
    - Consumption state: energy consumption overview.
    - Consumption detail: total and per capita consumption overviews.
    - Ratio ENR: Renewable energy ratios.
    - Production state: energy production overview.
    - Production detail: source-wise production.
    - Final state: combined area, population, renewables, consumption and production views.

</details>

## Requirements

A modern web browser (with JavaScript enabled). That's all really.

- Dependencies:
  - jQuery
  - Leaflet.js
  - JSON configuration file

## Installation

If you are a Visual Studio Code user, you can easily test the app *locally*:

1. Clone or download this repository.
2. Modify the `test.html` file:

- Point to your **local CSS**:
  
```html
    <style>
      @import url("https://fonts.cdnfonts.com/css/raleway-5");
    </style>
    <!-- Modify the line below --> 
    <link rel="stylesheet" href=/path/to/your/mycss.css" />
```

- and point to your **local JS script**:

```html
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script
      src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"
      integrity="sha512-XQoYMqMTK8LvdxXYG3nZ448hOEQiglfqkJs1NOQV44cWnUrBc8PkAOcXy20w0vlaXaVUearIOBhiXZ5V3ynxwA=="
      crossorigin="anonymous"
      referrerpolicy="no-referrer"
    ></script>
    <!-- Modify the line below --> 
    <script src="/path/to/your/atmoviz.js"></script>
```

3. Modify the `config.json` file:

```json
{
  "FILE": {
    // Modify the line below
    "path": "/path/to/your/geojson_file.geojson"
  },
  "MAP_INITIAL": {
```

4. Install the (free) [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
5. ***In VSCode***:
   - Either right-click on the html file and select Open With Live Server.
   - Or click "go live" in the VSCode footer menu (bottom right). Then select the `test.html` file in the page that automatically appeared in your browser.
6. The app should be available under this link:
    > http://127.0.0.1:5500/test.html

## Configuration

The application uses a configuration file (config.json) to store settings and data paths. You can modify this file to customize the application's behavior and appearance.

The `config.json` file should include:

<details>
<summary> Click to expand - Structure of the configuration file: </summary>

```json
{
  "FILE": {
    "path": "/path/to/your/file.geojson"
  },
  "MAP_INITIAL": {
    "center": [latitude, longitude],
    "zoom": zoomLevel,
    "zoomControl": boolean
  },
  "TILE_LAYER": {
    "url": "https://{s}.tile.your-map-provider.org/{z}/{x}/{y}.png",
    "options": {
      "attribution": "Your map attribution",
      "subdomains": ["a", "b", "c"],
      "opacity": opacityValue
    }
  },
  "COLORS": {
    "ZONE": {
      "zone1": "#color1",
      "zone2": "#color2",
      ...
    },
    "CONSUMPTION": {
      "LOW": "#color1",
      "MEDIUM": "#color2",
      "HIGH": "#color3"
    },
    "PRODUCTION": {
      "NONE": "#color1",
      "LOW": "#color2",
      "MEDIUM": "#color3",
      "HIGH": "#color4"
    },
    "RATIO_ENR": {
      "VERY_LOW": "#color1",
      "LOW": "#color2",
      "MEDIUM": "#color3",
      "HIGH": "#color4",
      "VERY_HIGH": "#color5"
    },
    "DEFAULT": "#defaultColor"
  },
  "OPACITY": {
    "FILL_OPACITY": opacityValue,
    "DEFAULT": opacityValue,
    "LOWER": opacityValue
  },
  "THRESHOLDS": {
    "CONSUMPTION": {
      "CONSO": [value1, value2],
      "CAPITA": [value1, value2]
    },
    "PRODUCTION": {
      "BIO": [value1, value2, value3],
      "EOLIEN": [value1, value2, value3],
      ...
    },
    "RATIO_ENR": [value1, value2, value3, value4]
  },
  "SELECTORS": {
    "TEXTS": [
      "#text1",
      "#text2",
      ...
    ],
    "MAP": "#mapId",
    "BUTTONS": {
      "NEXT": "#nextButton",
      "PREV": "#prevButton"
    }
  }
}

```

Replace the placeholder values with your actual data and settings or use the preconfigured file available in the repository.
</details>

## Main  Methods

    initialize(): sets up the visualization.
    setupLayers(): configures map layers.
    bindEvents(): sets up event handlers.
    updateVisualization(): State machine for state transitions management.
    generateStyle(): creates visualization styles.
    generateTooltip(): creates tooltips.

    & various utility methods for handling specific visualization aspects.

## Usage

Navigate through visualization states using the next (▶) and previous (◀) buttons. Explore the map by hovering over areas of interest to access detailed information. When available, utilize the radio buttons to toggle between various data visualizations and gain a deeper understanding of the presented data.

## Limitations

Despite being responsive, this app is not meant to be viewed on mobile terminals, it is best experienced on bigger screens.

Limited customization: The app's visualization and styling options are hardcoded in the configuration file, which may limit the ability to customize the app for different use cases or user preferences. A python script might eventually tackle this issue by populating the configuration file in an automated way.

## Troubleshooting

If you only see the bottom navigation bar and the map is not appearing:

- Check your internet connection (the app relies on external libraries such as Leaflet, jQuery and services like OSM).
- Check if javascript is enabled in your browser's settings.
- If you are serving the app locally, check your html and configuration files and see if they point to the right files (see [installation](#installation)).

## Data-Curious?

This app wouldn't be without some data processing. You can find more information about the process *(soon)*. The documentaion outlines the steps involved in exploring and transforming the provided data to bring you this interactive storytelling experience.

## Further learning

A tutorial about some elements of this project will be available *soon*.

Challenge: I've put quit a lot of energy to implement the good practices I'm aware of, and this makes me even more eager to learn and improve.

I'm pretty sure a lot can be optimized, so I've had this idea where you can step in. Let's call it the ReFacto Challenge: feel free to improve the app's performance, scalability, and maintainability. Tackle the ReFacto challenge and share your optimizations. *More about it soon*.

## Contributing

Contributions are **welcome**. You can follow the usual steps:

    Fork the repository
    Create a feature branch
    Commit your changes
    Push to the branch
    Create a Pull Request

## License

The source code is provided under a Creative Commons CC0 license. See the [LICENSE]([link](https://brooks-code.github.io/silver-broccoli/LICENSE)) file for details.

The source dataset is provided for **a reproductibility purpose only**. That dataset remains the property of [ATMO Grand-Est](https://www.atmo-grandest.eu/), if you plan on using it for other purposes, please check with them.

## Acknowledgments

This project uses the following:

    Leaflet.js: A JavaScript library for interactive maps.
    GeoJSON: A format for encoding geospatial data in JSON.
    OpenStreetMap: Map tiles are provided by the OpenStreetMap project.
    jQuery: A JavaScript library for DOM manipulation and event handling.
    
    

#### Design

- Font used: [Raleway](https://fonts.cdnfonts.com/css/raleway-5).
- Colors gradients are inspired by the [color brewer's](https://colorbrewer2.org/).
- CSS radio buttons are adapted from Alvves's Neumorphic buttons.

----------------

The author express his gratitude to the data provider ATMO Grand-Est and the Data Grand-Est team for the organization of the DGE Challenge 2024.
This was an amazing opportunity to learn and brush up a lot of dev and data skills :)

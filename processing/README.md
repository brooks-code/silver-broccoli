# ATMO-Viz Project for the data-curious

**behind the scenes**

![Banner Image](/img/internet-map.jpg "A map that seeks to generate an accurate representation of the breadth of the Internet.")
*Internet map from the [Opte Project](https://en.wikipedia.org/wiki/Opte_Project).*

## Inspiration

The ATMO-Viz Project is inspired newsmedia data visualizations and driven by the need to visualize and analyze energy indicators at the local level. Our goal is to provide a comprehensive and interactive tool for exploring energy data, promoting sustainability, and informing decision-makers.

## Table of Content

<details>
<summary> Contents - click to expand</summary>

- [ATMO-Viz Project for the data-curious](#atmo-viz-project-for-the-data-curious)
  - [Inspiration](#inspiration)
  - [Table of Content](#table-of-content)
  - [Demo](#demo)
  - [Features](#features)
  - [Requirements](#requirements)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Data processing strategy](#data-processing-strategy)
  - [Machine learning model](#machine-learning-model)
  - [Model performance](#model-performance)
  - [Functions overview](#functions-overview)
    - [1. `process_ratio_data()`](#1-process_ratio_data)
    - [2. `process_prod_data()`](#2-process_prod_data)
    - [3. `process_conso_data()`](#3-process_conso_data)
    - [4. `merge_dataframes()`](#4-merge_dataframes)
    - [5. `update_geojson_data()`](#5-update_geojson_data)
    - [6. `save_to_file()`](#6-save_to_file)
  - [Usage](#usage)
  - [Limitations](#limitations)
  - [Data-Curious?](#data-curious)
  - [Contributing](#contributing)
  - [License](#license)
  - [Acknowledgments](#acknowledgments)
  
</details>

## Demo

A demo of the ATMO-Viz Project can be found [here](https://brooks-code.github.io/silver-broccoli/test.html).
The main repo is available [here](https://github.com/brooks-code/silver-broccoli).

## Features

- Data processing and transformation of energy production and consumption data.
- Machine learning-based prediction of future energy production and consumption.
- Support for multiple data formats, including CSV, JSON and geoJSON.
- Support the datavisualization project ATMO-viz.

## Requirements

- Python 3.7+
- numpy
- pandas
- scikit-learn
- json (included with Python)
- geojson

## Installation

To install the ATMO-Viz Project, follow these steps:

1. Clone the repository: `git clone https://github.com/brooks-code/silver-broccoli.git`
2. Navigate to the processing folder: `cd processing`
3. Install the required dependencies: `pip install -r requirements.txt`
4. Run the data processing script: `python data_processing.py`
5. Run the machine learning script: `python ml_trainer.py`

## Configuration

The paths to the input data files are specified in the *main()* method. They're pointing by default to the `original_dataset` folder for the input data and `processed_data` folder for the output files.

## Data processing strategy

The script processes three types of data from the original datasets:

- **Ratio Data**
- **Production Data**
- **Consumption Data**

1. A dictionary maps various categories (e.g., "Solaire photovoltaïque" to "solaire") to ensure consistency.
2. Load JSON data for ratios, consumption, and production.
3. Process each type of data into DataFrames ([details below](#functions-overview)).
4. Merge the processed DataFrames into a single DataFrame.
5. Update the GeoJSON data with the merged DataFrame.
6. Save the processed and updated data to file.

>[!NOTE]
> For optimization purposes, coordinates are rounded to 3 decimal places.

## Machine learning model

The implemented model is scikit learn's [random forest regressor](https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.RandomForestRegressor.html) with these parameters: `n_estimators=100` (the default value) and `max_depth=5`.

## Model performance

| Metric              | Total Consumption 2022 | Total Production 2022 |
| ------------------- | ---------------------- | --------------------- |
| Training R²         | 0.9940052634007496     | 0.9766802004416946    |
| Test R²             | 0.9703667947178802     | 0.9227943877464756    |
| Cross-Validation R² | 0.9454758137935796     | 0.9115834778862594    |

## Functions overview

The ATMO-Viz Project consists of two main scripts:

- `data_processing.py`: process and transform the energy production, consumption and ratio data

  <details>
  <summary> notable functions - click to expand</summary>

  ### 1. `process_ratio_data()`

  - Process ratio data from a JSON file.
  - **Output:** A DataFrame with processed ratio data, including:
    - Renamed columns
    - Pivoted table structure
    - Rounded values
    - Population percentage calculation

  ### 2. `process_prod_data()`

  - Process production data from a JSON file.
  - **Output:** A DataFrame with processed production data, including:
    - Renamed columns
    - Pivoted table structure
    - Total production calculations

  ### 3. `process_conso_data()`

  - Process consumption data from a JSON file.
  - **Output:** A DataFrame with processed consumption data, including:
    - Renamed columns
    - Pivoted table structure
    - Total consumption calculations

  ### 4. `merge_dataframes()`

  - Merge three DataFrames into a single DataFrame.

  ### 5. `update_geojson_data()`

  - Update GeoJSON data with data from a DataFrame.

  ### 6. `save_to_file()`

  - Save data to a file (.csv xor .geojson).

</details>

- `ml_trainer.py`: train a machine learning model to predict future energy production and consumption
  - `train_and_predict()`: train a random forest regressor on a DataFrame and predict future values for the target column.
  - `update_geojson()`: update the GeoJSON data with the predicted values.
  
## Usage

To use the ATMO-Viz Project, follow these steps:

1. Make sure the input data files are located in the `original_dataset` directory
2. Run the data processing script: `python data_processing.py`
3. Run the machine learning script: `python ml_trainer.py`
4. Visualize the results using the GeoJSON file generated by the processing (suffix *_no_ml*) or the machine learning script (suffix *_ml*)

## Limitations

The ATMO-Viz Project data science chapter has the following limitations:

- The machine learning model is trained on a limited dataset.
- No fine-tuning has been done at this stage.

## Data-Curious?

If you're interested in learning more about the dataset used in the ATMO-Viz Project, please refer to the data documentation in the `docs` directory.

## Contributing

Contributions are **welcome!** I appreciate your support: each contribution and feedback helps me grow and improve.

## License

The ATMO-Viz Project is licensed under the [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) license.
The source dataset (located in the *dataset* folder) remains the property of the [ATMO Grand-Est](https://www.atmo-grandest.eu/), please contact them if you plan on using this data for any other purpose than reproducing these results.

## Acknowledgments

**PBQ** for helping me getting more accurate predictions in the machine learning part!

The author expresses again his gratitude to the data provider **ATMO Grand-Est** and the **Data Grand-Est team** for the organization of the DGE Challenge 2024.

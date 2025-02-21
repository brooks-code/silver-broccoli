#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =============================================================================
# File name: ml_trainer.py
# Author: RFML.OA.2022.2.6.2
# Creation date: 2024-11-28
# Version: "1.0"
# License: "CC0 1.0"
# Acknowledgement: PBQ
# -----------------------------------------------
# Machine learning module of the ATMO-Viz Project
# -----------------------------------------------
# This script trains a random forest regressor on data processed by the data
# processing script and updates the GeoJSON data with the predicted values.
# =============================================================================


# Imports
import os
import json
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split, cross_val_score


# ---------------------------------------------------------------------------
# Functions
def train_and_predict(df: pd.DataFrame, target: str) -> pd.DataFrame:
    """
    Train a random forest regressor on the given DataFrame and predict future values for the target column.

    Args:
        df (pd.DataFrame): The DataFrame containing the data.
        target (str): The name of the target column.

    Returns:
        pd.DataFrame: The DataFrame with the predicted values.

    Notes:
        The function trains a random forest regressor on the data, predicts future values for the target column,
        and returns the DataFrame with the predicted values.
    """
    feats = [c for c in df.columns if c not in [
        "siren_epci", "nom_complet"] and "2022" not in c]
    y = df[target]
    X = df[feats]

    # Dummies
    X = pd.concat((X.drop(columns="forme_epci"), pd.get_dummies(
        X["forme_epci"]).astype(int)), axis=1)

    # Training
    model = RandomForestRegressor(
        random_state=99, n_estimators=100, max_depth=5)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=99)

    model.fit(X_train, y_train)
    print(f"Training R2 for {target}:", model.score(X_train, y_train))
    print(f"Test R2 for {target}:", model.score(X_test, y_test))

    # Training on full dataset
    model.fit(X, y)
    scores = cross_val_score(model, X, y, cv=5)
    print(f"Cross-Validation R2 for {target}:", scores.mean())

    # Predict future years
    y_2022 = y.copy()
    y_2023 = model.predict(X.assign(**{f"total_{target.split('_')[1]}_2019": X[f"total_{target.split('_')[1]}_2020"],
                                       f"total_{target.split('_')[1]}_2020": X[f"total_{target.split('_')[1]}_2021"],
                                       f"total_{target.split('_')[1]}_2021": y_2022}))
    y_2024 = model.predict(X.assign(**{f"total_{target.split('_')[1]}_2019": X[f"total_{target.split('_')[1]}_2021"],
                                       f"total_{target.split('_')[1]}_2020": y_2022,
                                       f"total_{target.split('_')[1]}_2021": y_2023}))
    y_2025 = model.predict(X.assign(**{f"total_{target.split('_')[1]}_2019": y_2022,
                                       f"total_{target.split('_')[1]}_2020": y_2023,
                                       f"total_{target.split('_')[1]}_2021": y_2024}))

    # Save results
    df_pred = pd.DataFrame({
        f"pred_total_{target.split('_')[1]}_2022": y_2022.round().astype(int),
        f"pred_total_{target.split('_')[1]}_2023": y_2023.round().astype(int),
        f"pred_total_{target.split('_')[1]}_2024": y_2024.round().astype(int),
        f"pred_total_{target.split('_')[1]}_2025": y_2025.round().astype(int)
    })

    return pd.concat([df, df_pred], axis=1)


def update_geojson(predictions: pd.DataFrame, geojson_data: dict) -> dict:
    """
    Update the GeoJSON data with the predicted values.

    Args:
        predictions (pd.DataFrame): The DataFrame containing the predicted values.
        geojson_data (dict): The GeoJSON data.

    Returns:
        dict: The updated GeoJSON data.

    Notes:
        The function updates the GeoJSON data with the predicted values and returns the updated GeoJSON data.
    """
    for feature in geojson_data["features"]:
        siren_epci = feature["properties"]["siren_epci"]
        row = predictions.loc[predictions["siren_epci"].astype(
            str) == siren_epci]
        if row.empty:
            print("No matching row found for siren_epci {}".format(siren_epci))
        else:
            feature["properties"]["pred_prod_2025"] = int(
                row["pred_total_prod_2025"].values[0])
            feature["properties"]["pred_conso_2025"] = int(
                row["pred_total_conso_2025"].values[0])
    return geojson_data


# ---------------------------------------------------------------------------
# Main Code
def main() -> None:
    """
    Main function.

    Notes:
        The function reads the data from a CSV file, trains and predicts the values for the target columns,
        updates the GeoJSON data with the predicted values, and saves the updated GeoJSON data to a new file.
    """
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    data_dir = os.path.join(root_dir, "processed_data")

    # Construct path and read the CSV file
    file_path = os.path.join(data_dir, "processed_data_no_ml.csv")
    df = pd.read_csv(file_path)

    # df = pd.read_csv("processed_data_no_ml.csv")
    df = train_and_predict(df, "total_conso_2022")
    df = train_and_predict(df, "total_prod_2022")
    df.to_csv(os.path.join(data_dir, "processed_data_ml.csv"), index=False)

    with open(os.path.join(data_dir, "epci_no_ml.geojson")) as f:
        geojson_data = json.load(f)

    if len(geojson_data["features"]) == 0:
        print("GeoJSON data is empty")
    else:
        print("GeoJSON data has {} features".format(
            len(geojson_data["features"])))

    geojson_data = update_geojson(df, geojson_data)
    geojson_file = os.path.join(data_dir, "epci_ml.geojson")
    with open(geojson_file, "w") as f:
        json.dump(geojson_data, f)

    print(
        f"Updated GeoJSON data saved to epci_ml.geojson in the {data_dir} directory")


if __name__ == "__main__":
    main()

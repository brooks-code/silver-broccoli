#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =============================================================================
# File name: data_processing.py
# Author: RFML.OA.2022.2.6.1
# Creation date: 2024-11-27
# Version: "1.0"
# License: "CC0 1.0"
# ----------------------------------------------
# Data processing module of the ATMO-Viz Project
# ----------------------------------------------
# This script is responsible for processing and transforming the JSON epci data
# and updating the GeoJSON file to support the data visualization.
# =============================================================================


# Imports
import os
import json
import pandas as pd
import geojson
import numpy as np
from typing import Union


# ---------------------------------------------------------------------------
# Functions
def round_coordinates(coords: Union[list, tuple, int, float]) -> Union[list, tuple, int, float]:
    """
    Recursively rounds coordinates to 3 decimal places.

    Args:
        coords: A list, tuple, or number representing coordinates.

    Returns:
        The rounded coordinates.
    """
    if isinstance(coords, (int, float)):  # if it's a number, round it
        return round(coords, 3)
    # if it's a list, recursively round the coordinates
    elif isinstance(coords, (list, tuple)):
        return [round_coordinates(x) for x in coords]
    raise TypeError(f"Unsupported type: {type(coords)}")


def load_json(filename: str) -> dict:
    """
    Loads a JSON file into a Python dictionary.

    Args:
        filename: The path to the JSON file.

    Returns:
        The loaded JSON data.
    """
    with open(filename) as f:
        return json.load(f)


def process_ratio_data(data: dict) -> pd.DataFrame:
    """
    Processes ratio data from a JSON file.

    Args:
        data: The ratio data from the JSON file.

    Returns:
        A DataFrame containing the processed ratio data.
    """
    df = pd.DataFrame(data)
    df = df.rename(columns={
        "insee": "siren_epci", "nom": "nom_complet",
        "forme": "forme_epci", "pop": "pmun_epci",
        "nbcom": "nb_com_epci"
    })
    df = df.pivot_table(
        index=["siren_epci", "nom_complet",
               "forme_epci", "pmun_epci", "nb_com_epci"],
        columns="an", values="ratioenr", aggfunc="sum"
    ).reset_index()
    df.columns = ["siren_epci", "nom_complet", "forme_epci", "pmun_epci", "nb_com_epci",
                  "ratioenr_2019", "ratioenr_2020", "ratioenr_2021", "ratioenr_2022"]
    df[["ratioenr_2019", "ratioenr_2020", "ratioenr_2021", "ratioenr_2022"]] = df[[
        "ratioenr_2019", "ratioenr_2020", "ratioenr_2021", "ratioenr_2022"]].round(1)
    df["pop_percentage"] = df["pmun_epci"] / df["pmun_epci"].sum() * 100
    df["pop_percentage"] = df["pop_percentage"].round(2)
    return df


def process_prod_data(data: dict, detail_mapping: dict) -> pd.DataFrame:
    """
    Processes production data from a JSON file.

    Args:
        data: The production data from the JSON file.
        detail_mapping: A dictionary mapping detail values to their corresponding categories.

    Returns:
        A DataFrame containing the processed production data.
    """
    df = pd.DataFrame(data)
    df = df.rename(columns={"insee": "siren_epci"})
    df["detail"] = df["detail"].apply(lambda x: detail_mapping[x])
    df["prod"] = df["prod"].apply(lambda x: int(x * 1000))  # Convert to MWh
    df = df.pivot_table(index="siren_epci", columns=[
                        "an", "detail"], values="prod", aggfunc="sum")
    df.columns = [f"prod_{col[1]}_{col[0]}" for col in df.columns]
    for year in set(col.split("_")[2] for col in df.columns if "prod" in col):
        df[f"total_prod_{year}"] = df[[
            col for col in df.columns if year in col and col.startswith("prod")]].sum(axis=1)
    return df


def process_conso_data(data: dict) -> pd.DataFrame:
    """
    Processes consumption data from a JSON file.

    Args:
        data: The consumption data from the JSON file.

    Returns:
        A DataFrame containing the processed consumption data.
    """
    df = pd.DataFrame(data)
    df = df.rename(columns={"insee": "siren_epci"})
    df["consocvc"] = df["consocvc"].apply(lambda x: int(x))
    df = df.pivot_table(index="siren_epci", columns=[
                        "an", "categorie"], values="consocvc", aggfunc="sum")
    df.columns = [f"conso_{col[1]}_{col[0]}" for col in df.columns]
    for year in set(col.split("_")[2] for col in df.columns if "conso" in col):
        df[f"total_conso_{year}"] = df[[
            col for col in df.columns if year in col and col.startswith("conso")]].sum(axis=1)
    return df


def merge_dataframes(ratio_df: pd.DataFrame, prod_df: pd.DataFrame, conso_df: pd.DataFrame) -> pd.DataFrame:
    """
    Merges three DataFrames into a single DataFrame.

    Args:
        ratio_df: The ratio DataFrame.
        prod_df: The production DataFrame.
        conso_df: The consumption DataFrame.

    Returns:
        A DataFrame containing the merged data.
    """
    merged_df = pd.merge(ratio_df, prod_df, on="siren_epci", how="left")
    merged_df = pd.merge(merged_df, conso_df, on="siren_epci", how="left")
    for year in set(col.split("_")[2] for col in prod_df.columns if "prod" in col):
        merged_df[f"per_capita_prod_{year}"] = merged_df[f"total_prod_{year}"] / \
            merged_df["pmun_epci"]
        merged_df[f"per_capita_conso_{year}"] = merged_df[f"total_conso_{year}"] / \
            merged_df["pmun_epci"]
    merged_df.fillna(0, inplace=True)
    cols_to_convert = [col for col in merged_df.columns if col not in [
        "siren_epci", "nom_complet", "forme_epci", "type", "pmun_epci",
        "nb_com_epci", "pop_percentage", "ratioenr_2019", "ratioenr_2020",
        "ratioenr_2021", "ratioenr_2022"]]
    merged_df[cols_to_convert] = merged_df[cols_to_convert].astype(int)
    return merged_df


def update_geojson_data(geojson_data: dict, merged_df: pd.DataFrame) -> dict:
    """
    Updates GeoJSON data with data from a DataFrame.

    Args:
        geojson_data: The GeoJSON data.
        merged_df: The DataFrame containing the updated data.

    Returns:
        The updated GeoJSON data.
    """
    for feature in geojson_data["features"]:
        siren_epci = feature["properties"]["siren_epci"]
        row = merged_df[merged_df["siren_epci"] == siren_epci]
        if feature["geometry"]["type"] == "Polygon":
            feature["geometry"]["coordinates"] = [round_coordinates(
                x) for x in feature["geometry"]["coordinates"]]
        elif feature["geometry"]["type"] == "MultiPolygon":
            feature["geometry"]["coordinates"] = [[round_coordinates(
                x) for x in polygon] for polygon in feature["geometry"]["coordinates"]]
        if not row.empty:
            feature["properties"].update(
                row.iloc[0].drop("siren_epci").to_dict())
    return geojson_data


def save_to_file(data: Union[pd.DataFrame, dict], filename: str, to_geojson: bool = False) -> None:
    """
    Saves data to a file.

    Args:
        data: The data to save.
        filename: The filename to save to.
        to_geojson: Whether to save as a GeoJSON file.
    """
    with open(filename, "w") as f:
        if to_geojson:
            geojson.dump(data, f, default=convert_to_serializable)
        elif isinstance(data, pd.DataFrame):
            data.to_csv(f, index=False)
        else:
            raise ValueError(
                "Unsupported data type. Only DataFrames and GeoJSON data are supported.")


def convert_to_serializable(obj: Union[np.int64, np.float64]) -> Union[int, float]:
    """
    Converts a NumPy object to a serializable type.

    Args:
        obj: The NumPy object to convert.

    Returns:
        The converted object.
    """
    if isinstance(obj, np.generic):
        return obj.item()
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")


# ---------------------------------------------------------------------------
# Main Code
if __name__ == "__main__":
    detail_mapping: "dict[str, str]" = {
        "Solaire photovoltaïque": "solaire",
        "Solaire thermique": "solaire",
        "Production d'agrocarburants": "bio",
        "Production de biocombustibles": "bio",
        "Biogaz": "bio",
        "Géothermie profonde basse énergie": "geo",
        "Géothermie très haute énergie": "geo",
        "PACs aérothermiques": "geo",
        "PACs géothermiques": "geo",
        "Incinération déchets - part EnR": "other",
        "Filière bois-énergie": "other",
        "Eolien": "eolien",
        "Hydraulique renouvelable": "hydro"
    }

    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

    dataset_dir = os.path.join(root_dir, "original_dataset")
    processed_dir = os.path.join(root_dir, "processed_data")

    ratio_data: dict = load_json(os.path.join(dataset_dir, "ratio.json"))
    conso_data: dict = load_json(os.path.join(dataset_dir, "conso.json"))
    prod_data: dict = load_json(os.path.join(dataset_dir, "prod.json"))
    geojson_data: dict = load_json(os.path.join(dataset_dir, "epci.geojson"))

    ratio_df: pd.DataFrame = process_ratio_data(ratio_data)
    conso_df: pd.DataFrame = process_conso_data(conso_data)
    prod_df: pd.DataFrame = process_prod_data(prod_data, detail_mapping)
    merged_df: pd.DataFrame = merge_dataframes(ratio_df, prod_df, conso_df)

    updated_geojson_data: dict = update_geojson_data(geojson_data, merged_df)

    save_to_file(merged_df, os.path.join(
        processed_dir, "processed_data_no_ml.csv"))
    save_to_file(updated_geojson_data,
                 os.path.join(processed_dir, "epci_no_ml.geojson"), to_geojson=True)
    print("Process done succesfully. Files saved.")

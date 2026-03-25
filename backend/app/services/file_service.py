from typing import Any, Dict

import pandas as pd


def dataframe_stats(df: pd.DataFrame) -> Dict[str, Any]:
    numeric_stats = df.describe().to_dict()

    column_info = []
    for col in df.columns:
        col_info: Dict[str, Any] = {
            "name": col,
            "dtype": str(df[col].dtype),
            "null_count": int(df[col].isnull().sum()),
            "unique_count": int(df[col].nunique()),
        }

        if pd.api.types.is_numeric_dtype(df[col]):
            col_info["min"] = float(df[col].min())
            col_info["max"] = float(df[col].max())
            col_info["mean"] = float(df[col].mean())

        column_info.append(col_info)

    return {
        "numeric_stats": numeric_stats,
        "columns": column_info,
    }




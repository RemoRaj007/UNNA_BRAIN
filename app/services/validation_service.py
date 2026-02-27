from io import BytesIO

import pandas as pd

REQUIRED_COLUMNS = {
    'Date',
    'Post text',
    'Link',
    'Impressions',
    'Reactions',
    'Comments',
    'Shares',
}


def read_tabular_file(filename: str, content: bytes) -> pd.DataFrame:
    stream = BytesIO(content)
    lower = filename.lower()
    if lower.endswith('.csv'):
        df = pd.read_csv(stream)
    elif lower.endswith(('.xls', '.xlsx')):
        df = pd.read_excel(stream)
    else:
        raise ValueError('Unsupported file format')
    return df


def validate_schema(df: pd.DataFrame) -> dict:
    missing = REQUIRED_COLUMNS.difference(df.columns)
    if missing:
        raise ValueError(f'Missing required columns: {sorted(missing)}')
    return {'rows': len(df), 'columns': list(df.columns)}

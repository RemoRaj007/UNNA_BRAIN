import pandas as pd
import pytest

from app.services.validation_service import read_tabular_file, validate_schema


def test_validate_schema_success():
    df = pd.DataFrame(
        {
            'Date': ['2026-01-01'],
            'Post text': ['hello'],
            'Link': ['https://example.com'],
            'Impressions': [100],
            'Reactions': [10],
            'Comments': [2],
            'Shares': [1],
        }
    )
    metadata = validate_schema(df)
    assert metadata['rows'] == 1


def test_validate_schema_missing_columns_raises():
    df = pd.DataFrame({'Date': ['2026-01-01']})
    with pytest.raises(ValueError):
        validate_schema(df)


def test_read_tabular_file_rejects_unknown_extension():
    with pytest.raises(ValueError):
        read_tabular_file('payload.txt', b'abc')

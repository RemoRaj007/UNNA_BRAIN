import pandas as pd

from app.services.aggregation_service import apply_date_filter, compute_engagements, top_ranked_posts


def _sample_df() -> pd.DataFrame:
    return pd.DataFrame(
        {
            'Date': ['2026-01-01', '2026-01-02', '2026-01-03'],
            'Post text': ['A', 'B', 'C'],
            'Reactions': [1, 10, 5],
            'Comments': [1, 0, 2],
            'Shares': [0, 2, 1],
        }
    )


def test_aggregation_and_ranking_logic():
    filtered = apply_date_filter(_sample_df(), '2026-01-01', '2026-01-31')
    engaged = compute_engagements(filtered)
    ranked = top_ranked_posts(engaged, top_n=2)

    assert list(ranked['Rank']) == [1, 2]
    assert ranked.iloc[0]['Post text'] == 'B'
    assert ranked.iloc[0]['Engagements'] == 12

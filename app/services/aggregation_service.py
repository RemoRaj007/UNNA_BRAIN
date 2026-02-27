import pandas as pd


def apply_date_filter(df: pd.DataFrame, start_date, end_date) -> pd.DataFrame:
    local = df.copy()
    local['Date'] = pd.to_datetime(local['Date'], errors='coerce')
    mask = (local['Date'] >= pd.to_datetime(start_date)) & (local['Date'] <= pd.to_datetime(end_date))
    return local.loc[mask].copy()


def compute_engagements(df: pd.DataFrame) -> pd.DataFrame:
    local = df.copy()
    local['Engagements'] = local[['Reactions', 'Comments', 'Shares']].sum(axis=1)
    return local


def top_ranked_posts(df: pd.DataFrame, top_n: int = 3) -> pd.DataFrame:
    ranked = df.sort_values(by='Engagements', ascending=False).head(top_n).copy()
    ranked.insert(0, 'Rank', range(1, len(ranked) + 1))
    return ranked

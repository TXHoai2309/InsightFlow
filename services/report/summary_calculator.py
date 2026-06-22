from typing import List, Dict, Any
from collections import defaultdict
import datetime

def calculate_summary(mentions: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calculate summary overview and distribution from a list of mention documents.
    """
    # Overview metrics
    total_mentions = len(mentions)
    by_brand = defaultdict(int)
    by_source = defaultdict(int)
    risk_mentions_count = 0

    # Global distribution metrics
    sentiment_distribution = defaultdict(int)
    topic_distribution = defaultdict(int)

    # Brand-specific metrics
    # structure: brand_name -> { 'sentiment': defaultdict(int), 'topics': defaultdict(int) }
    brand_data = defaultdict(lambda: {
        'sentiment': defaultdict(int),
        'topics': defaultdict(int),
        'count': 0
    })

    # First pass: Aggregate counts
    for m in mentions:
        brand = m.get('brand', 'Unknown')
        source = m.get('source', 'Unknown')
        sentiment = m.get('sentiment', 'neutral')
        topic = m.get('topic', 'other')
        is_risk = m.get('is_risk', False)

        # Update overview
        by_brand[brand] += 1
        by_source[source] += 1
        if is_risk:
            risk_mentions_count += 1

        # Update global distribution
        sentiment_distribution[sentiment] += 1
        if topic:
            topic_distribution[topic] += 1

        # Update brand-specific data
        brand_data[brand]['count'] += 1
        brand_data[brand]['sentiment'][sentiment] += 1
        if topic:
            brand_data[brand]['topics'][topic] += 1

    # Format global top topics
    top_topics = sorted(
        [{"topic": k, "count": v} for k, v in topic_distribution.items()],
        key=lambda x: x["count"],
        reverse=True
    )[:10]

    # Format brand-specific breakdown
    by_brand_breakdown = {}
    for brand, data in brand_data.items():
        if data['count'] >= 5:
            # Format top topics for this brand
            brand_top_topics = sorted(
                [{"topic": k, "count": v} for k, v in data['topics'].items()],
                key=lambda x: x["count"],
                reverse=True
            )[:10]

            by_brand_breakdown[brand] = {
                "sentiment_distribution": dict(data['sentiment']),
                "top_topics": brand_top_topics
            }

    # Construct final result
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    
    return {
        "generated_at": now_iso,
        "overview": {
            "total_mentions": total_mentions,
            "by_brand": dict(by_brand),
            "by_source": dict(by_source),
            "risk_mentions_count": risk_mentions_count
        },
        "distribution": {
            "sentiment_distribution": dict(sentiment_distribution),
            "top_topics": top_topics,
            "by_brand_breakdown": by_brand_breakdown
        }
    }

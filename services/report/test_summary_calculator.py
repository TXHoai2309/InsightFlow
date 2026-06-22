import pytest
from summary_calculator import calculate_summary

def test_calculate_summary():
    # Mock data
    mentions = [
        {"brand": "BrandA", "source": "facebook", "sentiment": "positive", "topic": "quality", "is_risk": False},
        {"brand": "BrandA", "source": "facebook", "sentiment": "positive", "topic": "quality", "is_risk": False},
        {"brand": "BrandA", "source": "news", "sentiment": "neutral", "topic": "price", "is_risk": False},
        {"brand": "BrandA", "source": "news", "sentiment": "negative", "topic": "price", "is_risk": True},
        {"brand": "BrandA", "source": "forum", "sentiment": "negative", "topic": "service", "is_risk": True},
        # BrandA has 5 mentions -> should be included in by_brand_breakdown
        
        {"brand": "BrandB", "source": "facebook", "sentiment": "neutral", "topic": "service", "is_risk": False},
        {"brand": "BrandB", "source": "facebook", "sentiment": "neutral", "topic": "service", "is_risk": False},
        {"brand": "BrandB", "source": "news", "sentiment": "positive", "topic": "quality", "is_risk": False},
        # BrandB has 3 mentions -> should NOT be included in by_brand_breakdown
    ]

    result = calculate_summary(mentions)

    # Check overview
    assert result["overview"]["total_mentions"] == 8
    assert result["overview"]["by_brand"]["BrandA"] == 5
    assert result["overview"]["by_brand"]["BrandB"] == 3
    assert result["overview"]["by_source"]["facebook"] == 4
    assert result["overview"]["by_source"]["news"] == 3
    assert result["overview"]["by_source"]["forum"] == 1
    assert result["overview"]["risk_mentions_count"] == 2

    # Check distribution
    assert result["distribution"]["sentiment_distribution"]["positive"] == 3
    assert result["distribution"]["sentiment_distribution"]["neutral"] == 3
    assert result["distribution"]["sentiment_distribution"]["negative"] == 2

    top_topics = result["distribution"]["top_topics"]
    assert len(top_topics) > 0
    # Service: 3, Quality: 3, Price: 2
    assert top_topics[0]["topic"] in ["service", "quality"]

    # Check breakdown (BrandA should be present, BrandB should not)
    breakdown = result["distribution"]["by_brand_breakdown"]
    assert "BrandA" in breakdown
    assert "BrandB" not in breakdown

    assert breakdown["BrandA"]["sentiment_distribution"]["positive"] == 2
    assert breakdown["BrandA"]["sentiment_distribution"]["negative"] == 2
    assert breakdown["BrandA"]["sentiment_distribution"]["neutral"] == 1

    brand_a_topics = breakdown["BrandA"]["top_topics"]
    assert brand_a_topics[0]["topic"] == "quality"
    assert brand_a_topics[0]["count"] == 2

import os
import json
import logging
from typing import Dict, Any
import datetime
from google.cloud import firestore
from summary_calculator import calculate_summary

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Firestore client
# Assuming execution in a GCP environment where credentials are automatically detected
try:
    db = firestore.Client()
except Exception as e:
    logger.warning(f"Could not initialize default firestore client: {e}")
    db = None

def generate_report_summary(request=None) -> Dict[str, Any]:
    """
    Cloud Function entry point.
    Triggered by Cloud Scheduler via HTTP or Pub/Sub.
    """
    logger.info("Starting report summary generation...")
    
    if db is None:
        err = "Firestore client is not initialized."
        logger.error(err)
        return {"error": err}, 500

    try:
        # 1. Read mentions from Firestore
        mentions_ref = db.collection("mentions")
        # Note: For very large datasets, we would implement a time window filter here
        # e.g., query = mentions_ref.where("created_at", ">=", some_date)
        docs = mentions_ref.stream()

        mentions_data = []
        for doc in docs:
            mentions_data.append(doc.to_dict())

        logger.info(f"Successfully fetched {len(mentions_data)} mentions.")

        # 2. Calculate summary
        summary_result = calculate_summary(mentions_data)
        
        # 3. Write results to Firestore "reports_demo" collection
        reports_ref = db.collection("reports_demo")
        
        # Save as "latest"
        reports_ref.document("latest").set(summary_result)
        
        # Save as timestamped document
        timestamp_doc_id = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%d_%H%M%S")
        reports_ref.document(timestamp_doc_id).set(summary_result)

        logger.info(f"Successfully saved report summary to 'reports_demo/latest' and 'reports_demo/{timestamp_doc_id}'.")
        
        # Return success for HTTP trigger
        return {"status": "success", "generated_at": summary_result["generated_at"]}

    except Exception as e:
        logger.error(f"Error generating report summary: {str(e)}", exc_info=True)
        return {"error": str(e)}, 500

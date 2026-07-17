const fs = require('fs');
const path = 'c:/Users/ad/Documents/Word của thu hạ/if/InsightFlow/apps/web/src/locales/en.json';
let en = {};
try { en = JSON.parse(fs.readFileSync(path, 'utf8')); } catch (e) {}

Object.assign(en, {
  'bm.tabs.overview': 'Overview',
  'bm.tabs.crisis': 'Crisis Monitoring',
  'bm.tabs.lead': 'Lead Monitoring',

  'bm.crisis.aiDetected': 'AI detected',
  'bm.crisis.abnormalSignals': 'abnormal signals',
  'bm.crisis.baselineDesc': '% increase from baseline — not static % of total discussion',
  'bm.crisis.noSignals': 'No abnormal signals detected',
  'bm.crisis.noSignalsDesc': "AI hasn't found anything concerning during this time",
  'bm.crisis.critical': 'CRITICAL',
  'bm.crisis.high': 'HIGH',
  'bm.crisis.medium': 'MEDIUM',
  'bm.crisis.low': 'LOW',
  'bm.crisis.newlyAppeared': 'Newly appeared',
  'bm.crisis.abnormalComplaints': 'abnormal complaints',
  'bm.crisis.samplePlatform': 'Sample platform:',
  
  'bm.heatmap.title': 'Daily Risk Warning Heatmap',
  'bm.heatmap.subtitle': 'The intensity of red corresponds to the complaint level per day (last 13 weeks)',
  'bm.heatmap.less': 'Less',
  'bm.heatmap.more': 'More',
  'bm.heatmap.noRisks': 'No risk warnings',
  'bm.heatmap.noRisksDesc': 'No negative data in this period',
  'bm.heatmap.complaints': 'complaints',
  'bm.heatmap.noComplaints': 'No complaints',

  'bm.opportunity.updatedAt': 'Updated at:',
  'bm.opportunity.title': 'Opportunity Analysis',
  'bm.opportunity.subtitle': 'Discover locations and topics with high growth potential based on positive reviews.',
  'bm.opportunity.actionLabel': 'Action Recommended:',
  'bm.opportunity.actionDesc': 'Focus marketing efforts on growing branches to boost sales.',
  'bm.opportunity.downloadAlert': 'Opportunity Report (PDF) downloaded!',
  'bm.opportunity.exportReport': 'Export Report',
  'bm.opportunity.growthLocations': 'growth locations',
  'bm.opportunity.topVenues': 'Top Venues with Positive Growth',
  'bm.opportunity.noData': 'No positive data',
  'bm.opportunity.praised': 'Praised:',
  'bm.opportunity.topTopics': 'Top Praised Topics Trend',
  'bm.opportunity.notEnoughData': 'Not enough data for chart',
  'bm.opportunity.positiveReviews': 'Positive reviews:',

  'bm.aiRec.title': 'AI Action Recommendations',
  'bm.aiRec.subtitle': 'Synthesized from potential & crisis analysis',
  'bm.aiRec.opportunity': 'Capitalize immediately',
  'bm.aiRec.noOpp': 'No significant opportunities detected',
  'bm.aiRec.oppAction': 'is rising abnormally, consider pushing communication now',
  'bm.aiRec.crisis': 'Urgent handling required',
  'bm.aiRec.noCrisis': 'No urgent risks detected',
  'bm.aiRec.crisisAction': 'negative signal is escalating, assignment needed',
  'bm.aiRec.noData': 'AI does not have enough signals to provide recommendations during this period',
  
  'common.other': 'Other',
  'common.locale': 'en-US'
});

fs.writeFileSync(path, JSON.stringify(en, null, 2));
console.log('Successfully added translations to en.json!');

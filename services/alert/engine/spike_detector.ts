// Spike detection algorithm
// window_size = 15 phút
// baseline = avg(mention_tiêu_cực, 7 ngày trước, cùng giờ)
// current_count = count(mention_tiêu_cực, 15 phút vừa qua)
//
// if current_count > 3 * baseline AND current_count > min_threshold:
//     trigger_alert(severity="high")

export function detectSpike(currentCount: number, baseline: number, minThreshold: number): boolean {
  if (currentCount > 3 * baseline && currentCount > minThreshold) {
    return true;
  }
  return false;
}

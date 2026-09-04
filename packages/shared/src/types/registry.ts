export interface AssumptionRegistryEntry {
  id: string; // UUID v4
  userId: string;
  assumptionFamily: string; // e.g. "enterprise_procurement_speed", "customer_paid_conversion"
  totalRecordedInstances: number;
  failedInstancesCount: number;
  fragilityRatio: number; // failed / total
  typicalUnderestimationFactor?: number; // e.g. procurement took 2.8x longer than anticipated
  lastAlertedAt?: number;
}

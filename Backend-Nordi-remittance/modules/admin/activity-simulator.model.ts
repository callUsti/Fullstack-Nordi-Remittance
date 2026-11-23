import mongoose from 'mongoose';

const { Schema } = mongoose;

export interface IActivitySimulatorConfig {
  user: string;
  enabled: boolean;
  intensity: 'low' | 'normal' | 'high';
  enabledScopes: {
    accounts: boolean;
    cards: boolean;
    loans: boolean;
    investments: boolean;
    internalTransfers: boolean;
    fxConversions: boolean;
  };
  cadenceHistory: {
    lastDailyAt?: Date;
    lastWeeklyAt?: Date;
    lastBiweeklyAt?: Date;
    lastMonthlyAt?: Date;
    lastYearlyAt?: Date;
  };
  lastRunAt?: Date;
  nextRunAt?: Date;
  totalTransactionsGenerated: number;
  totalVolumeGenerated: number;
  lastRunSummary?: Record<string, unknown>;
  enabledBy?: string;
  enabledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ActivitySimulatorConfigSchema = new Schema<IActivitySimulatorConfig>(
  {
    user: { type: String, ref: 'Users', required: true, unique: true, index: true },
    enabled: { type: Boolean, default: false, index: true },
    intensity: {
      type: String,
      enum: ['low', 'normal', 'high'],
      default: 'normal',
    },
    enabledScopes: {
      accounts: { type: Boolean, default: true },
      cards: { type: Boolean, default: true },
      loans: { type: Boolean, default: true },
      investments: { type: Boolean, default: true },
      internalTransfers: { type: Boolean, default: true },
      fxConversions: { type: Boolean, default: true },
    },
    cadenceHistory: {
      lastDailyAt: { type: Date },
      lastWeeklyAt: { type: Date },
      lastBiweeklyAt: { type: Date },
      lastMonthlyAt: { type: Date },
      lastYearlyAt: { type: Date },
    },
    lastRunAt: { type: Date },
    nextRunAt: { type: Date, index: true },
    totalTransactionsGenerated: { type: Number, default: 0 },
    totalVolumeGenerated: { type: Number, default: 0 },
    lastRunSummary: { type: Schema.Types.Mixed },
    enabledBy: { type: String, ref: 'AdminUsers' },
    enabledAt: { type: Date },
  },
  { timestamps: true },
);

export const ActivitySimulatorConfigs = mongoose.model<IActivitySimulatorConfig>(
  'ActivitySimulatorConfigs',
  ActivitySimulatorConfigSchema,
);

export default ActivitySimulatorConfigs;


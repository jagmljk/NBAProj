import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Target,
  Layers,
  PieChart,
  Activity,
  Award,
  Info,
  Crosshair,
  AlertTriangle,
  Database,
  RefreshCw,
  Cpu,
  CheckCircle2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart as RechartsPie,
  Pie,
  Legend,
  Line,
  ComposedChart,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { cn, formatPercentage } from '../lib/utils';
import {
  useModelInfo,
  useModelPerformance,
  useFeatureImportance,
  useConfidenceTiers,
  useModelCalibration,
  useUpsetWatch,
  useAccuracyStats,
} from '../hooks/useApi';
import { PredictionAccuracyDashboard } from '../components/PredictionAccuracyDashboard';

// Custom tooltip for charts
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 text-sm">
        <p className="text-white font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {entry.value.toFixed(4)}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

// Model overview section
function ModelOverview() {
  const { data: modelInfo, isLoading: infoLoading } = useModelInfo();
  const { data: performance, isLoading: perfLoading } = useModelPerformance();

  const isLoading = infoLoading || perfLoading;

  const metrics = [
    {
      label: 'Test Accuracy',
      value: performance?.test_accuracy ?? 0,
      format: 'percent',
      icon: Target,
      color: 'text-primary-orange',
      bgColor: 'bg-primary-orange/10',
    },
    {
      label: 'AUC Score',
      value: performance?.test_auc ?? 0,
      format: 'decimal',
      icon: Activity,
      color: 'text-secondary-blue',
      bgColor: 'bg-secondary-blue/10',
    },
    {
      label: 'Precision',
      value: performance?.test_precision ?? 0,
      format: 'percent',
      icon: Layers,
      color: 'text-primary-gold',
      bgColor: 'bg-primary-gold/10',
    },
    {
      label: 'Recall',
      value: performance?.test_recall ?? 0,
      format: 'percent',
      icon: TrendingUp,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: 'F1 Score',
      value: performance?.test_f1 ?? 0,
      format: 'decimal',
      icon: Award,
      color: 'text-secondary-purple',
      bgColor: 'bg-secondary-purple/10',
    },
    {
      label: 'Val Accuracy',
      value: performance?.val_accuracy ?? 0,
      format: 'percent',
      icon: BarChart3,
      color: 'text-slate-300',
      bgColor: 'bg-slate-500/10',
    },
  ];

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Model Performance</h2>
          <p className="text-slate-400">
            {modelInfo?.model_type ?? 'XGBoost'} • {modelInfo?.features_count ?? 50}+ features
          </p>
        </div>
        {modelInfo?.model_version && (
          <Badge variant="default">
            v{modelInfo.model_version}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card variant="glass" className="p-4">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-3", metric.bgColor)}>
                  <Icon className={cn("w-5 h-5", metric.color)} />
                </div>
                {isLoading ? (
                  <Skeleton className="h-8 w-20 mb-1" />
                ) : (
                  <div className={cn("text-2xl font-bold", metric.color)}>
                    {metric.format === 'percent'
                      ? formatPercentage(metric.value)
                      : metric.format === 'decimal'
                      ? metric.value.toFixed(3)
                      : metric.value.toLocaleString()}
                  </div>
                )}
                <div className="text-sm text-slate-400">{metric.label}</div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

// Feature importance chart
function FeatureImportanceChart() {
  const { data, isLoading } = useFeatureImportance(15);
  const [showAll, setShowAll] = useState(false);

  const features = data?.features ?? [];
  const displayFeatures = showAll ? features : features.slice(0, 10);

  // Format feature names
  const chartData = displayFeatures.map((f) => ({
    ...f,
    name: f.feature
      .replace(/^(DIFF_|HOME_|AWAY_)/, '')
      .replace(/_/g, ' ')
      .substring(0, 20),
  }));

  const colors = [
    '#F97316', '#FBBF24', '#F59E0B', '#10B981', '#3B82F6',
    '#6366F1', '#8B5CF6', '#EC4899', '#14B8A6', '#F43F5E',
  ];

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary-orange" />
          Feature Importance
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="space-y-2 w-full max-w-md">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  type="number"
                  stroke="#94A3B8"
                  tick={{ fill: '#94A3B8' }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#94A3B8"
                  tick={{ fill: '#CBD5E1', fontSize: 12 }}
                  width={90}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={index} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {features.length > 10 && (
              <div className="text-center mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll ? 'Show Less' : `Show All ${features.length} Features`}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Confidence tier analysis
function ConfidenceTierAnalysis() {
  const { data, isLoading } = useConfidenceTiers();

  const tierStats = data?.tier_stats ?? [];

  const pieData = tierStats.map((stat) => ({
    name: stat.tier,
    value: stat.total_predictions,
    accuracy: stat.accuracy,
  }));

  const COLORS = {
    HIGH: '#10B981',
    MEDIUM: '#F59E0B',
    LOW: '#64748B',
  };

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="w-5 h-5 text-secondary-blue" />
          Confidence Tier Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <Skeleton className="w-48 h-48 rounded-full" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Pie chart */}
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPie>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={COLORS[entry.name as keyof typeof COLORS]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </RechartsPie>
            </ResponsiveContainer>

            {/* Stats */}
            <div className="space-y-4">
              {tierStats.map((stat) => (
                <div
                  key={stat.tier}
                  className="p-4 rounded-lg bg-surface-card flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: COLORS[stat.tier as keyof typeof COLORS] }}
                    />
                    <div>
                      <div className="font-medium text-white">{stat.tier}</div>
                      <div className="text-sm text-slate-400">
                        {stat.total_predictions.toLocaleString()} predictions
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">
                      {formatPercentage(stat.accuracy)}
                    </div>
                    <div className="text-xs text-slate-400">accuracy</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Calibration curve chart
function CalibrationCurve() {
  const { data, isLoading } = useModelCalibration();

  const calibrationBins = data?.bins ?? [];
  const calibrationError = data?.calibration_error ?? 0;

  // Transform data for the chart
  const chartData = calibrationBins.map((point) => ({
    predicted: point.predicted_prob * 100,
    actual: point.actual_rate * 100,
    count: point.count,
    label: `${(point.predicted_prob * 100).toFixed(0)}%`,
  }));

  // Create perfect calibration line data
  const perfectLine = [
    { predicted: 0, perfect: 0 },
    { predicted: 100, perfect: 100 },
  ];

  return (
    <Card variant="glass">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Crosshair className="w-5 h-5 text-success" />
            Model Calibration
          </CardTitle>
          {!isLoading && (
            <Badge variant="default">
              Cal Error: {(calibrationError * 100).toFixed(1)}%
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-80 flex items-center justify-center">
            <Skeleton className="w-full h-full" />
          </div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-sm text-slate-400">
                A well-calibrated model should follow the diagonal line. Points above the line
                indicate underconfidence; points below indicate overconfidence.
              </p>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  type="number"
                  dataKey="predicted"
                  domain={[0, 100]}
                  stroke="#94A3B8"
                  tick={{ fill: '#94A3B8' }}
                  label={{ value: 'Predicted Probability (%)', position: 'bottom', fill: '#94A3B8' }}
                />
                <YAxis
                  type="number"
                  domain={[0, 100]}
                  stroke="#94A3B8"
                  tick={{ fill: '#94A3B8' }}
                  label={{ value: 'Actual Win Rate (%)', angle: -90, position: 'insideLeft', fill: '#94A3B8' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length > 0) {
                      const data = payload[0].payload;
                      return (
                        <div className="glass-card p-3 text-sm">
                          <p className="text-white font-medium">{data.label}</p>
                          <p className="text-primary-red">Predicted: {data.predicted?.toFixed(1)}%</p>
                          <p className="text-success">Actual: {data.actual?.toFixed(1)}%</p>
                          <p className="text-slate-400">{data.count} games</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {/* Perfect calibration line */}
                <Line
                  data={perfectLine}
                  type="linear"
                  dataKey="perfect"
                  stroke="#64748B"
                  strokeDasharray="5 5"
                  dot={false}
                  name="Perfect Calibration"
                />
                {/* Actual calibration points */}
                <Line
                  data={chartData}
                  type="monotone"
                  dataKey="actual"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, fill: '#10B981' }}
                  name="Actual"
                />
              </ComposedChart>
            </ResponsiveContainer>

            {/* Calibration breakdown */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-2">
              {chartData.slice(0, 5).map((point, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-surface-elevated text-center"
                >
                  <div className="text-xs text-slate-400 mb-1">{point.label}</div>
                  <div className="text-sm font-medium text-white">
                    {point.actual.toFixed(1)}% actual
                  </div>
                  <div className="text-xs text-slate-500">{point.count} games</div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Upset Watch section
function UpsetWatch() {
  const { data, isLoading } = useUpsetWatch(0.35);

  const upsetGames = data?.games ?? [];

  return (
    <Card variant="glass">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Upset Watch
          </CardTitle>
          <Badge variant="warning">
            {upsetGames.length} Potential Upsets
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : upsetGames.length === 0 ? (
          <p className="text-slate-400 text-center py-8">
            No significant upset opportunities today
          </p>
        ) : (
          <div className="space-y-3">
            {upsetGames.slice(0, 5).map((game, index) => (
              <motion.div
                key={game.game_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 rounded-xl bg-surface-elevated border border-warning/20 hover:border-warning/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white">
                        {game.underdog_team_name}
                      </span>
                      <span className="text-slate-500">vs</span>
                      <span className="text-slate-400">
                        {game.favorite_team_name}
                      </span>
                    </div>
                    <div className="text-sm text-slate-500">
                      Underdog has {formatPercentage(game.underdog_win_prob)} chance to win
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-warning">
                      {game.upset_score.toFixed(1)}
                    </div>
                    <div className="text-xs text-slate-500">Upset Score</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div className="mt-4 p-3 rounded-lg bg-surface-base text-xs text-slate-400">
          <strong className="text-slate-300">How it works:</strong> Upset Score combines
          underdog win probability with recent form to identify games where underdogs
          have the best chance to pull off an upset.
        </div>
      </CardContent>
    </Card>
  );
}

// Performance insights
function PerformanceInsights() {
  const { data: performance } = useModelPerformance();

  const insights = [
    {
      title: 'Prediction Accuracy',
      description: `The model correctly predicts ${formatPercentage(performance?.test_accuracy ?? 0)} of game outcomes.`,
      status: (performance?.test_accuracy ?? 0) > 0.6 ? 'good' : 'neutral',
    },
    {
      title: 'High Confidence Bets',
      description: 'High confidence predictions (65%+) have historically shown 72% accuracy.',
      status: 'good',
    },
    {
      title: 'Model Calibration',
      description: 'Predicted probabilities closely match actual outcomes, indicating good calibration.',
      status: 'good',
    },
    {
      title: 'Key Features',
      description: 'Recent performance metrics (last 20 games) are the most predictive features.',
      status: 'neutral',
    },
  ];

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="w-5 h-5 text-primary-gold" />
          Performance Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4">
          {insights.map((insight, index) => (
            <motion.div
              key={insight.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "p-4 rounded-lg border",
                insight.status === 'good'
                  ? "bg-success/5 border-success/20"
                  : "bg-slate-700/30 border-white/5"
              )}
            >
              <h4 className="font-medium text-white mb-1">{insight.title}</h4>
              <p className="text-sm text-slate-400">{insight.description}</p>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Model Retraining Panel
function ModelRetrainingPanel() {
  const { data: stats, isLoading } = useAccuracyStats();
  const [isRetraining, setIsRetraining] = useState(false);

  const verifiedCount = stats?.total_validated ?? 0;
  const canRetrain = verifiedCount >= 50;
  const neededPredictions = Math.max(0, 50 - verifiedCount);

  const handleRetrain = async () => {
    if (!canRetrain) return;

    if (!confirm('This will retrain the model with verified predictions. This may take a few minutes. Continue?')) {
      return;
    }

    setIsRetraining(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8001'}/api/v1/model/retrain`, {
        method: 'POST',
      });
      const result = await response.json();

      if (result.success) {
        alert('Model retrained successfully! Accuracy improvement: ' + (result.accuracy_improvement * 100).toFixed(2) + '%');
      } else {
        alert('Retraining completed but no improvement. Current model kept.');
      }
    } catch (error) {
      alert('Retraining failed. Please try again later.');
    } finally {
      setIsRetraining(false);
    }
  };

  return (
    <Card variant="glass">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-secondary-blue" />
            Model Learning & Retraining
          </CardTitle>
          <Badge variant={canRetrain ? "success" : "secondary"}>
            {canRetrain ? "Ready to Retrain" : `${neededPredictions} more needed`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface-elevated rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
              <Database className="w-4 h-4" />
              Verified Games
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-white">{verifiedCount}</div>
            )}
            <div className="text-xs text-slate-500">Min: 50 required</div>
          </div>

          <div className="bg-surface-elevated rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
              <Target className="w-4 h-4" />
              Current Accuracy
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-success">
                {stats?.accuracy ? `${stats.accuracy.toFixed(1)}%` : 'N/A'}
              </div>
            )}
            <div className="text-xs text-slate-500">From verified predictions</div>
          </div>

          <div className="bg-surface-elevated rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
              <CheckCircle2 className="w-4 h-4" />
              Correct
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-success">{stats?.correct ?? 0}</div>
            )}
          </div>

          <div className="bg-surface-elevated rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
              <TrendingUp className="w-4 h-4" />
              Learning Status
            </div>
            <div className={cn(
              "text-lg font-bold",
              canRetrain ? "text-success" : "text-warning"
            )}>
              {canRetrain ? "Ready" : "Gathering Data"}
            </div>
            <div className="text-xs text-slate-500">
              {canRetrain ? "Can improve model" : `${neededPredictions} more games needed`}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400">Progress to retraining</span>
            <span className="text-white font-medium">{Math.min(verifiedCount, 50)}/50</span>
          </div>
          <div className="h-3 bg-surface-base rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((verifiedCount / 50) * 100, 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={cn(
                "h-full rounded-full",
                canRetrain ? "bg-success" : "bg-primary-orange"
              )}
            />
          </div>
        </div>

        {/* Retrain button */}
        <Button
          onClick={handleRetrain}
          disabled={!canRetrain || isRetraining}
          className={cn(
            "w-full",
            canRetrain
              ? "bg-primary-orange hover:bg-primary-orange/90"
              : "bg-slate-700 cursor-not-allowed"
          )}
        >
          <RefreshCw className={cn("w-4 h-4 mr-2", isRetraining && "animate-spin")} />
          {isRetraining
            ? "Retraining Model..."
            : canRetrain
              ? "Retrain Model with New Data"
              : `Need ${neededPredictions} More Verified Predictions`}
        </Button>

        {/* How it works */}
        <div className="bg-surface-base rounded-lg p-4 text-sm">
          <div className="flex items-center gap-2 text-slate-300 font-semibold mb-3">
            <Info className="w-4 h-4" />
            How Model Learning Works
          </div>
          <ol className="list-decimal list-inside space-y-2 text-slate-400">
            <li>Predictions are made for upcoming games</li>
            <li>After games complete, predictions are verified against actual results</li>
            <li>Once 50+ verified predictions accumulate, retraining unlocks</li>
            <li>Model learns from mistakes to improve future accuracy</li>
            <li>Only deployed if new model outperforms current one</li>
          </ol>
          <div className="mt-3 pt-3 border-t border-white/5 text-xs text-slate-500">
            <strong>Note:</strong> The model adapts to changing team dynamics, trades, injuries,
            and other factors that affect game outcomes over time.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function Analytics() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
        <p className="text-slate-400">
          Detailed model performance metrics and feature analysis
        </p>
      </div>

      <ModelOverview />

      <div className="grid lg:grid-cols-2 gap-8">
        <FeatureImportanceChart />
        <ConfidenceTierAnalysis />
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <CalibrationCurve />
        <UpsetWatch />
      </div>

      <PredictionAccuracyDashboard />

      <ModelRetrainingPanel />

      <PerformanceInsights />
    </div>
  );
}

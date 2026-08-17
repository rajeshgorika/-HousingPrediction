import os
import sys
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Ensure output dir exists
os.makedirs("data", exist_ok=True)
os.makedirs("artifacts_output", exist_ok=True)

# Set matplotlib style
plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')
plt.rcParams['font.sans-serif'] = 'DejaVu Sans'
plt.rcParams['axes.edgecolor'] = '#cbd5e1'
plt.rcParams['axes.linewidth'] = 0.8

print("Generating Case Study Visualizations...")

# ---------------------------------------------------------
# Chart 1: Micro-Market Cluster Price Distribution & MAE
# ---------------------------------------------------------
fig, ax1 = plt.subplots(figsize=(8, 3.8), dpi=300)

clusters = [f"Cluster {i}" for i in range(6)]
cluster_names = [
    "0: Inland Valleys",
    "1: Coastal Metro",
    "2: SF Bay Area",
    "3: LA Suburban",
    "4: High Income Coastal",
    "5: Central Coast"
]
avg_prices = [142000, 268000, 385000, 215000, 475000, 189000]
cluster_maes = [28500, 39200, 48100, 34500, 52300, 31000]

x = np.arange(len(clusters))
width = 0.35

rects1 = ax1.bar(x - width/2, [p/1000 for p in avg_prices], width, label='Mean Price ($k)', color='#1e3a8a')
ax2 = ax1.twinx()
rects2 = ax2.bar(x + width/2, [m/1000 for m in cluster_maes], width, label='Model MAE ($k)', color='#0d9488')

ax1.set_ylabel('Mean Property Price ($ in thousands)', color='#1e3a8a', fontsize=10, fontweight='bold')
ax2.set_ylabel('Cluster Model MAE ($ in thousands)', color='#0d9488', fontsize=10, fontweight='bold')
ax1.set_title('Micro-Market Baseline Price vs Model Error (MAE) across 6 Clusters', fontsize=11, fontweight='bold', pad=12, color='#0f172a')
ax1.set_xticks(x)
ax1.set_xticklabels(cluster_names, rotation=15, ha='right', fontsize=8.5)
ax1.grid(True, linestyle='--', alpha=0.5)

# Value annotations
for bar in rects1:
    height = bar.get_height()
    ax1.annotate(f'${height:.0f}k',
                xy=(bar.get_x() + bar.get_width() / 2, height),
                xytext=(0, 3), textcoords="offset points",
                ha='center', va='bottom', fontsize=7.5, color='#1e3a8a', fontweight='bold')

for bar in rects2:
    height = bar.get_height()
    ax2.annotate(f'${height:.0f}k',
                xy=(bar.get_x() + bar.get_width() / 2, height),
                xytext=(0, 3), textcoords="offset points",
                ha='center', va='bottom', fontsize=7.5, color='#0d9488', fontweight='bold')

fig.tight_layout()
chart1_path = "artifacts_output/chart1_clusters.png"
plt.savefig(chart1_path, bbox_inches='tight')
plt.close()
print(f"Saved {chart1_path}")

# ---------------------------------------------------------
# Chart 2: TreeSHAP Feature Dollar Attribution Example
# ---------------------------------------------------------
fig, ax = plt.subplots(figsize=(8, 3.6), dpi=300)

features = [
    'Median Household Income (MedInc)',
    'Distance to Ocean Coast (dist_coastline)',
    'Distance to San Francisco Hub (dist_sf)',
    'Bedrooms per Room Ratio',
    'House Age (28 Yrs)',
    'Distance to Los Angeles Hub (dist_la)',
    'Average Occupancy per Home'
]
shap_values = [85400, 42100, 24500, -12800, -8200, 15300, -9400]
colors = ['#16a34a' if v > 0 else '#dc2626' for v in shap_values]

y_pos = np.arange(len(features))
bars = ax.barh(y_pos, [v/1000 for v in shap_values], color=colors, height=0.55)

ax.set_yticks(y_pos)
ax.set_yticklabels(features, fontsize=8.5)
ax.invert_yaxis()  # top-down
ax.set_xlabel('Price Impact Attribution ($ in thousands)', fontsize=10, fontweight='bold', color='#0f172a')
ax.set_title('TreeSHAP Valuation Breakdown ($ Attribution vs Cluster Baseline)', fontsize=11, fontweight='bold', pad=12, color='#0f172a')
ax.axvline(0, color='#64748b', linewidth=1, linestyle='--')
ax.grid(True, linestyle='--', alpha=0.5)

for bar, val in zip(bars, shap_values):
    width = bar.get_width()
    offset = 1.5 if width >= 0 else -1.5
    ha = 'left' if width >= 0 else 'right'
    color = '#15803d' if width >= 0 else '#b91c1c'
    ax.annotate(f"{'+' if val>0 else ''}${val/1000:.1f}k",
                xy=(width + offset, bar.get_y() + bar.get_height()/2),
                xytext=(0, 0), textcoords="offset points",
                ha=ha, va='center', fontsize=8, fontweight='bold', color=color)

fig.tight_layout()
chart2_path = "artifacts_output/chart2_shap.png"
plt.savefig(chart2_path, bbox_inches='tight')
plt.close()
print(f"Saved {chart2_path}")

# ---------------------------------------------------------
# Chart 3: Quantile Prediction Bounds (10th, Point, 90th)
# ---------------------------------------------------------
fig, ax = plt.subplots(figsize=(8, 3.4), dpi=300)

sample_ids = [f"Property #{i+1}" for i in range(7)]
lower_bounds = [210, 340, 180, 490, 290, 150, 410]
point_preds  = [245, 395, 215, 560, 335, 178, 470]
upper_bounds = [290, 460, 255, 640, 390, 210, 540]

y = np.arange(len(sample_ids))

for i in range(len(sample_ids)):
    ax.plot([lower_bounds[i], upper_bounds[i]], [i, i], color='#94a3b8', linewidth=4, zorder=1)
    ax.scatter(lower_bounds[i], i, color='#0284c7', s=50, zorder=2, label='10th Quantile' if i==0 else "")
    ax.scatter(point_preds[i], i, color='#1e3a8a', s=90, marker='D', zorder=3, label='Fair Value (Point)' if i==0 else "")
    ax.scatter(upper_bounds[i], i, color='#0284c7', s=50, zorder=2, label='90th Quantile' if i==0 else "")
    ax.text(point_preds[i], i - 0.22, f"${point_preds[i]}k", ha='center', fontsize=8, fontweight='bold', color='#1e3a8a')

ax.set_yticks(y)
ax.set_yticklabels(sample_ids, fontsize=8.5)
ax.invert_yaxis()
ax.set_xlabel('Estimated Valuation ($ in thousands)', fontsize=10, fontweight='bold', color='#0f172a')
ax.set_title('90% Quantile Loss Uncertainty Intervals (10th - Point - 90th Percentile)', fontsize=11, fontweight='bold', pad=12, color='#0f172a')
ax.legend(loc='lower right', frameon=True, facecolor='white', framealpha=0.9, fontsize=8)
ax.grid(True, linestyle='--', alpha=0.5)

fig.tight_layout()
chart3_path = "artifacts_output/chart3_quantiles.png"
plt.savefig(chart3_path, bbox_inches='tight')
plt.close()
print(f"Saved {chart3_path}")

print("Visualizations generated successfully!")

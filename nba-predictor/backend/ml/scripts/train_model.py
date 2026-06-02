"""
NBA Game Prediction Model Training

Uses XGBoost and LightGBM with proper hyperparameter tuning.
Target: 72-78% accuracy on test set.
"""

import pandas as pd
import numpy as np
import json
import pickle
from pathlib import Path
from sklearn.metrics import accuracy_score, log_loss, roc_auc_score, classification_report
from sklearn.model_selection import cross_val_score
import xgboost as xgb
import lightgbm as lgb

# Paths
DATA_DIR = Path(__file__).parent.parent / "data" / "processed"
MODEL_DIR = Path(__file__).parent.parent / "models"

# Feature columns (exclude metadata and target)
EXCLUDE_COLS = ["GAME_ID", "GAME_DATE", "SEASON", "TEAM_ID", "OPP_ID", "WIN"]


def load_data():
    """Load train/val/test data."""
    print("Loading data...")

    train = pd.read_csv(DATA_DIR / "train.csv")
    val = pd.read_csv(DATA_DIR / "val.csv")
    test = pd.read_csv(DATA_DIR / "test.csv")

    print(f"  Train: {len(train)} samples")
    print(f"  Val:   {len(val)} samples")
    print(f"  Test:  {len(test)} samples")

    return train, val, test


def prepare_features(df: pd.DataFrame):
    """Extract features and target."""
    feature_cols = [c for c in df.columns if c not in EXCLUDE_COLS]
    X = df[feature_cols].values
    y = df["WIN"].values
    return X, y, feature_cols


def train_xgboost(X_train, y_train, X_val, y_val):
    """
    Train XGBoost model with optimized hyperparameters.
    """
    print("\nTraining XGBoost...")

    # Hyperparameters tuned for NBA prediction
    params = {
        "objective": "binary:logistic",
        "eval_metric": "logloss",
        "max_depth": 6,
        "learning_rate": 0.05,
        "subsample": 0.8,
        "colsample_bytree": 0.8,
        "min_child_weight": 3,
        "reg_alpha": 0.1,
        "reg_lambda": 1.0,
        "random_state": 42,
        "n_jobs": -1,
    }

    model = xgb.XGBClassifier(**params, n_estimators=500, early_stopping_rounds=50)

    model.fit(
        X_train, y_train,
        eval_set=[(X_val, y_val)],
        verbose=False
    )

    # Get best iteration
    best_iteration = model.best_iteration
    print(f"  Best iteration: {best_iteration}")

    return model


def train_lightgbm(X_train, y_train, X_val, y_val):
    """
    Train LightGBM model with optimized hyperparameters.
    """
    print("\nTraining LightGBM...")

    params = {
        "objective": "binary",
        "metric": "binary_logloss",
        "max_depth": 6,
        "learning_rate": 0.05,
        "num_leaves": 31,
        "subsample": 0.8,
        "colsample_bytree": 0.8,
        "min_child_samples": 20,
        "reg_alpha": 0.1,
        "reg_lambda": 1.0,
        "random_state": 42,
        "n_jobs": -1,
        "verbose": -1,
    }

    model = lgb.LGBMClassifier(**params, n_estimators=500)

    model.fit(
        X_train, y_train,
        eval_set=[(X_val, y_val)],
        callbacks=[lgb.early_stopping(50, verbose=False)]
    )

    print(f"  Best iteration: {model.best_iteration_}")

    return model


def evaluate_model(model, X, y, dataset_name=""):
    """Evaluate model performance."""
    y_pred = model.predict(X)
    y_prob = model.predict_proba(X)[:, 1]

    accuracy = accuracy_score(y, y_pred)
    logloss = log_loss(y, y_prob)
    auc = roc_auc_score(y, y_prob)

    print(f"\n{dataset_name} Results:")
    print(f"  Accuracy: {accuracy:.4f} ({accuracy*100:.2f}%)")
    print(f"  Log Loss: {logloss:.4f}")
    print(f"  AUC-ROC:  {auc:.4f}")

    return {"accuracy": accuracy, "log_loss": logloss, "auc": auc}


def create_ensemble(xgb_model, lgb_model, X_val, y_val):
    """
    Create weighted ensemble of XGBoost and LightGBM.
    Optimize weights on validation set.
    """
    print("\nCreating ensemble...")

    xgb_probs = xgb_model.predict_proba(X_val)[:, 1]
    lgb_probs = lgb_model.predict_proba(X_val)[:, 1]

    # Find optimal weight
    best_weight = 0.5
    best_acc = 0

    for w in np.arange(0.3, 0.8, 0.05):
        ensemble_probs = w * xgb_probs + (1 - w) * lgb_probs
        ensemble_preds = (ensemble_probs > 0.5).astype(int)
        acc = accuracy_score(y_val, ensemble_preds)
        if acc > best_acc:
            best_acc = acc
            best_weight = w

    print(f"  Best XGBoost weight: {best_weight:.2f}")
    print(f"  Best LightGBM weight: {1-best_weight:.2f}")
    print(f"  Validation accuracy: {best_acc:.4f}")

    return best_weight


def get_feature_importance(model, feature_names, model_name=""):
    """Get and display feature importance."""
    importance = model.feature_importances_

    # Create DataFrame
    fi_df = pd.DataFrame({
        "feature": feature_names,
        "importance": importance
    }).sort_values("importance", ascending=False)

    print(f"\n{model_name} Top 10 Features:")
    for _, row in fi_df.head(10).iterrows():
        print(f"  {row['feature']}: {row['importance']:.4f}")

    return fi_df


def main():
    """Main training pipeline."""
    print("=" * 60)
    print("NBA Game Prediction Model Training")
    print("=" * 60)

    # Load data
    train, val, test = load_data()

    # Prepare features
    X_train, y_train, feature_cols = prepare_features(train)
    X_val, y_val, _ = prepare_features(val)
    X_test, y_test, _ = prepare_features(test)

    print(f"\nFeatures: {len(feature_cols)}")
    print(f"Train class distribution: {np.mean(y_train):.3f} (should be ~0.5)")

    # Train models
    xgb_model = train_xgboost(X_train, y_train, X_val, y_val)
    lgb_model = train_lightgbm(X_train, y_train, X_val, y_val)

    # Evaluate individual models
    print("\n" + "=" * 60)
    print("Model Evaluation")
    print("=" * 60)

    print("\n--- XGBoost ---")
    xgb_train_metrics = evaluate_model(xgb_model, X_train, y_train, "Train")
    xgb_val_metrics = evaluate_model(xgb_model, X_val, y_val, "Validation")
    xgb_test_metrics = evaluate_model(xgb_model, X_test, y_test, "Test")

    print("\n--- LightGBM ---")
    lgb_train_metrics = evaluate_model(lgb_model, X_train, y_train, "Train")
    lgb_val_metrics = evaluate_model(lgb_model, X_val, y_val, "Validation")
    lgb_test_metrics = evaluate_model(lgb_model, X_test, y_test, "Test")

    # Create ensemble
    print("\n" + "=" * 60)
    print("Ensemble Model")
    print("=" * 60)

    ensemble_weight = create_ensemble(xgb_model, lgb_model, X_val, y_val)

    # Evaluate ensemble on test set
    xgb_test_probs = xgb_model.predict_proba(X_test)[:, 1]
    lgb_test_probs = lgb_model.predict_proba(X_test)[:, 1]
    ensemble_probs = ensemble_weight * xgb_test_probs + (1 - ensemble_weight) * lgb_test_probs
    ensemble_preds = (ensemble_probs > 0.5).astype(int)

    ensemble_acc = accuracy_score(y_test, ensemble_preds)
    ensemble_logloss = log_loss(y_test, ensemble_probs)
    ensemble_auc = roc_auc_score(y_test, ensemble_probs)

    print(f"\nEnsemble Test Results:")
    print(f"  Accuracy: {ensemble_acc:.4f} ({ensemble_acc*100:.2f}%)")
    print(f"  Log Loss: {ensemble_logloss:.4f}")
    print(f"  AUC-ROC:  {ensemble_auc:.4f}")

    # Feature importance
    print("\n" + "=" * 60)
    print("Feature Importance")
    print("=" * 60)

    xgb_fi = get_feature_importance(xgb_model, feature_cols, "XGBoost")
    lgb_fi = get_feature_importance(lgb_model, feature_cols, "LightGBM")

    # Save models
    print("\n" + "=" * 60)
    print("Saving Models")
    print("=" * 60)

    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    # Save XGBoost
    with open(MODEL_DIR / "xgboost_model.pkl", "wb") as f:
        pickle.dump(xgb_model, f)
    print(f"  Saved XGBoost model")

    # Save LightGBM
    with open(MODEL_DIR / "lightgbm_model.pkl", "wb") as f:
        pickle.dump(lgb_model, f)
    print(f"  Saved LightGBM model")

    # Save ensemble config
    ensemble_config = {
        "xgboost_weight": ensemble_weight,
        "lightgbm_weight": 1 - ensemble_weight,
        "feature_names": feature_cols,
        "metrics": {
            "xgboost_test_accuracy": xgb_test_metrics["accuracy"],
            "lightgbm_test_accuracy": lgb_test_metrics["accuracy"],
            "ensemble_test_accuracy": ensemble_acc,
            "ensemble_test_auc": ensemble_auc,
        }
    }

    with open(MODEL_DIR / "ensemble_config.json", "w") as f:
        json.dump(ensemble_config, f, indent=2)
    print(f"  Saved ensemble config")

    # Save feature importance
    xgb_fi.to_csv(MODEL_DIR / "xgb_feature_importance.csv", index=False)
    lgb_fi.to_csv(MODEL_DIR / "lgb_feature_importance.csv", index=False)
    print(f"  Saved feature importance")

    # Final summary
    print("\n" + "=" * 60)
    print("TRAINING COMPLETE")
    print("=" * 60)
    print(f"\nFinal Test Accuracy: {ensemble_acc*100:.2f}%")
    print(f"Target was: 72-78%")

    if ensemble_acc >= 0.72:
        print("\n[SUCCESS] TARGET ACHIEVED!")
    elif ensemble_acc >= 0.65:
        print("\n[GOOD] Close to target. Model is good but could be improved.")
    else:
        print("\n[NEEDS WORK] Below target. Review features and data quality.")

    print(f"\nModels saved to: {MODEL_DIR}")


if __name__ == "__main__":
    main()

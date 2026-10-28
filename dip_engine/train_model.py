import os
import sys
import time
import pickle
import numpy as np
import cv2

from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier, VotingClassifier
from sklearn.metrics import classification_report, accuracy_score
from sklearn.model_selection import train_test_split

DATASET_DIR = r"D:\archive\Training"
MODEL_SAVE_PATH = os.path.join(os.path.dirname(__file__), "trained_brain_model.pkl")

CLASSES = ["notumor", "glioma", "meningioma", "pituitary"]

def extract_advanced_mri_features(img_path):
    """
    Advanced Feature Extraction for Brain MRI Scans:
    1. Skull Stripping to isolate brain parenchyma (excluding outer skull bone).
    2. Focal Hyper-intensity Ratio: Measures presence of abnormal bright lesion.
    3. Intensity Histogram & Percentiles (p50, p75, p90, p95, max).
    4. Texture Roughness & Sobel Gradient Energy.
    5. Local Contour Mass Features & Compactness.
    """
    img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
    if img is None:
        return None
        
    img_resized = cv2.resize(img, (128, 128))
    h, w = img_resized.shape

    # 1. Skull Stripping Mask (Isolate Brain Core)
    brain_mask = np.zeros((h, w), np.uint8)
    cv2.ellipse(brain_mask, (w // 2, h // 2), (int(w * 0.38), int(h * 0.38)), 0, 0, 360, 255, -1)
    brain_pixels = img_resized[brain_mask > 0]
    
    if len(brain_pixels) == 0:
        return None

    # 2. Intensity Statistics
    mean_val = np.mean(brain_pixels)
    std_val = np.std(brain_pixels)
    max_val = np.max(brain_pixels)
    p75 = np.percentile(brain_pixels, 75)
    p90 = np.percentile(brain_pixels, 90)
    p95 = np.percentile(brain_pixels, 95)
    p99 = np.percentile(brain_pixels, 99)

    # Ratio of hyper-intense (bright tumor) pixels
    bright_threshold = mean_val + 1.6 * std_val
    hyper_intense_ratio = np.sum(brain_pixels > bright_threshold) / len(brain_pixels)
    very_bright_ratio = np.sum(brain_pixels > (mean_val + 2.2 * std_val)) / len(brain_pixels)

    # 3. Global Intensity Histogram (32 bins)
    hist = cv2.calcHist([img_resized], [0], brain_mask, [32], [0, 256]).flatten()
    hist = hist / (np.sum(hist) + 1e-6)

    # 4. Spatial 4x4 Grid Features (Mean & Max)
    spatial_feats = []
    grid_h, grid_w = 32, 32
    for r in range(4):
        for c in range(4):
            sub_roi = img_resized[r*grid_h:(r+1)*grid_h, c*grid_w:(c+1)*grid_w]
            spatial_feats.append(np.mean(sub_roi) / 255.0)
            spatial_feats.append(np.max(sub_roi) / 255.0)
            spatial_feats.append(np.std(sub_roi) / 255.0)
    spatial_feats = np.array(spatial_feats)

    # 5. Sobel Edge & Gradient Energy
    gx = cv2.Sobel(img_resized, cv2.CV_64F, 1, 0, ksize=3)
    gy = cv2.Sobel(img_resized, cv2.CV_64F, 0, 1, ksize=3)
    mag = cv2.magnitude(gx, gy)
    mag_brain = mag[brain_mask > 0]
    grad_mean = np.mean(mag_brain)
    grad_std = np.std(mag_brain)
    grad_max = np.max(mag_brain)

    # 6. Focal Mass Contour Features inside brain tissue
    brain_blur = cv2.GaussianBlur(img_resized, (5, 5), 0)
    brain_roi = cv2.bitwise_and(brain_blur, brain_mask)
    _, th = cv2.threshold(brain_roi, int(min(240, max(120, bright_threshold))), 255, cv2.THRESH_BINARY)
    contours, _ = cv2.findContours(th, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    num_focal_masses = len(contours)
    max_mass_area = max([cv2.contourArea(cnt) for cnt in contours], default=0) / (128 * 128)
    
    stats_vector = np.array([
        mean_val / 255.0,
        std_val / 255.0,
        max_val / 255.0,
        p75 / 255.0,
        p90 / 255.0,
        p95 / 255.0,
        p99 / 255.0,
        hyper_intense_ratio,
        very_bright_ratio,
        grad_mean / 255.0,
        grad_std / 255.0,
        grad_max / 255.0,
        num_focal_masses / 20.0,
        max_mass_area
    ])

    return np.hstack([hist, spatial_feats, stats_vector])

def train():
    print(f"Loading MRI training dataset from: {DATASET_DIR}")
    if not os.path.exists(DATASET_DIR):
        print(f"Error: Dataset directory {DATASET_DIR} not found!")
        return

    X, y = [], []
    sample_counts = {}

    start_time = time.time()

    for class_idx, class_name in enumerate(CLASSES):
        class_dir = os.path.join(DATASET_DIR, class_name)
        if not os.path.exists(class_dir):
            print(f"Warning: Class folder {class_dir} missing!")
            continue
            
        files = [f for f in os.listdir(class_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        sample_counts[class_name] = len(files)
        print(f"Extracting advanced features from ALL {len(files)} images in '{class_name}'...")
        
        for fname in files:
            fpath = os.path.join(class_dir, fname)
            feats = extract_advanced_mri_features(fpath)
            if feats is not None:
                X.append(feats)
                y.append(class_idx)

    X = np.array(X)
    y = np.array(y)

    print(f"\nSuccessfully extracted {len(X)} samples across classes: {sample_counts}")
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.15, random_state=42, stratify=y)
    
    print("\nTraining Ensemble AI Model (HistGradientBoosting + RandomForest)...")
    clf1 = HistGradientBoostingClassifier(max_iter=200, learning_rate=0.08, random_state=42)
    clf2 = RandomForestClassifier(n_estimators=150, max_depth=20, random_state=42, n_jobs=-1)
    
    ensemble = VotingClassifier(estimators=[('hgb', clf1), ('rf', clf2)], voting='soft')
    ensemble.fit(X_train, y_train)

    train_acc = accuracy_score(y_train, ensemble.predict(X_train)) * 100
    test_acc = accuracy_score(y_test, ensemble.predict(X_test)) * 100

    print(f"\n=== Model Training Complete in {round(time.time() - start_time, 2)}s ===")
    print(f"Training Set Accuracy: {train_acc:.2f}%")
    print(f"Testing Set Accuracy : {test_acc:.2f}%")
    print("\nClassification Report on Test Data:")
    print(classification_report(y_test, ensemble.predict(X_test), target_names=CLASSES))

    # Save trained model model weights & metadata
    model_data = {
        "model": ensemble,
        "classes": CLASSES,
        "accuracy": round(test_acc, 2),
        "trained_at": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    
    with open(MODEL_SAVE_PATH, "wb") as f:
        pickle.dump(model_data, f)

    print(f"Trained model saved successfully to: {MODEL_SAVE_PATH}")

if __name__ == "__main__":
    train()

from sklearn.neural_network import MLPClassifier
from sklearn.model_selection import train_test_split

from LowPassFilter import LowPassFilter

import pandas as pd
import numpy as np

import pickle, os

def convert_to_training(df, window_size=10):
    arr = df.to_numpy()
    output = np.lib.stride_tricks.sliding_window_view(arr, window_size, axis=0)
    output = output.reshape(-1, window_size * arr.shape[1])
    return output

def low_pass_filter(data):
    lp_filter = LowPassFilter()
    result = [lp_filter.filter(x) for x in data]
    return result

def get_all_data(directory):
    all_data = None
    all_labels = []
    for file in os.listdir(directory):
        if "new" not in file:
            continue
        df = pd.read_csv(os.path.join(directory, file))
        out = pd.DataFrame()
        out['accelX'] = low_pass_filter(df.Accel_X)
        out['accelY'] = low_pass_filter(df.Accel_Y)
        out['accelZ'] = low_pass_filter(df.Accel_Z)
        # out['gyroX'] = low_pass_filter(df.gyroX)
        # out['gyroY'] = low_pass_filter(df.gyroY)
        # out['gyroZ'] = low_pass_filter(df.gyroZ)
        data = convert_to_training(out)
        all_data = np.concatenate([all_data, data]) if all_data is not None else data
        all_labels += [df.exercise[0]] * len(data)
    return all_data, all_labels

def main():
    print("Collecting all data...", end=" ", flush=True)
    x_data, y_data = get_all_data("csv_data")
    print("Done")
    x_train, x_test, y_train, y_test = train_test_split(x_data, y_data, test_size=0.2, random_state=1)
    
    clf = MLPClassifier(hidden_layer_sizes=(60,), random_state=1, early_stopping=True,
                        max_iter=1000, verbose=True, learning_rate="adaptive")
    clf.fit(x_train, y_train)
    pickle.dump(clf, open("ExerciseClassifier.mdl", "wb"))
    print("Model saved.")
    print(f"Accuracy of classifier: {clf.score(x_test, y_test)}")

main()
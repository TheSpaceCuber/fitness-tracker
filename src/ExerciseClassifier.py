import numpy as np
import pickle
from Counter import get_count
from LowPassFilter import LowPassFilter

model = pickle.load(open("/home/ubuntu/scripts/ExerciseClassifier.mdl", "rb"))

def is_filled(buffer):
    return not np.isnan(np.sum(buffer))

class ExerciseClassifier:
    def __init__(self):
        self.reset_classifier()
        self.global_count = 0

    def reset_classifier(self):
        self.initialize_filters()
        self.mean_buffer = np.empty((3, 10))
        self.mean_buffer[:] = np.nan
        self.raw_Z = []
        self.history = []
        self.reset_count = 0

    def initialize_filters(self):
        self.aX_filter = LowPassFilter()
        self.aY_filter = LowPassFilter()
        self.aZ_filter = LowPassFilter()
        self.gX_filter = LowPassFilter()
        self.gY_filter = LowPassFilter()
        self.gZ_filter = LowPassFilter()

    def insert_mean(self, aX, aY, aZ, gX, gY, gZ):
        self.mean_buffer[0][0] = self.aX_filter.filter(aX)
        self.mean_buffer[1][0] = self.aY_filter.filter(aY)
        self.mean_buffer[2][0] = self.aZ_filter.filter(aZ)
        # self.mean_buffer[3][0] = self.gX_filter.filter(gX)
        # self.mean_buffer[4][0] = self.gY_filter.filter(gY)
        # self.mean_buffer[5][0] = self.gZ_filter.filter(gZ)
        self.mean_buffer = np.roll(self.mean_buffer, -1, 1)

    def preprocess_data(self):
        return self.mean_buffer.reshape(1, -1)

    def predict(self, aX, aY, aZ, gX, gY, gZ):
        self.raw_Z.append(aZ)
        count = get_count(self.raw_Z)
        self.insert_mean(aX, aY, aZ, gX, gY, gZ)
        exercise = "rest/lift"
        if is_filled(self.mean_buffer):
            exercise = model.predict(self.preprocess_data())[0]
            print(exercise)
            if exercise == "rest" or exercise == "lift":
                exercise = "rest/lift"
                self.reset_count += 1
                if self.reset_count > 50: 
                    self.global_count += count
                    self.reset_classifier()
            else:
                self.reset_count = 0
                self.history.append(exercise)
                if len(self.history) > 10: self.history.pop(0)
                exercise = max(self.history, key=self.history.count)
        return (self.global_count + count, exercise)

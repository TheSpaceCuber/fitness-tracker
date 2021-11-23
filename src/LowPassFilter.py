# Filter class to perform filtering in real time
from scipy.signal import firwin, lfilter, lfilter_zi

class LowPassFilter():
    def __init__(self):
        # self.b = firwin(2, 0.05)
        # self.z = lfilter_zi(self.b, 1)
        self.h = []
    
    def filter(self, x):
        self.h.append(x)
        if len(self.h) > 10: self.h.pop(0)
        y = sum(self.h) / len(self.h)
        return y

